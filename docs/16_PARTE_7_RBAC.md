# PARTE 7 - RBAC avancado

## Objetivo

Implementar controle de acesso baseado em roles e permissoes granulares por empresa.

## Modelo

```txt
empresas
  -> roles
  -> roles_permissoes
  -> permissoes

usuarios
  -> usuarios_empresas
  -> roles
```

## Decisoes de seguranca

- A role pertence a uma empresa.
- Permissoes sao catalogo global.
- Alterar roles/permissoes exige `rbac.manage`.
- Toda alteracao passa por API server-side.
- RLS continua validando no banco.
- O frontend apenas exibe e solicita mudancas.

## Arquivos criados

```txt
modules/rbac/rbac.types.ts
modules/rbac/rbac.validators.ts
modules/rbac/rbac.repository.ts
modules/rbac/rbac.service.ts
app/api/rbac/permissoes/route.ts
app/api/empresas/[empresaId]/rbac/roles/route.ts
app/api/empresas/[empresaId]/rbac/roles/[roleId]/permissoes/route.ts
services/rbacClientService.ts
app/rbac/page.tsx
```

## Endpoints

### Listar permissoes

```txt
GET /api/rbac/permissoes
```

### Listar roles da empresa

```txt
GET /api/empresas/:empresaId/rbac/roles
```

Exige:

```txt
rbac.manage
```

### Criar role

```txt
POST /api/empresas/:empresaId/rbac/roles
```

Payload:

```json
{
  "nome": "Analista Fiscal",
  "chave": "analista_fiscal",
  "descricao": "Acesso fiscal limitado"
}
```

### Atualizar permissoes da role

```txt
PUT /api/empresas/:empresaId/rbac/roles/:roleId/permissoes
```

Payload:

```json
{
  "permissao_ids": ["uuid-1", "uuid-2"]
}
```

## Tela

```txt
/rbac
```

Funcionalidades:

- criar role;
- listar roles;
- listar permissoes por modulo;
- marcar/desmarcar permissoes por role.

## Helper de autorizacao

O service expõe:

```ts
requirePermissao(empresaId, "rbac.manage")
```

Esse padrao deve ser reutilizado nas proximas partes para proteger acoes sensiveis.

## Alertas

- Alteracoes em roles devem gerar auditoria na Parte 8.
- Delecao de roles ainda nao foi exposta para evitar quebrar vinculos existentes.
- Roles de sistema podem ser editadas por enquanto se o usuario tiver `rbac.manage`; em producao pode ser desejavel bloquear edicao de roles `sistema`.
