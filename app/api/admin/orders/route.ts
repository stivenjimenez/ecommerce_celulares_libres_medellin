import { and, desc, eq, getTableColumns, isNull } from "drizzle-orm";
import { NextResponse } from "next/server";
import { orders, orderItems, products } from "@/db/schema";
import { getDb } from "@/lib/db/client";
import { requireAdminAuth } from "@/lib/server/admin-auth";
import { cancelOrder } from "@/lib/server/orders";

export async function GET() {
  const auth = await requireAdminAuth();
  if (auth.response) return auth.response;
  const db = getDb();
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt));
  const items = await db
    .select({ ...getTableColumns(orderItems), productSlug: products.slug })
    .from(orderItems)
    .leftJoin(
      products,
      and(
        eq(products.id, orderItems.productId),
        eq(products.draft, false),
        isNull(products.deletedAt),
      ),
    );
  return NextResponse.json(
    rows.map((order) => ({
      ...order,
      items: items.filter((item) => item.orderId === order.id),
    })),
  );
}

export async function PATCH(request: Request) {
  const auth = await requireAdminAuth();
  if (auth.response) return auth.response;
  const { id } = await request.json();
  if (typeof id !== "string" || !/^[0-9a-f-]{36}$/i.test(id))
    return NextResponse.json({ message: "Pedido inválido." }, { status: 400 });
  const cancelled = await cancelOrder(id);
  return NextResponse.json({ cancelled }, { status: cancelled ? 200 : 409 });
}
