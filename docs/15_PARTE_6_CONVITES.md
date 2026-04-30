# PARTE 6 - Convites seguros por email

## Objetivo

Implementar convite seguro para usuarios entrarem em uma empresa com role definida, sem cadastro publico aberto.

## Decisoes de seguranca

- Token puro aparece apenas no link enviado ao convidado.
- Banco armazena somente `token_hash`.
- Convite expira em 7 dias.
- Convite so pode ser aceito uma vez.
- Role precisa pertencer a empresa.
- Quem cria convite precisa ter permissao `usuario.invite`.
- Aceite cria usuario no Supabase Auth com service role server-side.
- Aceite cria/atualiza vinculo em `usuarios_empresas`.

## Arquivos criados

```txt
modules/convites/convites.types.ts
modules/convites/convites.validators.ts
modules/convites/convites.security.ts
modules/convites/convites.repository.ts
modules/convites/convites.service.ts
app/api/convites/route.ts
app/api/convites/aceitar/route.ts
app/convites/aceitar/page.tsx
```

## Criar convite

```txt
POST /api/convites
```

Payload:

```json
{
  "empresa_id": "uuid",
  "email": "usuario@empresa.com",
  "role_id": "uuid"
}
```

Resposta:

```json
{
  "data": {
    "convite": {},
    "invite_url": "/convites/aceitar?token=..."
  },
  "error": null
}
```

## Visualizar convite

```txt
GET /api/convites/aceitar?token=...
```

Retorna dados publicos:

- email convidado;
- nome da empresa;
- role.

## Aceitar convite

```txt
POST /api/convites/aceitar
```

Payload:

```json
{
  "token": "...",
  "nome": "Nome do usuario",
  "password": "senha forte"
}
```

Comportamento:

1. hash do token recebido;
2. busca convite pendente e nao expirado;
3. cria usuario no Supabase Auth se nao existir;
4. cria/atualiza `usuarios`;
5. cria/atualiza `usuarios_empresas`;
6. marca convite como `aceito`.

## Tela

```txt
/convites/aceitar?token=...
```

## Alertas

- O envio real por email ainda nao foi conectado; por enquanto a tela mostra o link gerado.
- Em producao, integrar com Resend, SendGrid ou outro provedor.
- Rate limit deve ser aplicado em criacao e aceite de convites.
- Idealmente, aceite deve registrar `audit_logs`.
