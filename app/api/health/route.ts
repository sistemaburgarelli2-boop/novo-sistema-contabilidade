import { ok } from "@/lib/apiResponse";

export function GET() {
  return ok({
    app: "sistema-contabilidade",
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
