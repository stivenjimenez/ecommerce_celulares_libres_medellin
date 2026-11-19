export const checkoutPhoneMessage =
  "Escribe un teléfono de 10 dígitos, sin el prefijo +57.";

export function isCheckoutPhone(phone: string) {
  return /^[0-9]{10}$/.test(phone.trim());
}
