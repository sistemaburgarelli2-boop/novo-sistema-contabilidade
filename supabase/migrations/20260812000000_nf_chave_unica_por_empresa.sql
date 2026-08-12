-- A unicidade de chave_acesso era global, o que fazia uma mesma NFS-e existir
-- apenas uma vez no banco inteiro. Num escritorio de contabilidade isso descarta
-- silenciosamente notas legitimas: quando a empresa A presta servico para a
-- empresa B e ambas sao clientes, a nota precisa existir como "emitida" para A
-- e como "recebida" para B.
--
-- A unicidade correta e por (empresa_id, chave_acesso). Chaves nulas continuam
-- permitidas em duplicidade (NULL nao colide em indice unico no Postgres), o que
-- preserva o lancamento manual de notas sem chave.

alter table public.notas_fiscais
  drop constraint if exists notas_fiscais_chave_acesso_key;

create unique index if not exists uq_nf_empresa_chave
  on public.notas_fiscais (empresa_id, chave_acesso);
