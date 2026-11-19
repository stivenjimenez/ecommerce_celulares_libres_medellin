"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getPublicProductUrl } from "@/lib/site-metadata";
import { formatCOP } from "@/lib/utils/format";
import adminStyles from "./page.module.css";
import styles from "./orders-section.module.css";

type Order = {
  id: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  customer: {
    name: string;
    phone: string;
    email: string;
    address: string;
    city: string;
    department: string;
    postalCode: string;
    notes: string;
  };
  items: {
    id: string;
    name: string;
    productSlug: string | null;
    quantity: number;
    price: number;
  }[];
};
const dateFormat = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Bogota",
});

function OrderStatus({ status }: { status: string }) {
  return status === "cancelled" ? (
    <span className={styles.cancelled}>Cancelado</span>
  ) : (
    <span className={styles.confirmed}>Confirmado</span>
  );
}

function PaymentStatus({ status }: { status: string }) {
  return (
    <span className={styles.payment}>
      {status === "simulated_approved" ? "Pago simulado aprobado" : status}
    </span>
  );
}

export function OrdersSection() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailError, setDetailError] = useState("");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const selectedOrder = orders.find((order) => order.id === selectedId);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (selectedId && dialog && !dialog.open) dialog.showModal();
  }, [selectedId]);

  async function load() {
    try {
      const response = await fetch("/api/admin/orders", { cache: "no-store" });
      if (!response.ok)
        throw new Error(
          "No se pudieron cargar los pedidos. Inicia sesión en el administrador.",
        );
      setOrders(await response.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar pedidos.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  function openOrder(id: string) {
    setDetailError("");
    setSelectedId(id);
  }

  async function cancel(id: string) {
    if (
      cancellingId ||
      !window.confirm("¿Cancelar este pedido y liberar sus existencias?")
    )
      return;
    setDetailError("");
    setCancellingId(id);
    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!response.ok) throw new Error("No se pudo cancelar el pedido.");
      setOrders((current) =>
        current.map((order) =>
          order.id === id ? { ...order, status: "cancelled" } : order,
        ),
      );
    } catch {
      setDetailError("No se pudo cancelar el pedido.");
    } finally {
      setCancellingId(null);
    }
  }
  return (
    <>
      <section className={adminStyles.tableSection}>
        <header className={adminStyles.headerRow}>
          <h1>Pedidos</h1>
        </header>
        {error && (
          <p className={adminStyles.error} role="alert">
            {error}
          </p>
        )}
        {loading ? (
          <p className={styles.muted} role="status">
            Cargando pedidos…
          </p>
        ) : orders.length === 0 && !error ? (
          <p className={styles.muted}>No hay pedidos.</p>
        ) : orders.length > 0 ? (
          <div className={adminStyles.tableWrap}>
            <table className={adminStyles.table}>
              <thead>
                <tr>
                  <th scope="col">Pedido</th>
                  <th scope="col">Fecha</th>
                  <th scope="col">Cliente</th>
                  <th scope="col">Estado</th>
                  <th scope="col">Pago</th>
                  <th scope="col">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    className={adminStyles.tableRowClickable}
                    onClick={() => openOrder(order.id)}
                  >
                    <td>
                      <button
                        type="button"
                        className={adminStyles.tableNameButton}
                        aria-label={`Ver pedido ${order.id}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          openOrder(order.id);
                        }}
                      >
                        #{order.id.slice(0, 8).toUpperCase()}
                      </button>
                    </td>
                    <td>{dateFormat.format(new Date(order.createdAt))}</td>
                    <td>{order.customer.name}</td>
                    <td>
                      <OrderStatus status={order.status} />
                    </td>
                    <td>
                      <PaymentStatus status={order.paymentStatus} />
                    </td>
                    <td>{formatCOP(order.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
      <dialog
        ref={dialogRef}
        className={`${adminStyles.drawer} ${styles.drawer}`}
        aria-labelledby="order-detail-title"
        onClose={() => setSelectedId(null)}
        onClick={(event) => {
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
      >
        {selectedOrder && (
          <div className={`${adminStyles.form} ${styles.drawerContent}`}>
            <header className={adminStyles.topRow}>
              <h2 id="order-detail-title">Detalle del pedido</h2>
              <button
                type="button"
                className={adminStyles.secondaryButton}
                onClick={() => dialogRef.current?.close()}
              >
                Cerrar
              </button>
            </header>
            <div>
              <p className={styles.reference}>{selectedOrder.id}</p>
              <p className={styles.muted}>
                {dateFormat.format(new Date(selectedOrder.createdAt))}
              </p>
            </div>
            <div className={styles.statuses}>
              <OrderStatus status={selectedOrder.status} />
              <PaymentStatus status={selectedOrder.paymentStatus} />
            </div>
            <section className={styles.detailSection}>
              <h3>Datos de entrega</h3>
              <p>
                <strong>{selectedOrder.customer.name}</strong>
              </p>
              <p>
                {selectedOrder.customer.phone} · {selectedOrder.customer.email}
              </p>
              <p>
                {selectedOrder.customer.address}, {selectedOrder.customer.city},{" "}
                {selectedOrder.customer.department},{" "}
                {selectedOrder.customer.postalCode}
              </p>
              {selectedOrder.customer.notes && (
                <p>Indicaciones: {selectedOrder.customer.notes}</p>
              )}
            </section>
            <section className={styles.detailSection}>
              <h3>Productos</h3>
              <ul className={styles.items}>
                {selectedOrder.items.map((item) => (
                  <li key={item.id}>
                    <span>
                      {item.productSlug ? (
                        <Link
                          href={getPublicProductUrl(item.productSlug)}
                          target="_blank"
                          rel="noopener"
                          className={styles.productLink}
                        >
                          {item.name}
                        </Link>
                      ) : (
                        item.name
                      )}{" "}
                      × {item.quantity}
                    </span>
                    <strong>{formatCOP(item.price * item.quantity)}</strong>
                  </li>
                ))}
              </ul>
              <p className={styles.total}>
                <strong>Total</strong>
                <strong>{formatCOP(selectedOrder.total)}</strong>
              </p>
            </section>
            {detailError && (
              <p className={adminStyles.error} role="alert">
                {detailError}
              </p>
            )}
            {selectedOrder.status !== "cancelled" && (
              <div className={adminStyles.actions}>
                <button
                  type="button"
                  className={adminStyles.danger}
                  disabled={cancellingId !== null}
                  onClick={() => void cancel(selectedOrder.id)}
                >
                  {cancellingId === selectedOrder.id
                    ? "Cancelando…"
                    : "Cancelar pedido y liberar existencias"}
                </button>
              </div>
            )}
          </div>
        )}
      </dialog>
    </>
  );
}
