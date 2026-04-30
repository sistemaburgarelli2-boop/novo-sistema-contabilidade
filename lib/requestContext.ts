export function getRequestContext(request: Request) {
  return {
    ip:
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null,
    request_id: crypto.randomUUID(),
    user_agent: request.headers.get("user-agent"),
  };
}
