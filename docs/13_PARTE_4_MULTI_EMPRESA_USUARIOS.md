# PARTE 4 - Multi-empresa + Usuarios

## Objetivo

Implementar o nucleo multi-tenant de producao:

- usuario pode acessar varias empresas;
- empresa pode ter varios usuarios;
- acesso e controlado por `usuarios_empresas`;
- cada vinculo possui uma `role`;
- roles possuem permissoes granulares via `roles_permissoes`;
- criacao de empresa nao aceita `empresa_id` arbitrario do frontend.

## Decisoes de seguranca

- A criacao de empresa ocorre em API server-side.
- A API usa o usuario autenticado do Supabase Auth.
- A API usa service role apenas no backend para fazer bootstrap inicial.
- O frontend nunca cria role, permissao ou vinculo diretamente.
- A empresa criada recebe roles padrao: `admin`, `financeiro`, `contador`, `user`.
- O usuario criador recebe a role `admin`.
- RLS continua sendo a protecao principal para leitura/edicao.

## Arquivos criados

```txt
lib/supabaseAdmin.ts
modules/empresas/empresas.types.ts
modules/empresas/empresas.validators.ts
modules/empresas/empresas.repository.ts
modules/empresas/empresas.service.ts
modules/usuarios/usuarios.types.ts
modules/usuarios/usuarios.validators.ts
modules/usuarios/usuarios.repository.ts
modules/usuarios/usuarios.service.ts
app/api/empresas/route.ts
app/api/empresas/[empresaId]/route.ts
app/api/empresas/[empresaId]/roles/route.ts
app/api/empresas/[empresaId]/usuarios/route.ts
app/empresas/page.tsx
services/empresaClientService.ts
```

## Endpoints

### Listar empresas

```txt
GET /api/empresas
```

Retorna apenas empresas onde o usuario autenticado possui vinculo ativo em `usuarios_empresas`.

### Criar empresa

```txt
POST /api/empresas
```

Payload:

```json
{
  "nome_legal": "Empresa LTDA",
  "nome_fantasia": "Empresa",
  "cnpj": "00.000.000/0001-00"
}
```

Comportamento:

1. valida sessao;
2. valida payload;
3. cria empresa;
4. cria roles padrao;
5. vincula o usuario criador como `admin`;
6. cria assinatura trial;
7. retorna empresa criada.

### Buscar empresa

```txt
GET /api/empresas/:empresaId
```

RLS garante que apenas membros da empresa possam ler.

### Atualizar empresa

```txt
PATCH /api/empresas/:empresaId
```

RLS exige permissao `empresa.update`.

### Listar roles

```txt
GET /api/empresas/:empresaId/roles
```

Retorna roles daquela empresa acessivel.

### Listar usuarios da empresa

```txt
GET /api/empresas/:empresaId/usuarios
```

Retorna vinculos com usuario e role.

### Vincular usuario existente

```txt
POST /api/empresas/:empresaId/usuarios
```

Payload:

```json
{
  "email": "usuario@empresa.com",
  "role_id": "uuid"
}
```

Observacao: nesta Parte 4 o usuario precisa existir em `usuarios`. Criacao por convite seguro sera implementada na Parte 6.

## Frontend

Nova tela:

```txt
/empresas
```

Funcionalidades:

- criar empresa;
- selecionar empresa ativa;
- listar usuarios vinculados;
- vincular usuario existente a uma role.

## Variaveis necessarias

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_SERVICE_ROLE_KEY` nunca pode ser usada no frontend.

## Alertas

- O bootstrap inicial de empresa ainda nao e transacional no nivel SQL. Em producao ideal, migrar para RPC `security definer` com transacao no banco.
- Convite por email ainda nao foi implementado; isso entra na Parte 6.
- Validacao de limite de plano antes de criar empresa entra na Parte 5.
- Auditoria de criacao de empresa e vinculo entra na Parte 8.
