// The order service consumes a payment outcome without depending on a gateway.
// A real provider must implement this contract and confirm payment server-side.
export type PaymentOutcome = { status: "simulated_approved"; provider: string };
export interface PaymentProvider {
  approveForTesting(): PaymentOutcome;
}

export function getTestPaymentProvider(): PaymentProvider {
  if (process.env.NODE_ENV === "production") {
    throw new Error("El pago en línea aún no está disponible.");
  }
  return {
    approveForTesting: () => ({
      status: "simulated_approved",
      provider: "simulation",
    }),
  };
}
