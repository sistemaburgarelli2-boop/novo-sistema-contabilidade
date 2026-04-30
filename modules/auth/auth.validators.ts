import type { LoginPayload } from "@/modules/auth/auth.types";

export function validateLoginPayload(payload: unknown): LoginPayload {
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload invalido.");
  }

  const data = payload as Record<string, unknown>;
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const password = typeof data.password === "string" ? data.password : "";

  if (!email || !email.includes("@")) {
    throw new Error("Email invalido.");
  }

  if (!password || password.length < 6) {
    throw new Error("Senha invalida.");
  }

  return { email, password };
}
