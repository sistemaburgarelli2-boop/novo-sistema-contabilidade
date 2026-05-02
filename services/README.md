# Services

Esta pasta contem services usados pelo frontend para chamar as APIs internas.

Regras:

- Usar `fetch` contra `/api/...`.
- Nao usar service role.
- Nao guardar segredo no browser.
- Nao tomar decisao final de permissao.
- Padronizar erros para a UI.

Arquivos antigos como `companyService.ts`, `financeService.ts` e `taxService.ts` existem por compatibilidade com telas legadas. Novos dominios devem usar o padrao `<dominio>ClientService.ts`.
