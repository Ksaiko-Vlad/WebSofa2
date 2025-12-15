// app/api/v1/driver/active-orders.ts
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

    // Получаем все активные заказы водителя
    const shipments = await prisma.shipments.findMany({
      where: { 
        driver_id: BigInt(payload.sub), 
        status: { in: ["in_transit"] } 
      },
      include: {
        orders: {
          include: {
            order: {
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
            },
          },
        },
      },
      orderBy: { planned_at: "asc" },
    });

    // Преобразуем BigInt в строки с помощью вашей функции
    const safeShipments = jsonSafe(shipments);
    
    return NextResponse.json({ shipments: safeShipments }, { status: 200 });
  } catch (e) {
    console.error("Error fetching active shipments:", e);
    return NextResponse.json({ message: "Ошибка при получении активных заказов" }, { status: 500 });
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
    const shipmentId = Number(body.shipmentId);
    const action = body.action;

    if (!Number.isInteger(shipmentId) || shipmentId <= 0) {
      return NextResponse.json({ message: "shipmentId должен быть положительным числом" }, { status: 400 });
    }

    const shipment = await prisma.shipments.findUnique({
      where: { id: BigInt(shipmentId) },
      include: {
        orders: {
          include: {
            order: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!shipment) {
      return NextResponse.json({ message: "Доставка не найдена" }, { status: 404 });
    }

    // Проверяем, что водитель имеет доступ к этой доставке
    if (shipment.driver_id !== BigInt(payload.sub)) {
      return NextResponse.json({ message: "Доступ запрещён" }, { status: 403 });
    }

    // Используем транзакцию для атомарного обновления
    await prisma.$transaction(async (tx) => {
      const data: any = {};

      if (action === "deliver") {
        if (shipment.status !== "in_transit") {
          throw new Error("Этот заказ не в пути");
        }
        data.status = "delivered";
        data.finished_at = new Date();

        // Обновляем все связанные заказы
        for (const shipmentOrder of shipment.orders) {
          await tx.orders.update({
            where: { id: shipmentOrder.order.id },
            data: {
              status: "delivered",
            },
          });
        }
      } else if (action === "cancel") {
        if (shipment.status !== "in_transit") {
          throw new Error("Этот заказ не в пути");
        }
        data.status = "cancelled";
        data.finished_at = new Date();

        // Обновляем все связанные заказы
        for (const shipmentOrder of shipment.orders) {
          await tx.orders.update({
            where: { id: shipmentOrder.order.id },
            data: {
              status: "cancelled",
            },
          });
        }
      } else {
        throw new Error("Неизвестное действие");
      }

      // Обновляем shipment
      await tx.shipments.update({
        where: { id: BigInt(shipmentId) },
        data,
      });
    });

    let message = "";
    if (action === "deliver") {
      message = "Заказ доставлен";
    } else if (action === "cancel") {
      message = "Доставка отменена";
    }

    return NextResponse.json({ 
      message,
      success: true 
    }, { status: 200 });
    
  } catch (e) {
    console.error("Error changing shipment status:", e);
    
    let errorMessage = "Ошибка при изменении статуса доставки";
    if (e instanceof Error) {
      errorMessage = e.message;
    }
    
    return NextResponse.json({ 
      message: errorMessage,
      error: e instanceof Error ? e.message : "Unknown error"
    }, { status: 500 });
  }
}