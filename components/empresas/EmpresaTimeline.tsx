"use client";

import { useEffect, useState } from "react";

type TimelineEvent = {
  id: string;
  data: string;
  tipo: "guia" | "folha" | "obrigacao" | "documento" | "sistema";
  titulo: string;
  descricao: string;
  responsavel: string;
};

const TIPO_LABEL: Record<TimelineEvent["tipo"], string> = {
  documento: "Documento",
  folha: "Folha",
  guia: "Guia",
  obrigacao: "Obrigação",
  sistema: "Sistema",
};

type ApiResult<T> = { data: T | null; error: string | null };

export function EmpresaTimeline({ empresaId }: { empresaId: string }) {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/empresas/${empresaId}/timeline`)
      .then((r) => r.json())
      .then((result: ApiResult<TimelineEvent[]>) => {
        if (result.data) setEvents(result.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [empresaId]);

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
        Carregando histórico...
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "var(--muted)", fontSize: 14 }}>
        Nenhum evento registrado.
      </div>
    );
  }

  return (
    <div className="timeline">
      {events.map((event) => (
        <div className="timeline-item" key={event.id}>
          <div className={`timeline-dot ${event.tipo}`} />
          <div className="timeline-date">
            {new Date(`${event.data}T12:00:00`).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </div>
          <div className="timeline-card">
            <div className="timeline-card-header">
              <span className={`timeline-badge ${event.tipo}`}>{TIPO_LABEL[event.tipo]}</span>
              <strong>{event.titulo}</strong>
            </div>
            <p>{event.descricao}</p>
            <div style={{ marginTop: 6, fontSize: 11, color: "var(--muted)", fontWeight: 600 }}>
              {event.responsavel}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
