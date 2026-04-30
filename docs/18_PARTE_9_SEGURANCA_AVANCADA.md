# PARTE 9 - Seguranca avancada e hardening

## Objetivo

Adicionar protecoes praticas de producao ao ERP:

- headers de seguranca;
- CSP inicial;
- rate limit;
- sanitizacao;
- logs estruturados;
- protecao contra brute force;
- base para observabilidade.

## Arquivos criados

```txt
lib/securityHeaders.ts
lib/rateLimit.ts
lib/sanitize.ts
lib/logger.ts
```

## Headers de seguranca

Aplicados no `proxy.ts`:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy`
- `Content-Security-Policy`

## Rate limit

Implementado em memoria para MVP/Vercel:

- login: 8 tentativas/minuto por IP;
- criacao de convite: 20/minuto por IP;
- aceite de convite: 10/minuto por IP;
- webhook Stripe: 60/minuto por IP.

Alerta: em producao com multiplas instancias, trocar por Redis/Upstash/KV para consistencia global.

## Sanitizacao

Aplicada em:

- login email;
- convites email/nome/token;
- empresas nome/subdominio/cidade/estado.

Regra: sanitizacao nao substitui validacao nem RLS.

## Logs estruturados

Criado `logStructured` para eventos:

- login sucesso;
- login falha;
- login rate limited.

Proxima evolucao:

- enviar para Datadog, Axiom, Logtail, Grafana Loki ou OpenTelemetry collector.

## CSP

CSP atual permite:

- self;
- inline/eval temporariamente por compatibilidade Next;
- conexao com Supabase.

Alerta: endurecer CSP depois que UI e bibliotecas estiverem estabilizadas.

## Protecoes ainda recomendadas

- MFA para administradores;
- Redis rate limit;
- Stripe SDK com validacao real de assinatura;
- deteccao de anomalias;
- alertas de erro 5xx;
- WAF/CDN;
- testes automatizados de RLS;
- rotacao de secrets;
- backup e recovery testados.
