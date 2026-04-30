import type { VincularUsuarioInput } from "@/modules/usuarios/usuarios.types";

export function validarVincularUsuario(payload: unknown): VincularUsuarioInput {
  if (!payload || typeof payload !== "object") {
    throw new Error("Payload invalido.");
  }

  const data = payload as Record<string, unknown>;
  const email = typeof data.email === "string" ? data.email.trim().toLowerCase() : "";
  const roleId = typeof data.role_id === "string" ? data.role_id : "";

  if (!email || !email.includes("@")) {
    throw new Error("Email invalido.");
  }

  if (!roleId) {
    throw new Error("Role obrigatoria.");
  }

  return {
    email,
    role_id: roleId,
  };
}
