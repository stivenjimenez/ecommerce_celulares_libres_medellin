import { and, eq, gte, isNull, sql } from "drizzle-orm";
import { orderItems, orders, products } from "@/db/schema";
import { getDb } from "@/lib/db/client";
import { getTestPaymentProvider } from "@/lib/server/payments/provider";

export type Customer = {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  department: string;
  postalCode: string;
  notes: string;
};
type RequestedItem = { productId: string; quantity: number; price: number };

export async function createSimulatedOrder(
  customer: Customer,
  items: RequestedItem[],
  requestId: string,
) {
  const payment = getTestPaymentProvider().approveForTesting();
  return getDb().transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${requestId}))`);
    const [existing] = await tx
      .select()
      .from(orders)
      .where(eq(orders.id, requestId));
    if (existing) return existing;
    const snapshots: {
      productId: string;
      name: string;
      price: number;
      quantity: number;
    }[] = [];
    // Consistent locking order prevents competing checkouts deadlocking.
    for (const item of [...items].sort((a, b) =>
      a.productId.localeCompare(b.productId),
    )) {
      const [product] = await tx
        .update(products)
        .set({ stock: sql`${products.stock} - ${item.quantity}` })
        .where(
          and(
            eq(products.id, item.productId),
            eq(products.draft, false),
            isNull(products.deletedAt),
            gte(products.stock, item.quantity),
          ),
        )
        .returning({
          id: products.id,
          name: products.name,
          price: products.price,
        });
      if (!product)
        throw new Error(
          "Uno de los productos ya no tiene existencias suficientes. Revisa tu carrito.",
        );
      if (product.price !== item.price)
        throw new Error(
          "El precio de un producto cambió. Elimínalo y agrégalo nuevamente para actualizar el carrito.",
        );
      snapshots.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      });
    }
    const total = snapshots.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    if (!Number.isSafeInteger(total) || total > 2147483647)
      throw new Error("El total del pedido no es válido.");
    const [order] = await tx
      .insert(orders)
      .values({
        id: requestId,
        customer,
        total,
        status: "confirmed",
        paymentStatus: payment.status,
        paymentProvider: payment.provider,
      })
      .returning();
    await tx
      .insert(orderItems)
      .values(snapshots.map((item) => ({ ...item, orderId: order.id })));
    return order;
  });
}

export async function cancelOrder(id: string) {
  return getDb().transaction(async (tx) => {
    const [order] = await tx
      .update(orders)
      .set({ status: "cancelled" })
      .where(and(eq(orders.id, id), eq(orders.status, "confirmed")))
      .returning();
    if (!order) return false;
    const items = await tx
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, id));
    for (const item of items.sort((a, b) =>
      a.productId.localeCompare(b.productId),
    )) {
      await tx
        .update(products)
        .set({ stock: sql`${products.stock} + ${item.quantity}` })
        .where(eq(products.id, item.productId));
    }
    return true;
  });
}
