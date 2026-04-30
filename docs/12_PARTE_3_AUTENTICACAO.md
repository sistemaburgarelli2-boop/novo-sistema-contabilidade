# PARTE 3 - Autenticacao com Supabase Auth

## Objetivo

Implementar autenticacao real com Supabase Auth no ERP contabil SaaS, usando sessao segura em cookies, protecao de rotas no `proxy.ts` e API server-side para login/logout.

## Decisoes arquiteturais

- Login deve passar pelo backend (`/api/auth/login`), nao chamar Supabase diretamente da tela.
- O backend valida payload antes de autenticar.
- A sessao e persistida pelos cookies gerenciados pelo Supabase SSR.
- Rotas privadas sao protegidas no `proxy.ts`.
- RLS continua sendo a protecao definitiva de dados no banco.
- Cadastro publico nao existe nesta fase; usuarios entram via convite ou criacao por admin nas proximas partes.

## Fluxo

```txt
Usuario informa email/senha
  -> POST /api/auth/login
  -> valida payload
  -> supabase.auth.signInWithPassword
  -> Supabase SSR grava cookies
  -> frontend redireciona para /dashboard
  -> proxy valida sessao em rotas privadas
  -> APIs validam sessao novamente
  -> RLS valida acesso aos dados
```

## Arquivos criados

```txt
modules/auth/auth.types.ts
modules/auth/auth.validators.ts
modules/auth/auth.service.ts
app/api/auth/login/route.ts
app/api/auth/session/route.ts
```

## Arquivos alterados

```txt
app/auth/login/page.tsx
app/api/auth/logout/route.ts
proxy.ts
```

## API de login

Endpoint:

```txt
POST /api/auth/login
```

Payload:

```json
{
  "email": "usuario@empresa.com",
  "password": "senha_segura"
}
```

Resposta:

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "usuario@empresa.com"
    }
  },
  "error": null
}
```

## API de sessao

Endpoint:

```txt
GET /api/auth/session
```

Uso:

- conferir usuario logado;
- alimentar estado global no frontend;
- validar autenticacao em telas client-side quando necessario.

## API de logout

Endpoint:

```txt
POST /api/auth/logout
```

Comportamento:

- encerra sessao Supabase;
- remove cookie legado `erp_super_admin`;
- retorna sucesso padronizado.

## Protecao de rotas

Rotas protegidas atuais:

```ts
const protectedRoutes = ["/dashboard", "/companies", "/finance", "/taxes"];
```

Regra:

- sem sessao valida: redireciona para `/auth/login`;
- com sessao valida e tentando abrir `/auth/login`: redireciona para `/dashboard`.

## Criacao de usuarios

Nesta Parte 3, nao existe cadastro publico.

Fluxo correto para producao:

1. Admin convida usuario.
2. Sistema gera token unico e hash.
3. Usuario aceita convite.
4. Backend cria usuario via Supabase Auth.
5. Backend cria vinculo em `usuarios_empresas`.
6. Backend registra auditoria.

Esse fluxo sera implementado nas partes de usuarios/convites.

## Alertas de seguranca

- Nunca criar usuario novo diretamente pelo frontend.
- Nunca aceitar `empresa_id` do frontend sem validar vinculo.
- Nunca usar service role key no browser.
- Nunca usar cookie de super admin como mecanismo de producao.
- Login por email/senha deve ter rate limit antes de producao.
- Recomenda-se MFA para administradores.
- RLS deve continuar obrigatoria para todas as tabelas.

## Variaveis obrigatorias

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Para bootstrap local antigo, ainda pode existir:

```env
SUPER_ADMIN_USERNAME=
SUPER_ADMIN_PASSWORD=
```

Mas o fluxo principal da Parte 3 usa Supabase Auth.
