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
  const empresasAtivas = empresas.filter((empresa) => empresa.status === "ativa").length;
  const usuariosAtivos = usuarios.filter((usuario) => usuario.status === "ativo").length;
  const usuariosPendentes = usuarios.filter((usuario) => usuario.status === "pendente").length;
  const rolesDisponiveis = roles.length;

  return (
    <AppShell>
      <div className="page-stack">
        <div className="module-hero">
          <div>
            <h1>Empresas e usuários</h1>
            <p>Controle multi-tenant por vínculo, role e permissão.</p>
          </div>
          <div className="hero-actions">
            <button onClick={() => document.getElementById("nova-empresa")?.scrollIntoView({ behavior: "smooth" })} type="button">
              Nova empresa
            </button>
            <button className="small-action" onClick={() => window.print()} type="button">Exportar</button>
          </div>
        </div>

        {erro ? <p className="error-alert">{erro}</p> : null}
        {mensagem ? <p className="status-message">{mensagem}</p> : null}

        <section className="metric-grid">
          <article className="metric-card">
            <span>Total de empresas</span>
            <strong>{empresas.length}</strong>
            <p>Empresas acessíveis para o usuário atual</p>
          </article>
          <article className="metric-card">
            <span>Empresas ativas</span>
            <strong>{empresasAtivas}</strong>
            <p>Tenants em operação</p>
          </article>
          <article className="metric-card">
            <span>Usuários ativos</span>
            <strong>{usuariosAtivos}</strong>
            <p>Na empresa selecionada</p>
          </article>
          <article className="metric-card">
            <span>Convites pendentes</span>
            <strong>{usuariosPendentes}</strong>
            <p>Aguardando aceite ou ativação</p>
          </article>
          <article className="metric-card">
            <span>Roles</span>
            <strong>{rolesDisponiveis}</strong>
            <p>Perfis disponíveis para vínculo</p>
          </article>
        </section>

        <section className="panel-section" id="nova-empresa">
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
          <div className="toolbar-row">
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
            <span className="muted">{empresas.length} empresa(s) cadastrada(s)</span>
          </div>

          {empresaAtiva ? (
            <div className="company-card-grid">
              <article className="company-card">
                <div className="company-card-header">
                  <div style={{ display: "flex", gap: 12 }}>
                    <div className="company-avatar">
                      {(empresaAtiva.nome_fantasia || empresaAtiva.nome_legal).slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3>{empresaAtiva.nome_fantasia || empresaAtiva.nome_legal}</h3>
                      <p>{empresaAtiva.nome_legal}</p>
                    </div>
                  </div>
                  <span className="badge">{empresaAtiva.status}</span>
                </div>
                <div className="company-meta-grid">
                  <div className="company-meta-item">
                    <span>CNPJ</span>
                    <strong>{empresaAtiva.cnpj || "Não informado"}</strong>
                  </div>
                  <div className="company-meta-item">
                    <span>Regime</span>
                    <strong>{empresaAtiva.regime_tributario || "Não definido"}</strong>
                  </div>
                  <div className="company-meta-item">
                    <span>Cidade</span>
                    <strong>{empresaAtiva.cidade || "-"}</strong>
                  </div>
                  <div className="company-meta-item">
                    <span>Estado</span>
                    <strong>{empresaAtiva.estado || "-"}</strong>
                  </div>
                </div>
              </article>
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

          {usuarios.length === 0 ? (
            <div className="empty-state">
              <h2>Nenhum usuário vinculado</h2>
              <p>Gere um convite seguro para adicionar pessoas a esta empresa.</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Usuário</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Entrada</th>
                  </tr>
                </thead>
                <tbody>
                  {usuarios.map((usuario) => (
                    <tr key={usuario.id}>
                      <td>{usuario.usuarios?.nome || usuario.usuarios?.email || usuario.usuario_id}</td>
                      <td>{usuario.roles?.nome || usuario.role_id}</td>
                      <td><span className="badge">{usuario.status}</span></td>
                      <td>{new Date(usuario.created_at).toLocaleDateString("pt-BR")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
