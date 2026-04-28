"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { ActiveCompanySelector } from "@/components/companies/ActiveCompanySelector";
import { CompanyForm } from "@/components/companies/CompanyForm";
import { CompanyList } from "@/components/companies/CompanyList";
import {
  createCompany,
  getActiveCompanyId,
  listCompanies,
  setActiveCompanyId,
  type CompanyPayload,
} from "@/services/companyService";
import type { Company } from "@/types/company";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompanyId, setActiveCompanyIdState] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadCompanies() {
    try {
      const data = await listCompanies();
      setCompanies(data);
      setActiveCompanyIdState(getActiveCompanyId());
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "Erro ao carregar empresas.");
    }
  }

  useEffect(() => {
    loadCompanies();
  }, []);

  async function handleCreateCompany(payload: CompanyPayload) {
    const company = await createCompany(payload);
    setCompanies((current) => [company, ...current]);
    handleSelectCompany(company.id);
  }

  function handleSelectCompany(companyId: string) {
    setActiveCompanyId(companyId);
    setActiveCompanyIdState(companyId);
  }

  return (
    <AppShell>
      <div style={{ display: "grid", gap: 24 }}>
        <header>
          <h1>Empresas</h1>
          <ActiveCompanySelector
            activeCompanyId={activeCompanyId}
            companies={companies}
            onSelect={handleSelectCompany}
          />
        </header>

        {error ? <p>{error}</p> : null}

        <section>
          <h2>Nova empresa</h2>
          <CompanyForm onSubmit={handleCreateCompany} />
        </section>

        <section>
          <h2>Empresas cadastradas</h2>
          <CompanyList
            activeCompanyId={activeCompanyId}
            companies={companies}
            onSelect={handleSelectCompany}
          />
        </section>
      </div>
    </AppShell>
  );
}
