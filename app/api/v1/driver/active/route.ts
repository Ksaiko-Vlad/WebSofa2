// app/api/v1/driver/active-orders.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyJwt } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

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
        where: { driver_id: BigInt(payload.sub), status: { in: ["in_transit"] } },
        include: {
          orders: {
            include: {
              order: { // Загрузка данных из таблицы orders через связку shipment_orders
                include: {
                  address: true, // Загружаем адрес доставки из связи
                },
              },
            },
          },
        },
        orderBy: { planned_at: "asc" },
      });
      
    return NextResponse.json({ shipments }, { status: 200 });
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
            select: {
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

    const data: any = {};

    if (action === "deliver") {
      if (shipment.status !== "in_transit") {
        return NextResponse.json({ message: "Этот заказ не в пути" }, { status: 400 });
      }
      data.status = "delivered";
      await prisma.orders.update({
        where: { id: shipment.orders[0].order.id },
        data: {
          status: "delivered",
        },
      });
    } else if (action === "cancel") {
      if (shipment.status !== "in_transit") {
        return NextResponse.json({ message: "Этот заказ не в пути" }, { status: 400 });
      }
      data.status = "cancelled";
      await prisma.orders.update({
        where: { id: shipment.orders[0].order.id },
        data: {
          status: "cancelled",
        },
      });
    } else {
      return NextResponse.json({ message: "Неизвестное действие" }, { status: 400 });
    }

    await prisma.shipments.update({
      where: { id: BigInt(shipmentId) },
      data,
    });

    return NextResponse.json({ message: `Статус изменён на ${data.status}` }, { status: 200 });
  } catch (e) {
    console.error("Error changing shipment status:", e);
    return NextResponse.json({ message: "Ошибка при изменении статуса доставки" }, { status: 500 });
  }
}
