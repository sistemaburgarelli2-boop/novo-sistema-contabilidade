# Estrutura do Aplicativo de Contabilidade

## Objetivo

Criar um sistema contábil completo para acompanhar uma empresa desde a ideia inicial, análise de viabilidade, abertura, operação mensal, obrigações fiscais, gestão financeira, folha, documentos, relatórios gerenciais e encerramento.

O sistema deve funcionar como uma esteira de vida da empresa: cada cliente/empresa tem uma fase, tarefas obrigatórias, documentos, responsáveis, prazos, riscos e histórico.

## Ciclo de Vida da Empresa

### 1. Diagnostico inicial

Nesta fase o sistema coleta as informações antes da abertura da empresa.

Dados principais:

- Nome do empreendedor e socios
- CPF/CNPJ dos envolvidos
- Endereco de residencia e endereco pretendido da empresa
- Atividade principal pretendida
- Atividades secundarias
- Previsao de faturamento mensal e anual
- Modelo de negocio
- Cidade e estado
- Necessidade de funcionarios
- Capital social estimado
- Tipo de cliente: prestador de servico, comercio, industria, profissional liberal, MEI, startup, holding, rural ou terceiro setor

Analises automaticas:

- Pode ser MEI?
- CNAE permitido para MEI, Simples Nacional ou regime especifico
- Melhor natureza juridica inicial
- Risco de licenciamento municipal, vigilancia sanitaria, bombeiros ou ambiental
- Estimativa de tributos por regime
- Lista de documentos necessarios
- Checklist de viabilidade

Resultado esperado:

- Relatorio de viabilidade
- Recomendacao de tipo de empresa
- Recomendacao de regime tributario
- Checklist para abertura
- Status: `em_analise`, `aprovado_para_abertura` ou `inviavel_no_formato_atual`

### 2. Planejamento societario e tributario

Antes de abrir a empresa, o app deve ajudar a decidir a estrutura correta.

Modulos:

- Simulador de regimes tributarios
- Definicao de socios e participacoes
- Definicao de administradores
- Definicao de capital social
- Escolha de natureza juridica
- Escolha de porte: MEI, ME, EPP ou demais
- Analise de CNAE principal e secundarios
- Analise de endereco e licencas

Saidas:

- Plano de abertura
- Minuta de informacoes para contrato social
- Lista de documentos dos socios
- Previsao de custo mensal contabil/fiscal

### 3. Abertura da empresa

Fluxo operacional:

1. Consulta de viabilidade
2. DBE/CNPJ
3. Registro na Junta Comercial, Cartorio ou orgao competente
4. Inscricoes municipal e estadual quando aplicavel
5. Licencas e alvaras
6. Certificado digital
7. Parametrizacao fiscal
8. Emissao de notas fiscais
9. Cadastro de obrigacoes recorrentes

Entidades do sistema:

- Processo de abertura
- Protocolos
- Tarefas
- Documentos
- Orgaos envolvidos
- Pendencias
- Prazos
- Responsaveis

Status sugeridos:

- `rascunho`
- `aguardando_documentos`
- `viabilidade_em_andamento`
- `viabilidade_aprovada`
- `dbe_em_andamento`
- `registro_em_andamento`
- `licenciamento_em_andamento`
- `aberta`
- `cancelada`

### 4. Operacao mensal

Depois de aberta, a empresa entra no modulo recorrente.

Modulos principais:

- Cadastro da empresa
- Socios e procuradores
- Certificados digitais
- Clientes e fornecedores
- Contas bancarias
- Plano de contas
- Contas a pagar
- Contas a receber
- Conciliação bancaria
- Emissao/importacao de notas fiscais
- Apuracao de impostos
- Folha de pagamento
- Pro-labore
- Documentos e comprovantes
- Obrigações acessorias
- Relatorios contabeis

Rotina mensal:

- Coleta de documentos
- Importacao de notas
- Conciliacao bancaria
- Apuracao de impostos
- Geracao de guias
- Envio de declaracoes
- Fechamento contábil
- Relatorio para o cliente

### 5. Fiscal e impostos

O app deve manter uma agenda fiscal por empresa, regime e municipio.

Funcionalidades:

- Cadastro de regime tributario
- Cadastro de CNAEs
- Regras fiscais por atividade
- Vencimentos
- Guias geradas
- Pagamentos
- Declaracoes transmitidas
- Pendencias fiscais
- Historico de apuracao

Obrigacoes comuns:

- DAS/Simples Nacional
- DAS-MEI
- ISS municipal
- ICMS quando aplicavel
- PIS/COFINS
- IRPJ/CSLL
- DCTFWeb
- EFD-Reinf
- SPED quando aplicavel
- DEFIS
- DIRF/eSocial quando aplicavel

### 6. Folha e trabalhista

Modulos:

- Funcionarios
- Cargos
- Salarios
- Beneficios
- Ferias
- Afastamentos
- Rescisoes
- Pro-labore
- eSocial
- FGTS Digital
- INSS
- IRRF

Fluxo mensal:

- Fechamento da folha
- Conferencia de eventos
- Geracao de holerites
- Geracao de guias
- Envio de eventos
- Arquivamento de comprovantes

### 7. Contabil

Modulos:

- Plano de contas
- Lancamentos contabeis
- Centros de custo
- Conciliacao
- Balancete
- DRE
- Balanco patrimonial
- Livro diario
- Livro razao
- Termos de abertura e encerramento

O sistema deve permitir lancamentos manuais e tambem gerados a partir de eventos financeiros, fiscais e folha.

### 8. Atendimento e relacionamento

Modulos:

- Portal do cliente
- Chat ou mural de mensagens
- Solicitacoes
- Tarefas internas
- Alertas de vencimento
- Upload de documentos
- Aprovação de guias
- Historico de conversas
- Notificacoes por email/WhatsApp

### 9. Alteracoes empresariais

O app tambem precisa tratar a empresa depois de aberta.

Tipos de alteracao:

- Mudanca de endereco
- Mudanca de socios
- Alteracao de capital social
- Inclusao ou exclusao de CNAE
- Mudanca de nome empresarial
- Alteracao de administrador
- Enquadramento ou desenquadramento
- Troca de regime tributario
- Abertura de filial

Cada alteracao deve ter:

- Checklist
- Documentos exigidos
- Protocolos
- Prazos
- Status
- Historico

### 10. Encerramento da empresa

Fluxo de baixa:

1. Diagnostico de pendencias
2. Verificacao fiscal, trabalhista e municipal
3. Regularizacao de debitos e declaracoes
4. Elaboracao do ato de encerramento/distrato quando aplicavel
5. Protocolo de baixa no CNPJ e orgaos competentes
6. Baixa de inscricoes estadual/municipal
7. Encerramento contábil
8. Arquivo final de documentos

Status:

- `solicitada`
- `em_diagnostico`
- `regularizando_pendencias`
- `baixa_em_andamento`
- `baixada`
- `bloqueada_por_pendencias`

## Modulos do Produto

### Dashboard

Visao geral do escritorio e das empresas:

- Empresas por fase
- Tarefas atrasadas
- Guias vencendo
- Processos de abertura em andamento
- Empresas com pendencias
- Faturamento estimado dos clientes
- Alertas criticos

### Empresas

Cadastro principal:

- Dados cadastrais
- Socios
- Atividades/CNAEs
- Regime tributario
- Certificados
- Inscricoes
- Enderecos
- Documentos
- Historico

### Jornada da Empresa

Tela visual com fases:

- Ideia
- Diagnostico
- Planejamento
- Abertura
- Operacao
- Alteracao
- Encerramento

### Tarefas e Prazos

Motor de workflow:

- Tarefas padrao por tipo de processo
- Responsavel interno
- Responsavel cliente
- Prazo
- Prioridade
- Dependencias
- Status

### Documentos

Repositorio por empresa:

- Contrato social
- CNPJ
- Inscricoes
- Alvaras
- Certificados
- Guias
- Declaracoes
- Comprovantes
- Relatorios

### Fiscal

- Apuracoes
- Guias
- Declaracoes
- Calendario fiscal
- Pendencias

### Financeiro

- Contas a pagar
- Contas a receber
- Banco
- Conciliacao
- Relatorios

### Folha

- Funcionarios
- Eventos
- Holerites
- Guias
- eSocial

### Relatorios

- DRE
- Balanco
- Balancete
- Fluxo de caixa
- Impostos pagos
- Pendencias
- Saude da empresa

## Modelo Inicial de Banco de Dados

Tabelas centrais:

- `profiles`
- `companies`
- `company_partners`
- `company_addresses`
- `company_activities`
- `company_lifecycle_events`
- `opening_processes`
- `change_processes`
- `closing_processes`
- `tasks`
- `documents`
- `tax_regimes`
- `tax_obligations`
- `tax_filings`
- `tax_payments`
- `financial_accounts`
- `payables`
- `receivables`
- `bank_transactions`
- `accounting_entries`
- `employees`
- `payroll_runs`
- `messages`
- `audit_logs`

Campos importantes em `companies`:

- `id`
- `owner_id`
- `legal_name`
- `trade_name`
- `cnpj`
- `status`
- `lifecycle_stage`
- `legal_nature`
- `tax_regime`
- `company_size`
- `main_cnae`
- `city`
- `state`
- `opened_at`
- `closed_at`
- `created_at`
- `updated_at`

Campos importantes em `tasks`:

- `id`
- `company_id`
- `process_id`
- `process_type`
- `title`
- `description`
- `status`
- `priority`
- `assigned_to`
- `due_date`
- `completed_at`
- `created_at`

## Telas Prioritarias para o MVP

1. Login e cadastro
2. Dashboard
3. Cadastro de empresa/cliente
4. Diagnostico inicial da empresa
5. Jornada da empresa
6. Processo de abertura com checklist
7. Tarefas e prazos
8. Documentos
9. Fiscal basico
10. Relatorio de viabilidade

## Ordem de Implementacao Recomendada

### Fase 1 - Fundacao

- Ajustar rotas do Next.js
- Criar layout principal do sistema
- Criar sidebar e dashboard
- Criar tabelas base no Supabase
- Criar CRUD de empresas
- Criar cadastro de socios e atividades

### Fase 2 - Diagnostico e abertura

- Criar formulario de diagnostico inicial
- Criar motor de recomendacao basico
- Criar checklist de abertura
- Criar acompanhamento de protocolos
- Criar geracao de relatorio

### Fase 3 - Operacao mensal

- Criar tarefas recorrentes
- Criar calendario fiscal
- Criar documentos por empresa
- Criar apuracoes simples
- Criar financeiro basico

### Fase 4 - Contabil, folha e encerramento

- Plano de contas
- Lancamentos
- Folha
- Alteracoes empresariais
- Baixa/encerramento
- Auditoria e historico completo

## Regras de Produto

- Toda empresa deve ter uma fase atual.
- Todo processo deve gerar tarefas.
- Toda tarefa deve ter responsavel e prazo.
- Todo documento deve pertencer a uma empresa ou processo.
- Toda alteracao importante deve gerar log.
- Nenhum processo deve ser finalizado com tarefa obrigatoria pendente.
- O sistema deve separar o que e responsabilidade do cliente e o que e responsabilidade do escritorio.

## Observacoes Legais e Operacionais

As regras de abertura, licenciamento, tributacao e baixa podem variar por municipio, estado, CNAE, natureza juridica e regime tributario. O aplicativo deve armazenar regras configuraveis e permitir revisao por contador responsavel.

O sistema pode orientar e organizar o processo, mas decisoes tributarias e societarias devem ser validadas por profissional habilitado.
