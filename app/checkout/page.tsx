"use client";

import { useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CircleCheck } from "lucide-react";
import cartStyles from "../carrito/page.module.css";
import {
  checkoutPhoneMessage,
  isCheckoutPhone,
} from "@/lib/domain/checkout-phone";
import { colombianDepartments } from "@/lib/domain/colombia-location";
import { useCartStore } from "@/lib/store/cart-store";
import { formatCOP } from "@/lib/utils/format";
import styles from "./page.module.css";

type Customer = {
  name: string;
  phone: string;
  email: string;
  address: string;
  cityCode: string;
  departmentCode: string;
  postalCode: string;
  notes: string;
};
const fields: {
  key: keyof Customer;
  label: string;
  type?: string;
  required?: boolean;
  fullWidth?: boolean;
}[] = [
  { key: "name", label: "Nombre completo", required: true },
  { key: "email", label: "Correo electrónico", type: "email", required: true },
  { key: "address", label: "Dirección", required: true, fullWidth: true },
  {
    key: "notes",
    label: "Indicaciones de entrega (opcional)",
    fullWidth: true,
  },
  { key: "departmentCode", label: "Departamento", required: true },
  { key: "cityCode", label: "Ciudad o municipio", required: true },
  { key: "postalCode", label: "Código postal", required: true },
  { key: "phone", label: "Teléfono", type: "tel", required: true },
];
const initial: Customer = {
  name: "",
  phone: "",
  email: "",
  address: "",
  cityCode: "",
  departmentCode: "",
  postalCode: "",
  notes: "",
};

export default function Checkout() {
  const items = useCartStore((state) => state.items);
  const clearCart = useCartStore((state) => state.clearCart);
  const [customer, setCustomer] = useState(initial);
  const department = colombianDepartments.find(
    ({ code }) => code === customer.departmentCode,
  );
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const requestId = useRef<string | null>(null);
  const [result, setResult] = useState<{ id: string; total: number } | null>(
    null,
  );
  const total = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const delivery = {
      ...customer,
      name: customer.name.trim(),
      address: customer.address.trim(),
      phone: customer.phone.trim(),
    };
    setCustomer(delivery);
    if (!isCheckoutPhone(delivery.phone)) {
      setError(checkoutPhoneMessage);
      return;
    }
    if (!delivery.name || !delivery.address) {
      setError("Completa el nombre y la dirección de entrega.");
      return;
    }
    setPending(true);
    setError("");
    requestId.current ??= crypto.randomUUID();
    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: requestId.current,
          customer: delivery,
          items: items.map(({ productId, quantity, price }) => ({
            productId,
            quantity,
            price,
          })),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message);
      setResult(data);
      clearCart();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "No se pudo crear el pedido.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <main className={cartStyles.page}>
      <section className={cartStyles.cart}>
        <div className={cartStyles.cartTop}>
          <h1>{result ? "Pedido de prueba creado" : "Finalizar compra"}</h1>
        </div>
        {result ? (
          <div className={`${cartStyles.empty} ${styles.confirmation}`}>
            <CircleCheck aria-hidden="true" />
            <h2>Pago simulado aprobado</h2>
            <p>No se realizó ningún cobro.</p>
            <p>Pedido: {result.id}</p>
            <p>
              Total: <strong>{formatCOP(result.total)}</strong>
            </p>
            <Link href="/productos" className={cartStyles.primaryButton}>
              Volver al catálogo
            </Link>
          </div>
        ) : !items.length ? (
          <div className={`${cartStyles.empty} ${styles.confirmation}`}>
            <h2>Tu carrito está vacío</h2>
            <Link href="/productos" className={cartStyles.primaryButton}>
              Ir al catálogo
            </Link>
          </div>
        ) : (
          <>
            <Link href="/carrito" className={styles.backLink}>
              <ArrowLeft size={16} aria-hidden="true" /> Volver al carrito
            </Link>
            <div className={cartStyles.grid}>
              <form
                onSubmit={submit}
                className={`${cartStyles.summary} ${styles.form}`}
              >
                <h2>Datos de entrega</h2>
                <fieldset
                  className={styles.fields}
                  aria-label="Datos de entrega"
                  disabled={pending}
                >
                  <label className={styles.fullWidth}>
                    País
                    <input value="Colombia" readOnly />
                  </label>
                  {fields.map((field) => (
                    <label
                      key={field.key}
                      className={field.fullWidth ? styles.fullWidth : undefined}
                    >
                      <span>
                        {field.label}
                        {field.required && (
                          <span
                            className={styles.requiredMark}
                            aria-hidden="true"
                          >
                            {" *"}
                          </span>
                        )}
                      </span>
                      {field.key === "departmentCode" ? (
                        <select
                          name={field.key}
                          required
                          value={customer.departmentCode}
                          onChange={(event) =>
                            setCustomer({
                              ...customer,
                              departmentCode: event.target.value,
                              cityCode: "",
                            })
                          }
                        >
                          <option value="">Selecciona un departamento</option>
                          {colombianDepartments.map(({ code, name }) => (
                            <option key={code} value={code}>
                              {name}
                            </option>
                          ))}
                        </select>
                      ) : field.key === "cityCode" ? (
                        <select
                          name={field.key}
                          required
                          disabled={!department}
                          value={customer.cityCode}
                          onChange={(event) =>
                            setCustomer({
                              ...customer,
                              cityCode: event.target.value,
                            })
                          }
                        >
                          <option value="">
                            {department
                              ? "Selecciona un municipio"
                              : "Elige primero un departamento"}
                          </option>
                          {department?.municipalities.map(([code, name]) => (
                            <option key={code} value={code}>
                              {name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          name={field.key}
                          type={field.type ?? "text"}
                          required={field.required}
                          inputMode={
                            field.key === "phone" ? "numeric" : undefined
                          }
                          autoComplete={
                            field.key === "phone" ? "tel-national" : undefined
                          }
                          maxLength={field.key === "notes" ? 1000 : 200}
                          value={customer[field.key]}
                          onChange={(event) =>
                            setCustomer({
                              ...customer,
                              [field.key]: event.target.value,
                            })
                          }
                        />
                      )}
                    </label>
                  ))}
                </fieldset>
                {process.env.NODE_ENV !== "production" ? (
                  <>
                    <p className={styles.notice}>
                      Modo de prueba. El pago será simulado y no se cobrará
                      dinero.
                    </p>
                    <button
                      className={cartStyles.primaryButton}
                      disabled={pending}
                      type="submit"
                    >
                      {pending
                        ? "Procesando…"
                        : "Crear pedido y simular pago aprobado"}
                    </button>
                  </>
                ) : (
                  <p className={styles.notice}>
                    El pago en línea todavía no está disponible. Contáctanos por
                    WhatsApp.
                  </p>
                )}
                {error && (
                  <p className={styles.error} role="alert">
                    {error}
                  </p>
                )}
              </form>
              <aside className={cartStyles.summary}>
                <h2>Tu pedido</h2>
                <ul className={styles.orderItems}>
                  {items.map((item) => (
                    <li className={styles.line} key={item.productId}>
                      <span className={styles.thumbnail}>
                        <Image
                          src={item.image}
                          alt=""
                          fill
                          sizes="52px"
                          className={styles.productImage}
                        />
                        <span
                          className={styles.quantity}
                          aria-label={`Cantidad: ${item.quantity}`}
                        >
                          {item.quantity}
                        </span>
                      </span>
                      <span className={styles.productName}>{item.name}</span>
                      <strong>{formatCOP(item.price * item.quantity)}</strong>
                    </li>
                  ))}
                </ul>
                <div className={cartStyles.totalRow}>
                  <span>Subtotal</span>
                  <strong>{formatCOP(total)}</strong>
                </div>
                <div>
                  <span>Envío</span>
                  <strong>{formatCOP(0)}</strong>
                </div>
                <div className={cartStyles.totalRow}>
                  <span>Total</span>
                  <strong>{formatCOP(total)}</strong>
                </div>
              </aside>
            </div>
          </>
        )}
      </section>
    </main>
  );
}
