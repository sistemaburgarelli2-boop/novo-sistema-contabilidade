import { fail, ok } from "@/lib/apiResponse";
import { createSupabaseServerClient } from "@/lib/supabaseServer";

export async function POST(request: Request, { params }: { params: Promise<{ empresaId: string }> }) {
  try {
    const { empresaId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return fail("Nao autenticado.", 401);

    const { notaId, emailDestinatario, assunto, mensagem } = await request.json();

    if (!notaId) return fail("ID da nota é obrigatório.", 400);
    if (!emailDestinatario) return fail("E-mail do destinatário é obrigatório.", 400);

    // Buscar a nota
    const { data: nota, error: notaErr } = await supabase
      .from("notas_fiscais")
      .select("*")
      .eq("id", notaId)
      .eq("empresa_id", empresaId)
      .single();

    if (notaErr || !nota) return fail("Nota fiscal não encontrada.", 404);

    // Buscar dados da empresa
    const { data: empresa } = await supabase
      .from("empresas")
      .select("nome_legal, cnpj, metadata")
      .eq("id", empresaId)
      .single();

    const nomeEmpresa = empresa?.nome_legal || "Empresa";

    // Montar o e-mail via Supabase Edge Function ou serviço externo
    // Por enquanto, usamos o Supabase Auth para enviar (ou Resend/SendGrid se configurado)
    const valorFormatado = Number(nota.valor_total).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
    const dataFormatada = new Date(nota.data_emissao).toLocaleDateString("pt-BR");

    const htmlEmail = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #065f46, #10b981); padding: 24px; border-radius: 12px 12px 0 0; color: #fff;">
          <h1 style="margin: 0; font-size: 20px;">${nomeEmpresa}</h1>
          <p style="margin: 4px 0 0; opacity: 0.8; font-size: 14px;">Nota Fiscal Eletrônica</p>
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 24px; border-radius: 0 0 12px 12px;">
          <p style="font-size: 15px; color: #374151;">Olá <strong>${nota.destinatario_nome || "Cliente"}</strong>,</p>
          <p style="font-size: 14px; color: #6b7280;">${mensagem || "Segue sua nota fiscal conforme serviço prestado."}</p>

          <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
              <tr><td style="padding: 6px 0; color: #6b7280;">Número</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${nota.numero}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280;">Data de emissão</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${dataFormatada}</td></tr>
              <tr><td style="padding: 6px 0; color: #6b7280;">Natureza</td><td style="padding: 6px 0; text-align: right; font-weight: 600;">${nota.natureza_operacao || "—"}</td></tr>
              <tr style="border-top: 2px solid #e5e7eb;"><td style="padding: 10px 0; color: #374151; font-weight: 700; font-size: 16px;">Valor total</td><td style="padding: 10px 0; text-align: right; font-weight: 800; font-size: 16px; color: #065f46;">${valorFormatado}</td></tr>
            </table>
          </div>

          ${nota.chave_acesso ? `<p style="font-size: 12px; color: #9ca3af; word-break: break-all;">Chave de acesso: ${nota.chave_acesso}</p>` : ""}

          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />
          <p style="font-size: 12px; color: #9ca3af; margin: 0;">
            Este e-mail foi enviado automaticamente pelo sistema Burgarelli C.O.<br />
            Em caso de dúvidas, entre em contato com ${nomeEmpresa}.
          </p>
        </div>
      </div>
    `;

    // Tentar enviar via Resend (se RESEND_API_KEY estiver configurada)
    const resendKey = process.env.RESEND_API_KEY;

    if (resendKey) {
      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || `${nomeEmpresa} <noreply@burgarelli.com.br>`,
          to: [emailDestinatario],
          subject: assunto || `Nota Fiscal nº ${nota.numero} — ${nomeEmpresa}`,
          html: htmlEmail,
        }),
      });

      if (!emailRes.ok) {
        const errText = await emailRes.text();
        return fail(`Erro ao enviar e-mail: ${errText}`, 500);
      }

      return ok({ enviado: true, para: emailDestinatario, servico: "resend" });
    }

    // Fallback: salvar como pendente para envio manual
    return ok({
      enviado: false,
      para: emailDestinatario,
      html: htmlEmail,
      mensagem: "E-mail preparado. Configure RESEND_API_KEY para envio automático.",
    });
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro", 500);
  }
}
