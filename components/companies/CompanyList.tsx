"use client";

import type { Company } from "@/types/company";

type CompanyListProps = {
  activeCompanyId: string | null;
  companies: Company[];
  onSelect: (companyId: string) => void;
};

export function CompanyList({ activeCompanyId, companies, onSelect }: CompanyListProps) {
  if (companies.length === 0) {
    return <p>Nenhuma empresa cadastrada.</p>;
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      {companies.map((company) => (
        <article
          key={company.id}
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            padding: 16,
          }}
        >
          <strong>{company.legal_name}</strong>
          <p>{company.trade_name || "Sem nome fantasia"}</p>
          <p>
            {company.tax_regime || "Sem regime"} - {company.lifecycle_stage}
          </p>
          <button onClick={() => onSelect(company.id)}>
            {activeCompanyId === company.id ? "Empresa ativa" : "Selecionar"}
          </button>
        </article>
      ))}
    </div>
  );
}
