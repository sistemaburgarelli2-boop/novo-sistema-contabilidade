"use client";

import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/lib/auth-context";

type RegistroPonto = {
  id: string;
  user_id: string;
  user_nome: string;
  tipo: "entrada" | "pausa" | "retorno" | "saida";
  data: string;
  hora: string;
  observacao: string | null;
};

const TIPO_LABELS: Record<string, { text: string; bg: string; color: string; icon: string }> = {
  entrada:  { text: "Entrada",  bg: "#d1fae5", color: "#065f46", icon: "▶" },
  pausa:    { text: "Pausa",    bg: "#fef3c7", color: "#92400e", icon: "⏸" },
  retorno:  { text: "Retorno",  bg: "#dbeafe", color: "#1e40af", icon: "↩" },
  saida:    { text: "Saída",    bg: "#fef2f2", color: "#b91c1c", icon: "⏹" },
};

function formatHora(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return iso;
  }
}

function formatData(iso: string) {
  try {
    const [y, m, d] = iso.split("-");
    return `${d}/${m}/${y}`;
  } catch {
    return iso;
  }
}

function getHoraAtual() {
  return new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function PontoEletronico() {
  const { user } = useAuth();
  const [registros, setRegistros] = useState<RegistroPonto[]>([]);
  const [loading, setLoading] = useState(true);
  const [registrando, setRegistrando] = useState(false);
  const [horaAtual, setHoraAtual] = useState(getHoraAtual());
  const [dataFiltro, setDataFiltro] = useState(new Date().toISOString().slice(0, 10));
  const [observacao, setObservacao] = useState("");

  const hoje = new Date().toISOString().slice(0, 10);
  const isHoje = dataFiltro === hoje;

  useEffect(() => {
    const timer = setInterval(() => setHoraAtual(getHoraAtual()), 1000);
    return () => clearInterval(timer);
  }, []);

  const carregarRegistros = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/ponto?data=${dataFiltro}`);
      const json = await res.json();
      setRegistros(json.data ?? []);
    } catch {
      setRegistros([]);
    } finally {
      setLoading(false);
    }
  }, [dataFiltro]);

  useEffect(() => {
    carregarRegistros();
  }, [carregarRegistros]);

  const meusRegistrosHoje = registros.filter((r) => r.user_id === user.id);
  const ultimoRegistro = meusRegistrosHoje[meusRegistrosHoje.length - 1];

  const proximoTipo = (): "entrada" | "pausa" | "retorno" | "saida" => {
    if (!ultimoRegistro) return "entrada";
    if (ultimoRegistro.tipo === "entrada") return "pausa";
    if (ultimoRegistro.tipo === "pausa") return "retorno";
    if (ultimoRegistro.tipo === "retorno") return "pausa";
    return "entrada";
  };

  const jaFinalizou = ultimoRegistro?.tipo === "saida";

  async function registrarPonto(tipo: string) {
    setRegistrando(true);
    try {
      await fetch("/api/ponto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          user_nome: user.nome,
          tipo,
          observacao: observacao.trim() || null,
        }),
      });
      setObservacao("");
      await carregarRegistros();
    } finally {
      setRegistrando(false);
    }
  }

  const registrosPorUsuario = registros.reduce<Record<string, RegistroPonto[]>>((acc, r) => {
    acc[r.user_nome] = acc[r.user_nome] ?? [];
    acc[r.user_nome].push(r);
    return acc;
  }, {});

  function calcularHorasTrabalhadas(regs: RegistroPonto[]): string {
    let totalMs = 0;
    let ultimaEntrada: Date | null = null;
    for (const r of regs) {
      const t = new Date(r.hora);
      if (r.tipo === "entrada" || r.tipo === "retorno") {
        ultimaEntrada = t;
      } else if ((r.tipo === "pausa" || r.tipo === "saida") && ultimaEntrada) {
        totalMs += t.getTime() - ultimaEntrada.getTime();
        ultimaEntrada = null;
      }
    }
    if (ultimaEntrada) {
      totalMs += Date.now() - ultimaEntrada.getTime();
    }
    const h = Math.floor(totalMs / 3600000);
    const m = Math.floor((totalMs % 3600000) / 60000);
    return `${h}h ${m.toString().padStart(2, "0")}min`;
  }

  return (
    <AppShell>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Relógio e ações */}
        <div style={{
          background: "linear-gradient(135deg, #065f46, #0b351e)",
          borderRadius: 16, padding: "32px 40px", color: "#fff",
          display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24,
        }}>
          <div>
            <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 4 }}>Ponto Eletrônico</div>
            <div style={{ fontSize: 48, fontWeight: 800, letterSpacing: -2, fontVariantNumeric: "tabular-nums" }}>
              {horaAtual}
            </div>
            <div style={{ fontSize: 14, opacity: 0.7, marginTop: 4 }}>
              {formatData(hoje)} · {user.nome}
            </div>
          </div>

          {isHoje && !jaFinalizou && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-end" }}>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => registrarPonto(proximoTipo())}
                  disabled={registrando}
                  style={{
                    minWidth: 160, fontSize: 15, padding: "12px 24px",
                    background: TIPO_LABELS[proximoTipo()].bg,
                    color: TIPO_LABELS[proximoTipo()].color,
                    fontWeight: 700, border: "none", borderRadius: 10,
                  }}
                >
                  {TIPO_LABELS[proximoTipo()].icon} {TIPO_LABELS[proximoTipo()].text}
                </button>

                {ultimoRegistro && ultimoRegistro.tipo !== "saida" && (
                  <button
                    onClick={() => registrarPonto("saida")}
                    disabled={registrando}
                    style={{
                      minWidth: 140, fontSize: 15, padding: "12px 24px",
                      background: "#fef2f2", color: "#b91c1c",
                      fontWeight: 700, border: "none", borderRadius: 10,
                    }}
                  >
                    ⏹ Finalizar
                  </button>
                )}
              </div>
              <input
                type="text"
                placeholder="Observação (opcional)"
                value={observacao}
                onChange={(e) => setObservacao(e.target.value)}
                style={{
                  width: 320, background: "rgba(255,255,255,0.15)",
                  border: "1px solid rgba(255,255,255,0.3)", color: "#fff",
                  borderRadius: 8, padding: "8px 14px", fontSize: 13,
                }}
              />
            </div>
          )}

          {isHoje && jaFinalizou && (
            <div style={{
              background: "rgba(255,255,255,0.12)", borderRadius: 10,
              padding: "16px 24px", textAlign: "center",
            }}>
              <div style={{ fontSize: 14, opacity: 0.8 }}>Jornada finalizada</div>
              <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>
                {calcularHorasTrabalhadas(meusRegistrosHoje)}
              </div>
            </div>
          )}
        </div>

        {/* Filtro de data */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <label style={{ fontSize: 14, fontWeight: 600 }}>Data:</label>
          <input
            type="date"
            value={dataFiltro}
            onChange={(e) => setDataFiltro(e.target.value)}
            style={{ width: 180 }}
          />
          {!isHoje && (
            <button
              onClick={() => setDataFiltro(hoje)}
              style={{
                background: "var(--green-500)", color: "#fff",
                padding: "8px 16px", fontSize: 13, borderRadius: 8,
              }}
            >
              Hoje
            </button>
          )}
        </div>

        {/* Meus registros do dia */}
        <div style={{
          background: "var(--panel)", borderRadius: 14,
          border: "1px solid var(--border)", padding: 24,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
            Meus Registros — {formatData(dataFiltro)}
          </h2>

          {loading ? (
            <div style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>Carregando...</div>
          ) : meusRegistrosHoje.length === 0 ? (
            <div style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>
              Nenhum registro {isHoje ? "hoje" : "nesta data"}.
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
              {meusRegistrosHoje.map((r) => {
                const info = TIPO_LABELS[r.tipo];
                return (
                  <div key={r.id} style={{
                    background: info.bg, color: info.color, borderRadius: 10,
                    padding: "12px 18px", minWidth: 140, textAlign: "center",
                  }}>
                    <div style={{ fontSize: 22, fontWeight: 800 }}>{formatHora(r.hora)}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, marginTop: 4 }}>{info.icon} {info.text}</div>
                    {r.observacao && (
                      <div style={{ fontSize: 11, marginTop: 6, opacity: 0.8 }}>{r.observacao}</div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {meusRegistrosHoje.length > 0 && (
            <div style={{ marginTop: 16, fontSize: 14, color: "var(--muted)" }}>
              Total trabalhado: <strong style={{ color: "var(--ink)" }}>
                {calcularHorasTrabalhadas(meusRegistrosHoje)}
              </strong>
            </div>
          )}
        </div>

        {/* Painel geral — todos os profissionais */}
        <div style={{
          background: "var(--panel)", borderRadius: 14,
          border: "1px solid var(--border)", padding: 24,
        }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
            Painel Geral — Todos os Profissionais
          </h2>

          {loading ? (
            <div style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>Carregando...</div>
          ) : Object.keys(registrosPorUsuario).length === 0 ? (
            <div style={{ textAlign: "center", padding: 32, color: "var(--muted)" }}>
              Nenhum registro nesta data.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--border)", textAlign: "left" }}>
                  <th style={{ padding: "10px 12px" }}>Profissional</th>
                  <th style={{ padding: "10px 12px" }}>Entrada</th>
                  <th style={{ padding: "10px 12px" }}>Última ação</th>
                  <th style={{ padding: "10px 12px" }}>Status</th>
                  <th style={{ padding: "10px 12px" }}>Horas</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(registrosPorUsuario).map(([nome, regs]) => {
                  const primeiro = regs[0];
                  const ultimo = regs[regs.length - 1];
                  const info = TIPO_LABELS[ultimo.tipo];
                  return (
                    <tr key={nome} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td style={{ padding: "12px", fontWeight: 600 }}>{nome}</td>
                      <td style={{ padding: "12px" }}>{formatHora(primeiro.hora)}</td>
                      <td style={{ padding: "12px" }}>{formatHora(ultimo.hora)}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{
                          background: info.bg, color: info.color,
                          padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 700,
                        }}>
                          {info.icon} {info.text}
                        </span>
                      </td>
                      <td style={{ padding: "12px", fontWeight: 600 }}>{calcularHorasTrabalhadas(regs)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  );
}
