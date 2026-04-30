import crypto from "node:crypto";

export function gerarTokenConvite() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashTokenConvite(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
