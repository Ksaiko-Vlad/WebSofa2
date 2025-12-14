// app/api/v1/driver/orders/route.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";
import { jsonSafe } from "@/lib/bigint";

function getToken(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  const cookieToken = req.cookies.get("auth_token")?.value || "";
  return bearer || cookieToken || null;
}

export async function GET(req: NextRequest) {
  try {
    const token = getToken(req);
    if (!token) {
      return NextResponse.json({ message: "Нет доступа" }, { status: 401 });
    }

    let payload: any;
    try {
      payload = await verifyJwt(token);
    } catch {
      return NextResponse.json({ message: "Неверный токен" }, { status: 401 });
    }

    if (payload.role !== "driver") {
      return NextResponse.json({ message: "Доступ запрещён" }, { status: 403 });
    }

    const orders = await prisma.orders.findMany({
      where: {
        status: "ready_to_ship",
        driver_id: null,
      },
      include: {
        address: true,
        items: {
          include: {
            productVariant: {
              include: {
                product: { select: { name: true } },
                material: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { created_at: "asc" },
    });

    const safeOrders = jsonSafe(orders);
    return NextResponse.json({ orders: safeOrders }, { status: 200 });
    
  } catch (e) {
    console.error("Error fetching available orders:", e);
    return NextResponse.json({ message: "Ошибка при получении заказов" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = getToken(req);
    if (!token) {
      return NextResponse.json({ message: "Нет доступа" }, { status: 401 });
    }

    let payload: any;
    try {
      payload = await verifyJwt(token);
    } catch {
      return NextResponse.json({ message: "Неверный токен" }, { status: 401 });
    }

    if (payload.role !== "driver") {
      return NextResponse.json({ message: "Доступ запрещён" }, { status: 403 });
    }

    const body = await req.json();
    const orderId = Number(body.orderId);
    const routeHint = body.routeHint || "";
    const comment = body.comment || null;

    if (!Number.isInteger(orderId) || orderId <= 0) {
      return NextResponse.json({ message: "orderId должен быть положительным числом" }, { status: 400 });
    }

    const driverId = BigInt(payload.sub);
    const bigOrderId = BigInt(orderId);

    // Проверяем, существует ли заказ и доступен ли он
    const order = await prisma.orders.findUnique({
      where: { id: bigOrderId },
      select: { id: true, status: true, driver_id: true },
    });

    if (!order) {
      return NextResponse.json({ message: "Заказ не найден" }, { status: 404 });
    }

    if (order.status !== "ready_to_ship") {
      return NextResponse.json({ 
        message: "Этот заказ не готов к отгрузке",
        currentStatus: order.status 
      }, { status: 400 });
    }

    if (order.driver_id !== null) {
      return NextResponse.json({ 
        message: "Этот заказ уже взят другим водителем" 
      }, { status: 400 });
    }

    // Атомарная транзакция
    const result = await prisma.$transaction(async (tx) => {
      // 1. Обновляем статус заказа и назначаем водителя
      const updatedOrder = await tx.orders.update({
        where: { id: bigOrderId },
        data: {
          status: "in_transit",
          driver_id: driverId,
        },
      });

      // 2. Создаём shipment с вложенной связью к заказу
      const shipment = await tx.shipments.create({
        data: {
          driver_id: driverId,
          status: "in_transit",
          route_hint: routeHint,
          comment: comment,
          planned_at: new Date(),
          started_at: new Date(),
          orders: {
            create: [
              {
                order_id: bigOrderId,
              },
            ],
          },
        },
        include: {
          orders: {
            include: {
              order: true,
            },
          },
        },
      });

      return { updatedOrder, shipment };
    });

    return NextResponse.json({ 
      message: "Заказ взят в доставку",
      shipmentId: result.shipment.id.toString(),
      orderId: result.updatedOrder.id.toString(),
    }, { status: 200 });

  } catch (e) {
    console.error("Error in POST /api/v1/driver/orders:", e);
    
    // Проверяем различные типы ошибок
    let errorMessage = "Ошибка при изменении статуса заказа";
    
    if (e instanceof Error) {
      console.error("Error details:", e.message);
      
      // Проверяем специфичные ошибки Prisma
      if (e.message.includes("Unique constraint")) {
        errorMessage = "Этот заказ уже связан с другим shipment";
      } else if (e.message.includes("foreign key constraint")) {
        errorMessage = "Ошибка связи данных в базе";
      }
    }
    
    return NextResponse.json({ 
      message: errorMessage,
      error: e instanceof Error ? e.message : "Unknown error"
    }, { status: 500 });
  }
}