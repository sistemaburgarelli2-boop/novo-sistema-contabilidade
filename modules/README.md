# Modules

Camada de dominio do ERP.

Cada modulo deve seguir este padrao:

```text
modules/<dominio>/
  <dominio>.types.ts
  <dominio>.validators.ts
  <dominio>.repository.ts
  <dominio>.service.ts
  <dominio>.security.ts
```

Responsabilidades:

- `types`: contratos e DTOs.
- `validators`: validacao e normalizacao de entrada externa.
- `repository`: acesso ao Supabase/PostgreSQL.
- `service`: regra de negocio, autorizacao de alto nivel e orquestracao.
- `security`: hashes, tokens, assinaturas e funcoes sensiveis do dominio.

Nao importe componentes React nesta camada.
