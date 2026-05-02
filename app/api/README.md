# API Routes

Esta pasta contem os handlers HTTP do Next.js.

Regras:

- Validar sessao antes de executar regra protegida.
- Validar payload com validators do modulo.
- Validar permissao no backend quando a acao for sensivel.
- Nunca confiar em `empresa_id` vindo do frontend.
- Chamar services em `modules/`; nao colocar regra de negocio grande no handler.
- Responder com `ok`, `created` ou `fail` de `lib/apiResponse.ts`.
- Registrar auditoria em acoes criticas.
- Manter RLS como autorizacao final no banco.
