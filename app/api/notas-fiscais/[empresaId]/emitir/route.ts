import { fail, ok } from "@/lib/apiResponse";
import { createSupabaseServerClient } from "@/lib/supabaseServer";
import { emitirNFSe } from "@/modules/notas-fiscais/nfse-nacional.service";
import type { EmissaoNFSePayload } from "@/modules/notas-fiscais/nfse-nacional.types";

export async function POST(request: Request, { params }: { params: Promise<{ empresaId: string }> }) {
  try {
    const { empresaId } = await params;
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();
    if (authErr || !user) return fail("Nao autenticado.", 401);

    const body = await request.json();
    const {
      token, ambiente, prestador, tomador, servicos,
      competencia, natureza_operacao, observacoes,
    } = body;

    if (!token) return fail("Token de acesso gov.br é obrigatório.", 400);
    if (!prestador?.cnpj) return fail("CNPJ do prestador é obrigatório.", 400);
    if (!tomador?.cnpjCpf || !tomador?.nomeRazaoSocial) return fail("Dados do tomador são obrigatórios.", 400);
    if (!servicos?.length) return fail("Pelo menos um serviço é obrigatório.", 400);

    const payload: EmissaoNFSePayload = {
      ambiente: ambiente || "homologacao",
      token,
      prestador: {
        cnpj: prestador.cnpj,
        nomeRazaoSocial: prestador.nomeRazaoSocial,
        inscricaoMunicipal: prestador.inscricaoMunicipal || undefined,
        codigoMunicipio: prestador.codigoMunicipio || "3550308",
        uf: prestador.uf || "SP",
      },
      tomador: {
        cnpjCpf: tomador.cnpjCpf,
        nomeRazaoSocial: tomador.nomeRazaoSocial,
        email: tomador.email || undefined,
        telefone: tomador.telefone || undefined,
        endereco: tomador.endereco || undefined,
        cidade: tomador.cidade || undefined,
        uf: tomador.uf || undefined,
      },
      servicos: servicos.map((s: { codigoServico?: string; descricao?: string; quantidade?: number; valorUnitario?: number; valorTotal?: number; aliquotaISS?: number }) => ({
        codigoServico: s.codigoServico || "",
        descricao: s.descricao || "",
        quantidade: s.quantidade || 1,
        valorUnitario: s.valorUnitario || 0,
        valorTotal: s.valorTotal || (s.quantidade || 1) * (s.valorUnitario || 0),
        aliquotaISS: s.aliquotaISS || 5,
      })),
      competencia: competencia || new Date().toISOString().slice(0, 7),
      naturezaOperacao: natureza_operacao || "Prestação de serviços",
      observacoes: observacoes || undefined,
    };

    // Emitir via API Nacional
    const resultado = await emitirNFSe(payload);

    if (!resultado.sucesso) {
      return fail(
        `Erro na emissão: ${resultado.erros?.join(", ") || resultado.mensagem || "Erro desconhecido"}`,
        422,
      );
    }

    // Salvar no banco
    const valorServicos = payload.servicos.reduce((s, sv) => s + sv.valorTotal, 0);
    const valorISS = payload.servicos.reduce((s, sv) => s + (sv.valorTotal * sv.aliquotaISS / 100), 0);

    const { data, error } = await supabase.from("notas_fiscais").insert({
      empresa_id: empresaId,
      tipo: "emitida",
      numero: resultado.numero || "",
      serie: null,
      modelo: "nfse",
      chave_acesso: resultado.chaveAcesso || "",
      natureza_operacao: payload.naturezaOperacao,
      data_emissao: resultado.dataEmissao || new Date().toISOString(),
      emitente_cnpj: payload.prestador.cnpj,
      emitente_nome: payload.prestador.nomeRazaoSocial,
      destinatario_cnpj: payload.tomador.cnpjCpf,
      destinatario_nome: payload.tomador.nomeRazaoSocial,
      valor_total: valorServicos,
      valor_produtos: 0,
      valor_servicos: valorServicos,
      valor_desconto: 0,
      valor_frete: 0,
      valor_icms: 0,
      valor_ipi: 0,
      valor_pis: 0,
      valor_cofins: 0,
      valor_iss: valorISS,
      status: "autorizada",
      situacao: "pendente",
    }).select("*").single();

    if (error) return fail(error.message, 500);

    return ok({
      nota: data,
      nfse: {
        chaveAcesso: resultado.chaveAcesso,
        numero: resultado.numero,
        protocolo: resultado.protocolo,
        mensagem: resultado.mensagem,
      },
    }, 201);
  } catch (e) {
    return fail(e instanceof Error ? e.message : "Erro", 500);
  }
}
