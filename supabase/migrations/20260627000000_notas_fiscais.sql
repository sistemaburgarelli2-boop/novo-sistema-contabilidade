-- Migration: Notas Fiscais (NFe/NFS-e)
-- Armazena notas fiscais puxadas automaticamente via API de terceiros

create table if not exists public.notas_fiscais (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid not null references public.companies(id) on delete cascade,

  -- Identificacao da nota
  chave_acesso text unique,
  numero text not null,
  serie text,
  modelo text not null default '55',
  tipo text not null,
  natureza_operacao text,

  -- Datas
  data_emissao timestamptz not null,
  data_entrada_saida timestamptz,

  -- Emitente / Destinatario
  emitente_cnpj text,
  emitente_nome text,
  destinatario_cnpj text,
  destinatario_nome text,

  -- Valores
  valor_total numeric(15,2) not null default 0,
  valor_produtos numeric(15,2) not null default 0,
  valor_servicos numeric(15,2) not null default 0,
  valor_desconto numeric(15,2) not null default 0,
  valor_frete numeric(15,2) not null default 0,

  -- Impostos
  valor_icms numeric(15,2) not null default 0,
  valor_ipi numeric(15,2) not null default 0,
  valor_pis numeric(15,2) not null default 0,
  valor_cofins numeric(15,2) not null default 0,
  valor_iss numeric(15,2) not null default 0,

  -- Status e controle
  status text not null default 'autorizada',
  situacao text not null default 'pendente',
  xml_url text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint nf_tipo_check check (tipo in ('emitida', 'recebida')),
  constraint nf_modelo_check check (modelo in ('55', '65', 'nfse')),
  constraint nf_status_check check (status in ('autorizada', 'cancelada', 'denegada', 'inutilizada')),
  constraint nf_situacao_check check (situacao in ('pendente', 'escriturada', 'conciliada', 'ignorada'))
);

create index if not exists idx_nf_empresa on public.notas_fiscais(empresa_id);
create index if not exists idx_nf_tipo on public.notas_fiscais(empresa_id, tipo);
create index if not exists idx_nf_data on public.notas_fiscais(empresa_id, data_emissao desc);
create index if not exists idx_nf_chave on public.notas_fiscais(chave_acesso);

create trigger set_notas_fiscais_updated_at
  before update on public.notas_fiscais
  for each row execute function public.set_updated_at();

alter table public.notas_fiscais enable row level security;

create policy "Membros da empresa podem ver notas fiscais"
  on public.notas_fiscais for select
  using (
    empresa_id in (
      select company_id from public.company_members
      where user_id = auth.uid()
    )
  );

create policy "Admins podem inserir notas fiscais"
  on public.notas_fiscais for insert
  with check (
    empresa_id in (
      select company_id from public.company_members
      where user_id = auth.uid()
      and role in ('owner', 'admin', 'accountant')
    )
  );

create policy "Admins podem atualizar notas fiscais"
  on public.notas_fiscais for update
  using (
    empresa_id in (
      select company_id from public.company_members
      where user_id = auth.uid()
      and role in ('owner', 'admin', 'accountant')
    )
  );
