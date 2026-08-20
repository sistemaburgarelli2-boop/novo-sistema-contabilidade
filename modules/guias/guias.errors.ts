/**
 * Erros do Postgres chegam ao usuario como texto cru ("violates check
 * constraint..."), que nao diz o que fazer. Aqui viram instrucao.
 */
export function traduzirErroGuia(mensagem: string) {
  if (/guias_status_check/i.test(mensagem)) {
    return "O banco ainda nao aceita este status. Aplique a migracao 20260820000000_guias_fluxo.sql no Supabase.";
  }

  if (/pago_em/i.test(mensagem)) {
    return "Coluna pago_em ausente. Aplique a migracao 20260820000000_guias_fluxo.sql no Supabase.";
  }

  if (/row-level security/i.test(mensagem)) {
    return "Sem permissao no banco para gravar a guia. Configure a SUPABASE_SERVICE_ROLE_KEY ou revise a policy guias_acesso.";
  }

  return mensagem;
}
