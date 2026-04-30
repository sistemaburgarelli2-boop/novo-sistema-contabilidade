type LogLevel = "info" | "warn" | "error";

export function logStructured(level: LogLevel, event: string, data: Record<string, unknown> = {}) {
  const payload = {
    event,
    level,
    timestamp: new Date().toISOString(),
    ...data,
  };

  if (level === "error") {
    console.error(JSON.stringify(payload));
    return;
  }

  if (level === "warn") {
    console.warn(JSON.stringify(payload));
    return;
  }

  console.info(JSON.stringify(payload));
}
