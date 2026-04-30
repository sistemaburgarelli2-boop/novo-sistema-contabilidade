import type { AceitarConviteInput, CriarConviteInput } from "@/modules/convites/convites.types";
import { sanitizeEmail, sanitizeText } from "@/lib/sanitize";

function clean(value: unknown) {
  return typeof value === "string" ? sanitizeText(value) : "";
}

export function validarCriarConvite(payload: unknown): CriarConviteInput {
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload invalido.");
  }

  const data = payload as Record<string, unknown>;
  const empresaId = clean(data.empresa_id);
  const email = typeof data.email === "string" ? sanitizeEmail(data.email) : "";
  const roleId = clean(data.role_id);

  if (!empresaId) {
    throw new Error("Empresa obrigatoria.");
  }

  if (!email || !email.includes("@")) {
    throw new Error("Email invalido.");
  }

  if (!roleId) {
    throw new Error("Role obrigatoria.");
  }

  return { email, empresa_id: empresaId, role_id: roleId };
}

export function validarAceitarConvite(payload: unknown): AceitarConviteInput {
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload invalido.");
  }

  const data = payload as Record<string, unknown>;
  const token = clean(data.token);
  const nome = clean(data.nome);
  const password = typeof data.password === "string" ? data.password : "";

  if (!token || token.length < 32) {
    throw new Error("Token invalido.");
  }

  if (!nome || nome.length < 2) {
    throw new Error("Nome obrigatorio.");
  }

  if (!password || password.length < 8) {
    throw new Error("Senha deve ter pelo menos 8 caracteres.");
  }

  return { nome, password, token };
}
