"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import type { Permissao, RoleComPermissoes } from "@/modules/rbac/rbac.types";
import { getEmpresaAtivaId } from "@/services/empresaClientService";
import {
  atualizarPermissoesRoleRbac,
  criarRoleRbac,
  listarPermissoesRbac,
  listarRolesRbac,
} from "@/services/rbacClientService";

export default function RbacPage() {
  const [empresaId, setEmpresaId] = useState<string | null>(null);
  const [permissoes, setPermissoes] = useState<Permissao[]>([]);
  const [roles, setRoles] = useState<RoleComPermissoes[]>([]);
  const [nome, setNome] = useState("");
  const [chave, setChave] = useState("");
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const permissoesPorModulo = useMemo(() => {
    return permissoes.reduce<Record<string, Permissao[]>>((accumulator, permissao) => {
      accumulator[permissao.modulo] = accumulator[permissao.modulo] ?? [];
      accumulator[permissao.modulo].push(permissao);
      return accumulator;
    }, {});
  }, [permissoes]);

  async function carregarRbac(currentEmpresaId: string) {
    const [permissoesData, rolesData] = await Promise.all([
      listarPermissoesRbac(),
      listarRolesRbac(currentEmpresaId),
    ]);
    setPermissoes(permissoesData);
    setRoles(rolesData);
  }

  useEffect(() => {
    const ativa = getEmpresaAtivaId();
    setEmpresaId(ativa);

    if (ativa) {
      carregarRbac(ativa).catch((error) => {
        setErro(error instanceof Error ? error.message : "Erro ao carregar RBAC.");
      });
    }
  }, []);

  async function handleCriarRole(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!empresaId) {
      return;
    }

    setErro(null);
    setMensagem(null);

    try {
      const role = await criarRoleRbac(empresaId, { chave, descricao, nome });
      setRoles((current) => [...current, { ...role, permissoes: [] }]);
      setNome("");
      setChave("");
      setDescricao("");
      setMensagem("Role criada.");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao criar role.");
    }
  }

  async function togglePermissao(role: RoleComPermissoes, permissao: Permissao) {
    if (!empresaId) {
      return;
    }

    const currentIds = new Set(role.permissoes.map((item) => item.id));

    if (currentIds.has(permissao.id)) {
      currentIds.delete(permissao.id);
    } else {
      currentIds.add(permissao.id);
    }

    try {
      await atualizarPermissoesRoleRbac(empresaId, role.id, Array.from(currentIds));
      await carregarRbac(empresaId);
      setMensagem("Permissões atualizadas.");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao atualizar permissoes.");
    }
  }

  if (!empresaId) {
    return (
      <AppShell>
        <div className="empty-state">
          <h1>RBAC</h1>
          <p>Selecione uma empresa ativa em Empresas para gerenciar roles e permissões.</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="page-stack">
        <div className="module-hero">
          <div>
            <h1>Permissões</h1>
            <p>Roles e permissões granulares por empresa.</p>
          </div>
        </div>

        {erro ? <p className="error-alert">{erro}</p> : null}
        {mensagem ? <p className="status-message">{mensagem}</p> : null}

        <section className="panel-section">
          <h2>Nova role</h2>
          <form className="form-grid" onSubmit={handleCriarRole} style={{ maxWidth: 560 }}>
            <input onChange={(event) => setNome(event.target.value)} placeholder="Nome" required value={nome} />
            <input
              onChange={(event) => setChave(event.target.value)}
              placeholder="chave-ex: analista_fiscal"
              required
              value={chave}
            />
            <input
              onChange={(event) => setDescricao(event.target.value)}
              placeholder="Descrição"
              value={descricao}
            />
            <button type="submit">Criar role</button>
          </form>
        </section>

        <section style={{ display: "grid", gap: 16 }}>
          {roles.map((role) => {
            const rolePermissaoIds = new Set(role.permissoes.map((permissao) => permissao.id));

            return (
              <article
                key={role.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: 20,
                }}
              >
                <h2>
                  {role.nome} {role.sistema ? "(sistema)" : ""}
                </h2>
                <p>{role.descricao}</p>

                <div style={{ display: "grid", gap: 16 }}>
                  {Object.entries(permissoesPorModulo).map(([modulo, moduloPermissoes]) => (
                    <div key={modulo}>
                      <strong>{modulo}</strong>
                      <div style={{ display: "grid", gap: 8, marginTop: 8 }}>
                        {moduloPermissoes.map((permissao) => (
                          <label key={permissao.id} style={{ alignItems: "center", display: "flex", gap: 8 }}>
                            <input
                              checked={rolePermissaoIds.has(permissao.id)}
                              onChange={() => togglePermissao(role, permissao)}
                              type="checkbox"
                            />
                            {permissao.chave} - {permissao.descricao}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </AppShell>
  );
}
