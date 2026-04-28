"use client";

import type { Company } from "@/types/company";

type ActiveCompanySelectorProps = {
  activeCompanyId: string | null;
  companies: Company[];
  onSelect: (companyId: string) => void;
};

export function ActiveCompanySelector({
  activeCompanyId,
  companies,
  onSelect,
}: ActiveCompanySelectorProps) {
  return (
    <select
      onChange={(event) => onSelect(event.target.value)}
      value={activeCompanyId ?? ""}
    >
      <option value="">Selecione uma empresa</option>
      {companies.map((company) => (
        <option key={company.id} value={company.id}>
          {company.trade_name || company.legal_name}
        </option>
      ))}
    </select>
  );
}
