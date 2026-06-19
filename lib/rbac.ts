/* ─── RBAC — Roles & Permissions ─────────────────────────────── */

export const ROLES: Record<
  string,
  { nome: string; permissoes: string[] }
> = {
  administrador: {
    nome: "Administrador",
    permissoes: ["*"],
  },
  diretor_operacional: {
    nome: "Diretor Operacional",
    permissoes: [
      "empresa.read", "empresa.manage",
      "fiscal.read", "contabil.read", "dp.read", "societario.read", "financeiro.read",
      "tarefa.read", "tarefa.write",
      "documento.read",
      "usuario.read",
      "relatorio.read",
      "auditoria.read",
    ],
  },
  gerente_contabil: {
    nome: "Gerente Contábil",
    permissoes: [
      "empresa.read",
      "fiscal.read", "fiscal.write",
      "contabil.read", "contabil.write",
      "dp.read", "dp.write",
      "tarefa.read", "tarefa.write",
      "documento.read", "documento.write",
      "relatorio.read",
    ],
  },
  coordenador: {
    nome: "Coordenador",
    permissoes: [
      "empresa.read",
      "fiscal.read", "contabil.read", "dp.read",
      "tarefa.read", "tarefa.write",
      "documento.read",
      "relatorio.read",
    ],
  },
  analista_fiscal: {
    nome: "Analista Fiscal",
    permissoes: [
      "empresa.read",
      "fiscal.read", "fiscal.write",
      "documento.read", "documento.write",
      "tarefa.read",
    ],
  },
  analista_contabil: {
    nome: "Analista Contábil",
    permissoes: [
      "empresa.read",
      "contabil.read", "contabil.write",
      "documento.read", "documento.write",
      "tarefa.read",
    ],
  },
  analista_dp: {
    nome: "Analista DP",
    permissoes: [
      "empresa.read",
      "dp.read", "dp.write",
      "documento.read", "documento.write",
      "tarefa.read",
    ],
  },
  analista_societario: {
    nome: "Analista Societário",
    permissoes: [
      "empresa.read",
      "societario.read", "societario.write",
      "documento.read",
      "tarefa.read",
    ],
  },
  financeiro: {
    nome: "Financeiro",
    permissoes: [
      "empresa.read",
      "financeiro.read", "financeiro.write",
      "mensalidade.read", "mensalidade.write",
      "tarefa.read",
    ],
  },
  comercial: {
    nome: "Comercial",
    permissoes: [
      "crm.read", "crm.write",
      "empresa.read",
    ],
  },
  cliente: {
    nome: "Cliente",
    permissoes: [
      "empresa.read",
      "documento.read", "documento.upload",
      "guia.download",
      "solicitacao.create", "solicitacao.read",
      "notificacao.read",
    ],
  },
};

export const ALL_PERMISSIONS: { modulo: string; perms: string[] }[] = [
  { modulo: "Empresa",       perms: ["empresa.read", "empresa.write", "empresa.manage"] },
  { modulo: "Fiscal",        perms: ["fiscal.read", "fiscal.write"] },
  { modulo: "Contábil",      perms: ["contabil.read", "contabil.write"] },
  { modulo: "DP",            perms: ["dp.read", "dp.write"] },
  { modulo: "Societário",    perms: ["societario.read", "societario.write"] },
  { modulo: "Financeiro",    perms: ["financeiro.read", "financeiro.write", "mensalidade.read", "mensalidade.write"] },
  { modulo: "Documentos",    perms: ["documento.read", "documento.write", "documento.upload"] },
  { modulo: "Tarefas",       perms: ["tarefa.read", "tarefa.write"] },
  { modulo: "Guias",         perms: ["guia.download"] },
  { modulo: "Solicitações",  perms: ["solicitacao.create", "solicitacao.read"] },
  { modulo: "Usuários",      perms: ["usuario.read", "usuario.write", "usuario.manage"] },
  { modulo: "Permissões",    perms: ["permission.read", "permission.manage"] },
  { modulo: "CRM",           perms: ["crm.read", "crm.write"] },
  { modulo: "Relatórios",    perms: ["relatorio.read"] },
  { modulo: "Auditoria",     perms: ["auditoria.read"] },
  { modulo: "Notificações",  perms: ["notificacao.read"] },
];

/** Retorna todas as permission keys disponíveis (flat) */
export function allPermissionKeys(): string[] {
  return ALL_PERMISSIONS.flatMap((g) => g.perms);
}

/** Verifica se um array de permissões contém uma permissão específica (suporta wildcard "*") */
export function checkPermission(userPerms: string[], perm: string): boolean {
  if (userPerms.includes("*")) return true;
  return userPerms.includes(perm);
}

/** Verifica se possui QUALQUER uma das permissões */
export function checkAnyPermission(userPerms: string[], perms: string[]): boolean {
  if (userPerms.includes("*")) return true;
  return perms.some((p) => userPerms.includes(p));
}
