import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AtualizarEmpresaInput,
  CriarEmpresaInput,
  Empresa,
} from "@/modules/empresas/empresas.types";

type DefaultRole = {
  chave: string;
  descricao: string;
  nome: string;
  permissoes: string[];
};

const defaultRoles: DefaultRole[] = [
  {
    chave: "admin",
    descricao: "Administrador da empresa",
    nome: "Admin",
    permissoes: [
      "empresa.read",
      "empresa.update",
      "empresa.delete",
      "usuario.invite",
      "usuario.manage",
      "rbac.manage",
      "transacao.read",
      "transacao.create",
      "transacao.update",
      "transacao.delete",
      "transacao.manage",
      "billing.manage",
      "audit.read",
    ],
  },
  {
    chave: "financeiro",
    descricao: "Operador financeiro",
    nome: "Financeiro",
    permissoes: ["empresa.read", "transacao.read", "transacao.create", "transacao.update"],
  },
  {
    chave: "contador",
    descricao: "Contador da empresa",
    nome: "Contador",
    permissoes: ["empresa.read", "transacao.read", "audit.read"],
  },
  {
    chave: "user",
    descricao: "Usuario padrao",
    nome: "Usuario",
    permissoes: ["empresa.read", "transacao.read"],
  },
];

export async function listarEmpresasDoUsuario(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("empresas")
    .select("*, usuarios_empresas!inner(status)")
    .eq("usuarios_empresas.status", "ativo")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []) as Empresa[];
}

export async function buscarEmpresaPorId(supabase: SupabaseClient, empresaId: string) {
  const { data, error } = await supabase.from("empresas").select("*").eq("id", empresaId).single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Empresa;
}

export async function criarEmpresaComBootstrap(
  admin: SupabaseClient,
  input: CriarEmpresaInput,
  usuario: { email: string | null; id: string }
) {
  const { data: plano } = await admin
    .from("planos")
    .select("id")
    .eq("codigo", "starter")
    .maybeSingle();

  const { data: empresa, error: empresaError } = await admin
    .from("empresas")
    .insert({
      plano_id: plano?.id ?? null,
      nome_legal: input.nome_legal,
      nome_fantasia: input.nome_fantasia ?? null,
      cnpj: input.cnpj ?? null,
      regime_tributario: input.regime_tributario ?? null,
      subdominio: input.subdominio ?? null,
      cidade: input.cidade ?? null,
      estado: input.estado ?? null,
    })
    .select("*")
    .single();

  if (empresaError) {
    throw new Error(empresaError.message);
  }

  await admin.from("usuarios").upsert({
    email: usuario.email ?? "",
    id: usuario.id,
  });

  const insertedRoles = new Map<string, string>();

  for (const role of defaultRoles) {
    const { data, error } = await admin
      .from("roles")
      .insert({
        empresa_id: empresa.id,
        chave: role.chave,
        descricao: role.descricao,
        nome: role.nome,
        sistema: true,
      })
      .select("id, chave")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    insertedRoles.set(data.chave, data.id);
  }

  const { data: permissoes, error: permissoesError } = await admin
    .from("permissoes")
    .select("id, chave");

  if (permissoesError) {
    throw new Error(permissoesError.message);
  }

  const permissaoPorChave = new Map((permissoes ?? []).map((permissao) => [permissao.chave, permissao.id]));
  const rolePermissoes = defaultRoles.flatMap((role) => {
    const roleId = insertedRoles.get(role.chave);

    if (!roleId) {
      return [];
    }

    return role.permissoes
      .map((permissaoChave) => {
        const permissaoId = permissaoPorChave.get(permissaoChave);

        if (!permissaoId) {
          return null;
        }

        return {
          empresa_id: empresa.id,
          permissao_id: permissaoId,
          role_id: roleId,
        };
      })
      .filter(Boolean);
  });

  if (rolePermissoes.length > 0) {
    const { error } = await admin.from("roles_permissoes").insert(rolePermissoes);

    if (error) {
      throw new Error(error.message);
    }
  }

  const adminRoleId = insertedRoles.get("admin");

  if (!adminRoleId) {
    throw new Error("Role admin nao foi criada.");
  }

  const { error: vinculoError } = await admin.from("usuarios_empresas").insert({
    criado_por: usuario.id,
    empresa_id: empresa.id,
    role_id: adminRoleId,
    status: "ativo",
    usuario_id: usuario.id,
  });

  if (vinculoError) {
    throw new Error(vinculoError.message);
  }

  const { error: assinaturaError } = await admin.from("assinaturas").insert({
    empresa_id: empresa.id,
    plano_id: plano?.id,
    status: "trial",
  });

  if (assinaturaError) {
    throw new Error(assinaturaError.message);
  }

  return empresa as Empresa;
}

export async function excluirEmpresa(supabase: SupabaseClient, empresaId: string) {
  const { error } = await supabase.from("empresas").delete().eq("id", empresaId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function atualizarEmpresa(
  supabase: SupabaseClient,
  empresaId: string,
  input: AtualizarEmpresaInput
) {
  const { data, error } = await supabase
    .from("empresas")
    .update(input)
    .eq("id", empresaId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data as Empresa;
}
