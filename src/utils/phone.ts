/** Aplica a máscara (47) 99999-9999 enquanto o usuário digita. */
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function isValidPhone(value: string): boolean {
  return /^\(\d{2}\) \d{4,5}-\d{4}$/.test(value);
}

/**
 * Link do WhatsApp com mensagem pronta. Aceita número com máscara,
 * com ou sem o código do país (sem ele, assume Brasil: +55).
 */
export function whatsappLink(value: string, message?: string): string {
  let digits = value.replace(/\D/g, "");
  if (digits.length <= 11) digits = `55${digits}`;
  return `https://wa.me/${digits}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
}

/** Link "tel:" com o código do Brasil. */
export function phoneLink(value: string): string {
  return `tel:+55${value.replace(/\D/g, "")}`;
}
