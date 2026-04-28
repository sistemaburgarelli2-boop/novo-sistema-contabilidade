# Parte 9 - Boas Praticas Aplicaveis

## Organizacao de codigo

- Manter `app/api` apenas para entrada HTTP.
- Manter regras de negocio em `services` ou `lib`.
- Manter componentes visuais em `components`.
- Manter tipos compartilhados em `types`.
- Evitar regra de banco dentro de componentes React.

## Tratamento de erros

- Todas as APIs devem retornar `{ data, error }`.
- Erros de autenticacao devem retornar `401`.
- Erros de permissao devem retornar `403`.
- Erros de validacao devem retornar `400`.
- Erros inesperados devem retornar `500`.

## Logs

No MVP, usar `console.error` apenas em API Routes para falhas inesperadas.

Na evolucao:

- criar tabela `audit_logs`
- registrar criacao, edicao e exclusao de registros criticos
- registrar usuario, empresa, modulo, acao e timestamp
- integrar com ferramenta externa quando estiver em producao

## Seguranca

- Nunca usar `SUPABASE_SERVICE_ROLE_KEY` no frontend.
- Toda tabela operacional deve ter RLS ativado.
- Toda consulta operacional deve passar por `company_id`.
- Toda API deve validar sessao com `supabase.auth.getUser()`.
- Validar payload antes de gravar no banco.
- Separar permissao de dono, administrador, contador e visualizador.

## Performance

- Criar indices para `company_id`, datas e chaves estrangeiras.
- Paginar listas grandes.
- Evitar buscar colunas desnecessarias.
- Agregar dados pesados em APIs do servidor.
- Usar filtros por periodo em transacoes, notas e impostos.

## Supabase

- Usar `auth.users` apenas como origem de autenticacao.
- Manter `public.users` como perfil da aplicacao.
- Usar triggers para `updated_at`.
- Usar RLS como protecao principal, nao apenas filtro no frontend.

## Next.js

- Usar Client Components apenas quando houver estado, evento ou browser API.
- Usar API Routes para operacoes protegidas.
- Usar `proxy.ts` para protecao de rotas.
- Separar paginas por modulo.

## Qualidade

- Rodar `npm run build` antes de publicar.
- Criar validadores compartilhados para payloads.
- Adicionar testes conforme o modulo crescer.
- Documentar decisoes importantes em `docs/`.

## Regras especificas deste ERP

- Toda empresa deve ter uma fase (`lifecycle_stage`).
- Toda transacao deve pertencer a uma empresa.
- Toda categoria deve pertencer a uma empresa.
- Todo imposto calculado deve guardar periodo, faturamento, aliquota e valor.
- Todo modulo futuro deve nascer multiempresa.
