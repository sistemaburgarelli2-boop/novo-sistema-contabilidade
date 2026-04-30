# PARTE 8 - Auditoria completa

## Objetivo

Registrar acoes criticas do ERP em `audit_logs`, com empresa, usuario, recurso, antes/depois, IP, user-agent e request id.

## Decisoes de seguranca

- Escrita de auditoria usa backend/service role.
- Usuario comum nao altera nem remove logs.
- Leitura depende da permissao `audit.read` via RLS.
- Falha ao gravar auditoria nao deve derrubar a operacao principal, mas e registrada em `console.error`.
- Logs sao append-only por desenho de RLS.

## Arquivos criados

```txt
modules/auditoria/auditoria.types.ts
modules/auditoria/auditoria.repository.ts
modules/auditoria/auditoria.service.ts
lib/requestContext.ts
app/api/auditoria/[empresaId]/route.ts
services/auditoriaClientService.ts
app/auditoria/page.tsx
```

## Eventos registrados

- `empresa.created`
- `empresa.updated`
- `convite.created`
- `convite.accepted`
- `usuario_empresa.created`
- `rbac.role.created`
- `rbac.role_permissions.updated`
- `transacao.created`

## Endpoint

```txt
GET /api/auditoria/:empresaId
```

Retorna os ultimos 200 eventos da empresa.

## Tela

```txt
/auditoria
```

Mostra:

- acao;
- recurso;
- usuario;
- IP;
- request id;
- timestamp;
- dados posteriores em JSON.

## Campos de auditoria

```txt
user_id
empresa_id
action
resource_type
resource_id
before_data
after_data
ip
user_agent
request_id
created_at
```

## Alertas

- Em producao, enviar logs estruturados tambem para provedor externo.
- Adicionar retencao e exportacao conforme necessidade juridica.
- Webhooks Stripe devem auditar payload validado.
- Auditoria de login pode ser adicionada depois com cuidado para nao registrar senhas ou dados sensiveis.
