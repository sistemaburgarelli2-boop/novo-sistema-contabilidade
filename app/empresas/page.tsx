"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import type { Empresa } from "@/modules/empresas/empresas.types";
import type { RoleEmpresa, UsuarioEmpresa } from "@/modules/usuarios/usuarios.types";
import {
  criarEmpresaTenant,
  criarConviteEmpresa,
  getEmpresaAtivaId,
  listarEmpresasTenant,
  listarRolesEmpresa,
  listarUsuariosEmpresa,
  setEmpresaAtivaId,
} from "@/services/empresaClientService";

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [empresaAtivaId, setEmpresaAtivaState] = useState<string | null>(null);
  const [usuarios, setUsuarios] = useState<UsuarioEmpresa[]>([]);
  const [roles, setRoles] = useState<RoleEmpresa[]>([]);
  const [nomeLegal, setNomeLegal] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [emailUsuario, setEmailUsuario] = useState("");
  const [roleId, setRoleId] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [conviteUrl, setConviteUrl] = useState<string | null>(null);

  async function carregarEmpresas() {
    const data = await listarEmpresasTenant();
    setEmpresas(data);

    const ativa = getEmpresaAtivaId() || data[0]?.id || null;
    setEmpresaAtivaState(ativa);

    if (ativa) {
      await carregarUsuariosERoles(ativa);
    }
  }

  async function carregarUsuariosERoles(empresaId: string) {
    const [usuariosData, rolesData] = await Promise.all([
      listarUsuariosEmpresa(empresaId),
      listarRolesEmpresa(empresaId),
    ]);
    setUsuarios(usuariosData);
    setRoles(rolesData);
    setRoleId(rolesData.find((role) => role.chave === "user")?.id ?? rolesData[0]?.id ?? "");
  }

  useEffect(() => {
    carregarEmpresas().catch((error) => {
      setErro(error instanceof Error ? error.message : "Erro ao carregar empresas.");
    });
  }, []);

  async function selecionarEmpresa(empresaId: string) {
    setEmpresaAtivaId(empresaId);
    setEmpresaAtivaState(empresaId);
    await carregarUsuariosERoles(empresaId);
  }

  async function handleCriarEmpresa(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro(null);
    setMensagem(null);

    try {
      const empresa = await criarEmpresaTenant({
        cnpj,
        nome_fantasia: nomeFantasia,
        nome_legal: nomeLegal,
      });
      setEmpresas((current) => [empresa, ...current]);
      setNomeLegal("");
      setNomeFantasia("");
      setCnpj("");
      await selecionarEmpresa(empresa.id);
      setMensagem("Empresa criada com role admin e vinculo inicial.");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao criar empresa.");
    }
  }

  async function handleCriarConvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!empresaAtivaId) {
      return;
    }

    setErro(null);
    setMensagem(null);

    try {
      const convite = await criarConviteEmpresa({
        email: emailUsuario,
        empresa_id: empresaAtivaId,
        role_id: roleId,
      });
      setEmailUsuario("");
      setConviteUrl(`${window.location.origin}${convite.invite_url}`);
      setMensagem("Convite criado com token seguro.");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao criar convite.");
    }
  }

  const empresaAtiva = empresas.find((empresa) => empresa.id === empresaAtivaId);

  return (
    <AppShell>
      <div className="page-stack">
        <div className="module-hero">
          <div>
            <h1>Empresas e usuários</h1>
            <p>Controle multi-tenant por vínculo, role e permissão.</p>
          </div>
        </div>

        {erro ? <p className="error-alert">{erro}</p> : null}
        {mensagem ? <p className="status-message">{mensagem}</p> : null}

        <section className="panel-section">
          <h2>Nova empresa</h2>
          <form className="form-grid" onSubmit={handleCriarEmpresa}>
            <input
              onChange={(event) => setNomeLegal(event.target.value)}
              placeholder="Nome legal"
              required
              value={nomeLegal}
            />
            <input
              onChange={(event) => setNomeFantasia(event.target.value)}
              placeholder="Nome fantasia"
              value={nomeFantasia}
            />
            <input onChange={(event) => setCnpj(event.target.value)} placeholder="CNPJ" value={cnpj} />
            <button type="submit">Criar empresa segura</button>
          </form>
        </section>

        <section className="panel-section">
          <h2>Empresas acessíveis</h2>
          <select
            onChange={(event) => selecionarEmpresa(event.target.value)}
            value={empresaAtivaId ?? ""}
          >
            <option value="">Selecione uma empresa</option>
            {empresas.map((empresa) => (
              <option key={empresa.id} value={empresa.id}>
                {empresa.nome_fantasia || empresa.nome_legal}
              </option>
            ))}
          </select>

          {empresaAtiva ? (
            <div>
              <strong>{empresaAtiva.nome_legal}</strong>
              <p>Status: {empresaAtiva.status}</p>
            </div>
          ) : null}
        </section>

        <section className="panel-section">
          <h2>Usuários da empresa</h2>

          <form className="toolbar-row" onSubmit={handleCriarConvite}>
            <input
              onChange={(event) => setEmailUsuario(event.target.value)}
              placeholder="email@empresa.com"
              required
              type="email"
              value={emailUsuario}
            />
            <select onChange={(event) => setRoleId(event.target.value)} required value={roleId}>
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.nome}
                </option>
              ))}
            </select>
            <button type="submit">Gerar convite seguro</button>
          </form>

          {conviteUrl ? (
            <div
              style={{
                background: "#ecfdf5",
                border: "1px solid #a7f3d0",
                borderRadius: 8,
                padding: 12,
              }}
            >
              <strong>Link de convite</strong>
              <p style={{ wordBreak: "break-all" }}>{conviteUrl}</p>
            </div>
          ) : null}

          <div style={{ display: "grid", gap: 8 }}>
            {usuarios.map((usuario) => (
              <article
                key={usuario.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <strong>{usuario.usuarios?.nome || usuario.usuarios?.email || usuario.usuario_id}</strong>
                <p>
                  Role: {usuario.roles?.nome || usuario.role_id} - Status: {usuario.status}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
