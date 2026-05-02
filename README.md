# Burgarelli Contabil ERP

ERP contabil SaaS multi-tenant em Next.js, Supabase e Vercel.

## Como rodar

```bash
npm install
npm run dev
```

## Arquitetura

A arquitetura de producao esta documentada em:

- `docs/10_PARTE_1_ARQUITETURA_PRODUCAO.md`
- `docs/11_PARTE_2_BANCO_RLS_PRODUCAO.sql`
- `docs/12_PARTE_3_AUTENTICACAO.md`
- `docs/13_PARTE_4_MULTI_EMPRESA_USUARIOS.md`
- `docs/14_PARTE_5_PLANOS_BILLING.md`
- `docs/15_PARTE_6_CONVITES.md`
- `docs/16_PARTE_7_RBAC.md`
- `docs/17_PARTE_8_AUDITORIA.md`
- `docs/18_PARTE_9_SEGURANCA_AVANCADA.md`
- `docs/19_PARTE_10_ESTRUTURA_FINAL.md`
- `docs/20_PARTE_11_EVOLUCAO_BIG_TECH.md`

## Variaveis obrigatorias

Crie `.env.local` no desenvolvimento e configure tambem na Vercel:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_APP_URL=
```

Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend.
