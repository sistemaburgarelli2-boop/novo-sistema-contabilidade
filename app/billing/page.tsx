"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import type { Assinatura, Plano } from "@/modules/billing/billing.types";
import { getEmpresaAtivaId } from "@/services/empresaClientService";
import { buscarAssinaturaBilling, listarPlanosBilling } from "@/services/billingClientService";

const currency = new Intl.NumberFormat("pt-BR", {
  currency: "BRL",
  style: "currency",
});

export default function BillingPage() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [assinatura, setAssinatura] = useState<(Assinatura & { planos: Plano }) | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const empresaId = getEmpresaAtivaId();

    Promise.all([
      listarPlanosBilling(),
      empresaId ? buscarAssinaturaBilling(empresaId) : Promise.resolve(null),
    ])
      .then(([planosData, assinaturaData]) => {
        setPlanos(planosData);
        setAssinatura(assinaturaData);
      })
      .catch((error) => {
        setErro(error instanceof Error ? error.message : "Erro ao carregar billing.");
      });
  }, []);

  return (
    <AppShell>
      <div className="page-stack">
        <div className="module-hero">
          <div>
            <h1>Planos e billing</h1>
            <p>Controle de assinatura, limites de uso e bloqueios por empresa.</p>
          </div>
        </div>

        {erro ? <p className="error-alert">{erro}</p> : null}

        <section className="panel-section">
          <h2>Assinatura atual</h2>
          {assinatura ? (
            <div>
              <strong>{assinatura.planos.nome}</strong>
              <p>Status: {assinatura.status}</p>
              <p>Usuários: até {assinatura.planos.limite_usuarios}</p>
              <p>Transações/mês: até {assinatura.planos.limite_transacoes_mes}</p>
            </div>
          ) : (
            <p>Selecione uma empresa ativa para ver a assinatura.</p>
          )}
        </section>

        <section style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
          {planos.map((plano) => (
            <article
              key={plano.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: 20,
              }}
            >
              <h2>{plano.nome}</h2>
              <strong>{currency.format(plano.preco_centavos / 100)}</strong>
              <p>{plano.limite_empresas} empresa(s)</p>
              <p>{plano.limite_usuarios} usuário(s)</p>
              <p>{plano.limite_transacoes_mes} transações/mês</p>
            </article>
          ))}
        </section>
      </div>
    </AppShell>
  );
}
