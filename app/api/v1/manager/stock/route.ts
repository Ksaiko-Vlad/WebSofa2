// app/api/v1/manager/stock/route.ts
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

    if (payload.role !== "manager") {
      return NextResponse.json({ message: "Доступ запрещён" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const shopIdParam = searchParams.get("shopId");

    // магазины, к которым привязан менеджер
    const managerLinks = await prisma.shop_managers.findMany({
      where: { user_id: BigInt(payload.sub) },
      select: { shop_id: true },
    });

    const allowedShopIds = managerLinks.map((l) => Number(l.shop_id));

    if (allowedShopIds.length === 0) {
      return NextResponse.json(
        jsonSafe({ message: "За вами не закреплён ни один магазин", shop: null, stock: [] }),
        { status: 200 }
      );
    }

    let shopId: number;
    if (shopIdParam) {
      shopId = Number(shopIdParam);
      if (!allowedShopIds.includes(shopId)) {
        return NextResponse.json(
          { message: "У вас нет доступа к этому магазину" },
          { status: 403 }
        );
      }
    } else {
      shopId = allowedShopIds[0];
    }

    const shop = await prisma.shops.findUnique({
      where: { id: BigInt(shopId) },
      select: { id: true, city: true, street: true },
    });

    const stock = await prisma.shop_stock.findMany({
      where: { shop_id: BigInt(shopId) },
      select: {
        product_variant_id: true,
        quantity: true,
        // ВАЖНО: правильное имя связи — productVariant
        productVariant: {
          select: {
            id: true,
            sku: true,
            price: true,
            // имена связей у варианта обычно product / material
            product: { select: { name: true } },
            material: { select: { name: true } },
          },
        },
      },
    });

    return NextResponse.json(jsonSafe({ shop, stock }), { status: 200 });
  } catch (e) {
    console.error("manager stock GET error:", e);
    return NextResponse.json(
      { message: "Ошибка при получении остатков" },
      { status: 500 }
    );
  }
}
