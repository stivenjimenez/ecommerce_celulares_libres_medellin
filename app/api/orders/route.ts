import { NextResponse } from "next/server";
import {
  checkoutPhoneMessage,
  isCheckoutPhone,
} from "@/lib/domain/checkout-phone";
import { resolveColombianLocation } from "@/lib/domain/colombia-location";
import { createSimulatedOrder, type Customer } from "@/lib/server/orders";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (
      typeof body.requestId !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        body.requestId,
      )
    )
      throw new Error("La referencia del pedido no es válida.");
    const keys = ["name", "phone", "email", "address", "postalCode"] as const;
    if (
      !body.customer ||
      keys.some(
        (key) =>
          typeof body.customer[key] !== "string" ||
          !body.customer[key].trim() ||
          body.customer[key].length > 200,
      ) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.customer.email)
    )
      throw new Error("Completa correctamente los datos de entrega.");
    if (!isCheckoutPhone(body.customer.phone))
      throw new Error(checkoutPhoneMessage);
    const location = resolveColombianLocation(
      body.customer.departmentCode,
      body.customer.cityCode,
    );
    if (!location)
      throw new Error("Selecciona un municipio del departamento elegido.");
    if (
      !Array.isArray(body.items) ||
      body.items.length < 1 ||
      body.items.length > 50
    )
      throw new Error("El carrito no es válido.");
    const ids = new Set<string>();
    for (const item of body.items) {
      if (
        !item ||
        typeof item.productId !== "string" ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          item.productId,
        ) ||
        ids.has(item.productId) ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1 ||
        item.quantity > 99 ||
        !Number.isInteger(item.price) ||
        item.price < 0
      )
        throw new Error("El carrito no es válido.");
      ids.add(item.productId);
    }
    const customer: Customer = {
      ...(Object.fromEntries(
        keys.map((key) => [key, body.customer[key].trim()]),
      ) as Pick<Customer, (typeof keys)[number]>),
      ...location,
      notes:
        typeof body.customer.notes === "string"
          ? body.customer.notes.trim().slice(0, 1000)
          : "",
    };
    const order = await createSimulatedOrder(
      customer,
      body.items,
      body.requestId,
    );
    return NextResponse.json(
      { id: order.id, total: order.total, paymentStatus: order.paymentStatus },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "No se pudo crear el pedido.",
      },
      { status: 400 },
    );
  }
}
