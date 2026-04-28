"use client";

import { useState } from "react";
import type { Company } from "@/types/company";
import type { CompanyPayload } from "@/services/companyService";

type CompanyFormProps = {
  company?: Company;
  onSubmit: (payload: CompanyPayload) => Promise<void>;
};

export function CompanyForm({ company, onSubmit }: CompanyFormProps) {
  const [legalName, setLegalName] = useState(company?.legal_name ?? "");
  const [tradeName, setTradeName] = useState(company?.trade_name ?? "");
  const [cnpj, setCnpj] = useState(company?.cnpj ?? "");
  const [taxRegime, setTaxRegime] = useState(company?.tax_regime ?? "simples");
  const [city, setCity] = useState(company?.city ?? "");
  const [state, setState] = useState(company?.state ?? "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    try {
      await onSubmit({
        legal_name: legalName,
        trade_name: tradeName,
        cnpj,
        tax_regime: taxRegime,
        city,
        state,
      });
      setLegalName("");
      setTradeName("");
      setCnpj("");
      setCity("");
      setState("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12, maxWidth: 640 }}>
      <input
        onChange={(event) => setLegalName(event.target.value)}
        placeholder="Razao social"
        required
        value={legalName}
      />
      <input
        onChange={(event) => setTradeName(event.target.value)}
        placeholder="Nome fantasia"
        value={tradeName}
      />
      <input onChange={(event) => setCnpj(event.target.value)} placeholder="CNPJ" value={cnpj} />
      <select onChange={(event) => setTaxRegime(event.target.value)} value={taxRegime}>
        <option value="mei">MEI</option>
        <option value="simples">Simples Nacional</option>
        <option value="presumido">Lucro Presumido</option>
        <option value="real">Lucro Real</option>
      </select>
      <input onChange={(event) => setCity(event.target.value)} placeholder="Cidade" value={city} />
      <input onChange={(event) => setState(event.target.value)} placeholder="UF" value={state} />
      <button disabled={loading} type="submit">
        {loading ? "Salvando..." : "Salvar empresa"}
      </button>
    </form>
  );
}
