import type { LoginPayload } from "@/modules/auth/auth.types";
import { sanitizeEmail } from "@/lib/sanitize";

export function validateLoginPayload(payload: unknown): LoginPayload {
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload invalido.");
  }

  const data = payload as Record<string, unknown>;
  const email = typeof data.email === "string" ? sanitizeEmail(data.email) : "";
  const password = typeof data.password === "string" ? data.password : "";

  if (!email || !email.includes("@")) {
    throw new Error("Email invalido.");
  }

  if (!password || password.length < 6) {
    throw new Error("Senha invalida.");
  }

  return { email, password };
}
