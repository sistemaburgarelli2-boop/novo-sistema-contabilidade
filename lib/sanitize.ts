export function sanitizeText(value: string) {
  return value.replace(/[<>]/g, "").trim();
}

export function sanitizeEmail(value: string) {
  return sanitizeText(value).toLowerCase();
}
