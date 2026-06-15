"use client";

import { use } from "react";
import { SetorShell } from "@/components/empresas/SetorShell";

const ICONE = (
  <svg fill="none" height={24} viewBox="0 0 24 24" width={24}>
    <circle cx={9} cy={7} r={4} stroke="currentColor" strokeWidth={2} />
    <path d="M3 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" stroke="currentColor" strokeLinecap="round" strokeWidth={2} />
    <path d="M16 11h6M19 8v6" stroke="currentColor" strokeLinecap="round" strokeWidth={2} />
  </svg>
);

const FUNCIONARIOS = [
  { nome: "Carlos Silva", cargo: "Gerente Comercial", admissao: "01/03/2022", salario: "R$ 5.800,00", status: "ativo" },
  { nome: "Ana Souza", cargo: "Auxiliar Administrativo", admissao: "15/06/2023", salario: "R$ 2.200,00", status: "ativo" },
  { nome: "Pedro Lima", cargo: "Técnico de TI", admissao: "10/01/2024", salario: "R$ 3.500,00", status: "ativo" },
  { nome: "Juliana Costa", cargo: "Vendedora", admissao: "20/09/2023", salario: "R$ 1.800,00", status: "ferias" },
];

const EVENTOS = [
  { evento: "Férias — Juliana Costa", data: "01/07/2026", tipo: "ferias" },
  { evento: "13º Salário — 1ª parcela", data: "30/11/2026", tipo: "salario" },
  { evento: "Rescisão — prazo FGTS", data: "—", tipo: "neutro" },
  { evento: "eSocial — folha Jun/2026", data: "07/07/2026", tipo: "esocial" },
  { evento: "GFIP/SEFIP competência Jun", data: "07/07/2026", tipo: "esocial" },
];

const TIPO_STYLE: Record<string, { bg: string; color: string }> = {
  ferias: { bg: "#eff6ff", color: "#1e40af" },
  salario: { bg: "#ecfdf5", color: "#065f46" },
  esocial: { bg: "#faf5ff", color: "#6b21a8" },
  neutro: { bg: "#f3f4f6", color: "#374151" },
};

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  ativo: { bg: "#ecfdf5", color: "#065f46", label: "Ativo" },
  ferias: { bg: "#eff6ff", color: "#1e40af", label: "Férias" },
  afastado: { bg: "#fff7ed", color: "#92400e", label: "Afastado" },
};

export default function DPPage({ params }: { params: Promise<{ empresaId: string }> }) {
  const { empresaId } = use(params);

  const totalFolha = "R$ 13.300,00";

  return (
    <SetorShell
      borda="#c4b5fd"
      cor="#6b21a8"
      empresaId={empresaId}
      empresaNome="Empresa"
      fundo="#faf5ff"
      icone={ICONE}
      setorNome="Departamento Pessoal"
      setorResumo="Folha de pagamento, férias, 13º salário, rescisões e eSocial"
      stats={[
        { label: "Funcionários ativos", value: "4", cor: "#34d399" },
        { label: "Em férias", value: "1", cor: "#93c5fd" },
        { label: "Total folha", value: totalFolha, cor: "#fbbf24" },
        { label: "Próx. eSocial", value: "07/07", cor: "#fff" },
      ]}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "1.25rem" }}>
        {/* Quadro de funcionários */}
        <div className="list-panel">
          <div className="list-panel-header">
            <div><h2>Funcionários</h2><p>Quadro de colaboradores ativos</p></div>
            <button type="button">+ Admitir funcionário</button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e8f0eb" }}>
                  {["Funcionário", "Cargo", "Admissão", "Salário", "Status"].map((h) => (
                    <th key={h} style={{ textAlign: "left", padding: "0.7rem 1rem", color: "#6f8f7c", fontWeight: 700, fontSize: "0.73rem", textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {FUNCIONARIOS.map((f) => {
                  const s = STATUS_STYLE[f.status];
                  return (
                    <tr key={f.nome} style={{ borderBottom: "1px solid #f0f7f3" }}>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "linear-gradient(135deg,#7c3aed,#6b21a8)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 800, flexShrink: 0 }}>
                            {f.nome.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                          </div>
                          <span style={{ fontWeight: 600, color: "#07170d" }}>{f.nome}</span>
                        </div>
                      </td>
                      <td style={{ padding: "0.875rem 1rem", color: "#6f8f7c" }}>{f.cargo}</td>
                      <td style={{ padding: "0.875rem 1rem", color: "#6f8f7c" }}>{f.admissao}</td>
                      <td style={{ padding: "0.875rem 1rem", fontWeight: 700, color: "#07170d" }}>{f.salario}</td>
                      <td style={{ padding: "0.875rem 1rem" }}>
                        <span style={{ background: s.bg, color: s.color, borderRadius: 999, padding: "3px 10px", fontSize: "0.74rem", fontWeight: 700 }}>{s.label}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ display: "grid", gap: "1.25rem" }}>
          {/* Próximos eventos */}
          <div className="list-panel">
            <div className="list-panel-header"><div><h2>Calendário DP</h2><p>Obrigações e eventos trabalhistas</p></div></div>
            <div style={{ padding: "0.5rem 0 0.75rem" }}>
              {EVENTOS.map((ev) => {
                const s = TIPO_STYLE[ev.tipo];
                return (
                  <div key={ev.evento} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.65rem 1rem", borderBottom: "1px solid #f0f7f3" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "#07170d" }}>{ev.evento}</span>
                    <span style={{ background: s.bg, color: s.color, borderRadius: 999, padding: "2px 10px", fontSize: "0.72rem", fontWeight: 700, whiteSpace: "nowrap", marginLeft: 8 }}>{ev.data}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Resumo folha */}
          <div className="list-panel">
            <div className="list-panel-header"><div><h2>Folha de Pagamento</h2><p>Jun/2026</p></div></div>
            <div style={{ padding: "1rem" }}>
              {[
                { label: "Salários brutos", valor: "R$ 13.300,00" },
                { label: "INSS empresa (20%)", valor: "R$ 2.660,00" },
                { label: "FGTS (8%)", valor: "R$ 1.064,00" },
                { label: "IR Retido (IRRF)", valor: "R$ 320,00" },
                { label: "Custo total", valor: "R$ 17.344,00", destaque: true },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", padding: "0.6rem 0", borderBottom: "1px solid #f0f7f3" }}>
                  <span style={{ fontSize: "0.83rem", color: "#4b6358", fontWeight: item.destaque ? 700 : 400 }}>{item.label}</span>
                  <span style={{ fontSize: "0.83rem", fontWeight: 700, color: item.destaque ? "#065f46" : "#07170d" }}>{item.valor}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SetorShell>
  );
}
