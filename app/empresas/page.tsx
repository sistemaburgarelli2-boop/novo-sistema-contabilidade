"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import type { Empresa } from "@/modules/empresas/empresas.types";
import type { RoleEmpresa, UsuarioEmpresa } from "@/modules/usuarios/usuarios.types";
import {
  criarEmpresaTenant,
  getEmpresaAtivaId,
  listarEmpresasTenant,
  listarRolesEmpresa,
  listarUsuariosEmpresa,
  setEmpresaAtivaId,
  vincularUsuarioEmpresa,
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

  async function handleVincularUsuario(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!empresaAtivaId) {
      return;
    }

    setErro(null);
    setMensagem(null);

    try {
      const usuario = await vincularUsuarioEmpresa(empresaAtivaId, {
        email: emailUsuario,
        role_id: roleId,
      });
      setUsuarios((current) => {
        const filtered = current.filter((item) => item.usuario_id !== usuario.usuario_id);
        return [...filtered, usuario];
      });
      setEmailUsuario("");
      setMensagem("Usuario vinculado a empresa.");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao vincular usuario.");
    }
  }

  const empresaAtiva = empresas.find((empresa) => empresa.id === empresaAtivaId);

  return (
    <AppShell>
      <div style={{ display: "grid", gap: 24 }}>
        <header>
          <h1>Empresas e usuarios</h1>
          <p>Controle multi-tenant por vinculo, role e permissao.</p>
        </header>

        {erro ? <p style={{ color: "#b91c1c" }}>{erro}</p> : null}
        {mensagem ? <p style={{ color: "#047857" }}>{mensagem}</p> : null}

        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            display: "grid",
            gap: 16,
            padding: 20,
          }}
        >
          <h2>Nova empresa</h2>
          <form onSubmit={handleCriarEmpresa} style={{ display: "grid", gap: 12, maxWidth: 680 }}>
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

        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            display: "grid",
            gap: 16,
            padding: 20,
          }}
        >
          <h2>Empresas acessiveis</h2>
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

        <section
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: 8,
            display: "grid",
            gap: 16,
            padding: 20,
          }}
        >
          <h2>Usuarios da empresa</h2>

          <form onSubmit={handleVincularUsuario} style={{ display: "flex", gap: 12 }}>
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
            <button type="submit">Vincular usuario existente</button>
          </form>

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
