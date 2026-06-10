"use client";

import { useEffect, useState } from "react";
import { getActiveCompanyId } from "@/services/companyService";
import type { NFe } from "@/modules/nfe/nfe.types";

function fmt(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const STATUS_COR: Record<string, string> = {
  rascunho: "#6b7280",
  aguardando_autorizacao: "#d97706",
  autorizada: "#059669",
  cancelada: "#dc2626",
  rejeitada: "#dc2626",
};

const STATUS_LABEL: Record<string, string> = {
  rascunho: "Rascunho",
  aguardando_autorizacao: "Aguardando",
  autorizada: "Autorizada",
  cancelada: "Cancelada",
  rejeitada: "Rejeitada",
};

const CAMPO_VAZIO = {
  destinatario_nome: "",
  destinatario_documento: "",
  destinatario_email: "",
  item_descricao: "",
  item_quantidade: "1",
  item_valor: "",
  natureza: "Prestação de serviços",
  modelo: "nfse" as NFe["modelo"],
};

export default function NFePage() {
  const [nfes, setNfes] = useState<NFe[]>([]);
  const [form, setForm] = useState(CAMPO_VAZIO);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const empresaId = getActiveCompanyId();

  async function carregar() {
    if (!empresaId) return;
    const r = await fetch(`/api/nfe?empresa_id=${empresaId}`);
    const json = await r.json();
    if (r.ok) setNfes(json.data ?? []);
  }

  async function emitir(e: React.FormEvent) {
    e.preventDefault();
    if (!empresaId) return;
    setLoading(true);
    setErro(null);
    try {
      const r = await fetch("/api/nfe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresa_id: empresaId,
          modelo: form.modelo,
          natureza_operacao: form.natureza,
          destinatario: {
            nome: form.destinatario_nome,
            cpf_cnpj: form.destinatario_documento,
            email: form.destinatario_email || undefined,
          },
          itens: [
            {
              descricao: form.item_descricao,
              quantidade: Number(form.item_quantidade),
              valor_unitario: Number(form.item_valor),
            },
          ],
        }),
      });
      const json = await r.json();
      if (!r.ok) throw new Error(json.error);
      setMsg(`NF-e emitida com status: ${STATUS_LABEL[json.data.status]}`);
      setForm(CAMPO_VAZIO);
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao emitir.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { carregar(); }, [empresaId]);

  if (!empresaId) {
    return <div className="page-stack"><div className="empty-state"><h2>Selecione uma empresa</h2></div></div>;
  }

  return (
    <div className="page-stack">
      <div className="module-hero">
        <div>
          <h1>Notas Fiscais (NF-e)</h1>
          <p>Emissão via Focus NF-e API — NFS-e, NF-e e NFC-e</p>
        </div>
      </div>

      {erro && <p className="error-alert">{erro}</p>}
      {msg && <p className="status-message">{msg}</p>}

      <div className="panel-section">
        <h2>Emitir Nova Nota Fiscal</h2>
        <form onSubmit={emitir} className="form-grid">
          <select value={form.modelo} onChange={(e) => setForm((f) => ({ ...f, modelo: e.target.value as NFe["modelo"] }))}>
            <option value="nfse">NFS-e (Serviços)</option>
            <option value="nfe">NF-e (Produtos)</option>
            <option value="nfce">NFC-e (Consumidor)</option>
          </select>
          <input
            placeholder="Natureza da operação"
            value={form.natureza}
            onChange={(e) => setForm((f) => ({ ...f, natureza: e.target.value }))}
          />
          <input
            placeholder="Nome do destinatário *"
            required
            value={form.destinatario_nome}
            onChange={(e) => setForm((f) => ({ ...f, destinatario_nome: e.target.value }))}
          />
          <input
            placeholder="CPF ou CNPJ do destinatário *"
            required
            value={form.destinatario_documento}
            onChange={(e) => setForm((f) => ({ ...f, destinatario_documento: e.target.value }))}
          />
          <input
            placeholder="E-mail do destinatário"
            type="email"
            value={form.destinatario_email}
            onChange={(e) => setForm((f) => ({ ...f, destinatario_email: e.target.value }))}
          />
          <input
            placeholder="Descrição do item/serviço *"
            required
            value={form.item_descricao}
            onChange={(e) => setForm((f) => ({ ...f, item_descricao: e.target.value }))}
          />
          <input
            placeholder="Quantidade"
            type="number"
            min="1"
            step="1"
            value={form.item_quantidade}
            onChange={(e) => setForm((f) => ({ ...f, item_quantidade: e.target.value }))}
          />
          <input
            placeholder="Valor unitário (R$) *"
            type="number"
            min="0.01"
            step="0.01"
            required
            value={form.item_valor}
            onChange={(e) => setForm((f) => ({ ...f, item_valor: e.target.value }))}
          />
          <button type="submit" disabled={loading} style={{ gridColumn: "span 2" }}>
            {loading ? "Emitindo..." : "Emitir Nota Fiscal"}
          </button>
        </form>
        {!process.env.NEXT_PUBLIC_FOCUS_NFE_CONFIGURADO && (
          <p style={{ color: "var(--muted)", fontSize: 12, marginTop: 8 }}>
            ⚠️ Configure FOCUS_NFE_TOKEN no .env.local para envio ao SEFAZ. Sem o token, a nota é salva como &quot;aguardando autorização&quot;.
          </p>
        )}
      </div>

      <div className="panel-section">
        <h2>Notas Fiscais Emitidas</h2>
        {nfes.length === 0 ? (
          <div className="empty-state"><p>Nenhuma nota fiscal emitida ainda.</p></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Modelo</th>
                <th>Número</th>
                <th>Destinatário</th>
                <th>Total</th>
                <th>Status</th>
                <th>Data</th>
                <th>DANFE</th>
              </tr>
            </thead>
            <tbody>
              {nfes.map((nfe) => (
                <tr key={nfe.id}>
                  <td><span className="badge">{nfe.modelo.toUpperCase()}</span></td>
                  <td>{nfe.numero ?? "—"}</td>
                  <td>{nfe.destinatario_nome}</td>
                  <td>{fmt(nfe.valor_total)}</td>
                  <td>
                    <span className="badge" style={{ background: STATUS_COR[nfe.status] + "22", color: STATUS_COR[nfe.status] }}>
                      {STATUS_LABEL[nfe.status] ?? nfe.status}
                    </span>
                  </td>
                  <td>{nfe.data_emissao ? new Date(nfe.data_emissao).toLocaleDateString("pt-BR") : "—"}</td>
                  <td>
                    {nfe.danfe_url ? (
                      <a href={nfe.danfe_url} target="_blank" rel="noreferrer" style={{ color: "var(--green-500)", fontWeight: 700 }}>
                        PDF
                      </a>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
