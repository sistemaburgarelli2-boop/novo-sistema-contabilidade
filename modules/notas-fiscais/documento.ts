/**
 * Geracao dos documentos de uma nota ja gravada: XML e DANFSe (espelho para
 * impressao). Sao gerados a partir dos dados do banco — quando a nota veio da
 * SEFAZ com xml_url, o arquivo oficial tem precedencia e este modulo nem e
 * chamado.
 */

export type NotaDocumento = {
  id: string;
  numero: string;
  serie: string | null;
  modelo: string;
  tipo: string;
  status: string;
  situacao: string;
  chave_acesso: string | null;
  natureza_operacao: string | null;
  data_emissao: string;
  emitente_nome: string | null;
  emitente_cnpj: string | null;
  destinatario_nome: string | null;
  destinatario_cnpj: string | null;
  valor_total: number;
  valor_produtos: number;
  valor_servicos: number;
  valor_desconto: number;
  valor_frete: number;
  valor_icms: number;
  valor_ipi: number;
  valor_pis: number;
  valor_cofins: number;
  valor_iss: number;
};

const MODELO_NOME: Record<string, string> = {
  nfse: "NFS-e — Nota Fiscal de Servicos Eletronica",
  "55": "NF-e — Nota Fiscal Eletronica",
  "65": "NFC-e — Nota Fiscal de Consumidor Eletronica",
};

function esc(valor: unknown) {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function moeda(valor: number) {
  return Number(valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function numero(valor: number) {
  return Number(valor || 0).toFixed(2);
}

function data(valor: string) {
  const d = new Date(valor);
  return Number.isNaN(d.getTime()) ? "-" : d.toLocaleDateString("pt-BR");
}

function documento(valor: string | null) {
  const digitos = (valor ?? "").replace(/\D/g, "");
  if (digitos.length === 14) {
    return digitos.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  }
  if (digitos.length === 11) {
    return digitos.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  }
  return valor ?? "-";
}

export function nomeArquivo(nota: NotaDocumento, extensao: string) {
  const base = nota.chave_acesso?.trim() || `${nota.modelo}-${nota.numero}`;
  return `${base.replace(/[^\w-]/g, "")}.${extensao}`;
}

export function gerarXmlNota(nota: NotaDocumento) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<NotaFiscal geradoPor="Sistema Contabilidade" oficial="false">
  <InfNota Id="${esc(nota.chave_acesso ?? nota.id)}">
    <Identificacao>
      <Numero>${esc(nota.numero)}</Numero>
      <Serie>${esc(nota.serie ?? "")}</Serie>
      <Modelo>${esc(nota.modelo)}</Modelo>
      <Tipo>${esc(nota.tipo)}</Tipo>
      <Status>${esc(nota.status)}</Status>
      <ChaveAcesso>${esc(nota.chave_acesso ?? "")}</ChaveAcesso>
      <NaturezaOperacao>${esc(nota.natureza_operacao ?? "")}</NaturezaOperacao>
      <DataEmissao>${esc(nota.data_emissao)}</DataEmissao>
    </Identificacao>
    <Emitente>
      <Nome>${esc(nota.emitente_nome ?? "")}</Nome>
      <CnpjCpf>${esc((nota.emitente_cnpj ?? "").replace(/\D/g, ""))}</CnpjCpf>
    </Emitente>
    <Destinatario>
      <Nome>${esc(nota.destinatario_nome ?? "")}</Nome>
      <CnpjCpf>${esc((nota.destinatario_cnpj ?? "").replace(/\D/g, ""))}</CnpjCpf>
    </Destinatario>
    <Valores>
      <Total>${numero(nota.valor_total)}</Total>
      <Produtos>${numero(nota.valor_produtos)}</Produtos>
      <Servicos>${numero(nota.valor_servicos)}</Servicos>
      <Desconto>${numero(nota.valor_desconto)}</Desconto>
      <Frete>${numero(nota.valor_frete)}</Frete>
    </Valores>
    <Impostos>
      <ICMS>${numero(nota.valor_icms)}</ICMS>
      <IPI>${numero(nota.valor_ipi)}</IPI>
      <PIS>${numero(nota.valor_pis)}</PIS>
      <COFINS>${numero(nota.valor_cofins)}</COFINS>
      <ISS>${numero(nota.valor_iss)}</ISS>
    </Impostos>
  </InfNota>
</NotaFiscal>
`;
}

export function gerarDanfseHtml(nota: NotaDocumento, opcoes: { imprimir?: boolean } = {}) {
  const linhaImposto = (rotulo: string, valor: number) =>
    valor > 0 ? `<tr><td>${esc(rotulo)}</td><td class="dir">${moeda(valor)}</td></tr>` : "";

  const impostos = [
    linhaImposto("ISS", nota.valor_iss),
    linhaImposto("ICMS", nota.valor_icms),
    linhaImposto("IPI", nota.valor_ipi),
    linhaImposto("PIS", nota.valor_pis),
    linhaImposto("COFINS", nota.valor_cofins),
  ].join("");

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>DANFSe ${esc(nota.numero)}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 24px; background: #eef0f4; font-family: Arial, Helvetica, sans-serif; color: #222; }
  .folha { max-width: 820px; margin: 0 auto; background: #fff; padding: 32px; border: 1px solid #d5d8de; }
  .topo { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; border-bottom: 2px solid #37418c; padding-bottom: 14px; margin-bottom: 18px; }
  .titulo { font-size: 17px; font-weight: bold; color: #37418c; margin: 0 0 4px; }
  .sub { font-size: 12px; color: #666; }
  .num { text-align: right; font-size: 12px; color: #444; }
  .num strong { display: block; font-size: 20px; color: #222; }
  h2 { font-size: 12px; text-transform: uppercase; letter-spacing: .5px; color: #6f9a72; margin: 20px 0 8px; border-bottom: 1px solid #e2e5ea; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  td { padding: 5px 0; vertical-align: top; }
  td.rotulo { color: #666; width: 190px; }
  td.dir { text-align: right; }
  .total { margin-top: 14px; padding-top: 12px; border-top: 2px solid #37418c; display: flex; justify-content: space-between; font-size: 17px; font-weight: bold; }
  .total span:last-child { color: #37418c; }
  .chave { margin-top: 18px; padding: 10px; background: #f5f6f8; border: 1px solid #e2e5ea; font-size: 11px; word-break: break-all; color: #555; }
  .aviso { margin-top: 14px; font-size: 11px; color: #8a6d1f; background: #fffbeb; border: 1px solid #fcd34d; padding: 8px 10px; }
  .acoes { max-width: 820px; margin: 0 auto 14px; text-align: right; }
  .acoes button { padding: 8px 16px; background: #37418c; color: #fff; border: none; border-radius: 3px; font-size: 13px; cursor: pointer; }
  @media print { body { background: #fff; padding: 0; } .folha { border: none; padding: 0; max-width: none; } .acoes { display: none; } }
</style>
</head>
<body>
  <div class="acoes"><button onclick="window.print()" type="button">Imprimir / Salvar em PDF</button></div>
  <div class="folha">
    <div class="topo">
      <div>
        <p class="titulo">DANFSe — Documento Auxiliar</p>
        <div class="sub">${esc(MODELO_NOME[nota.modelo] ?? nota.modelo)}</div>
      </div>
      <div class="num">
        Numero<strong>${esc(nota.numero)}</strong>
        ${nota.serie ? `Serie ${esc(nota.serie)}<br>` : ""}
        Emissao ${esc(data(nota.data_emissao))}
      </div>
    </div>

    <h2>Prestador / Emitente</h2>
    <table>
      <tr><td class="rotulo">Nome / Razao social</td><td>${esc(nota.emitente_nome ?? "-")}</td></tr>
      <tr><td class="rotulo">CNPJ / CPF</td><td>${esc(documento(nota.emitente_cnpj))}</td></tr>
    </table>

    <h2>Tomador / Destinatario</h2>
    <table>
      <tr><td class="rotulo">Nome / Razao social</td><td>${esc(nota.destinatario_nome ?? "-")}</td></tr>
      <tr><td class="rotulo">CNPJ / CPF</td><td>${esc(documento(nota.destinatario_cnpj))}</td></tr>
    </table>

    <h2>Discriminacao</h2>
    <table>
      <tr><td class="rotulo">Natureza da operacao</td><td>${esc(nota.natureza_operacao ?? "-")}</td></tr>
      <tr><td class="rotulo">Status</td><td>${esc(nota.status)}</td></tr>
      <tr><td class="rotulo">Situacao</td><td>${esc(nota.situacao)}</td></tr>
    </table>

    <h2>Valores</h2>
    <table>
      ${nota.valor_servicos > 0 ? `<tr><td>Servicos</td><td class="dir">${moeda(nota.valor_servicos)}</td></tr>` : ""}
      ${nota.valor_produtos > 0 ? `<tr><td>Produtos</td><td class="dir">${moeda(nota.valor_produtos)}</td></tr>` : ""}
      ${nota.valor_desconto > 0 ? `<tr><td>Desconto</td><td class="dir">${moeda(nota.valor_desconto)}</td></tr>` : ""}
      ${nota.valor_frete > 0 ? `<tr><td>Frete</td><td class="dir">${moeda(nota.valor_frete)}</td></tr>` : ""}
      ${impostos}
    </table>

    <div class="total"><span>Valor total</span><span>${moeda(nota.valor_total)}</span></div>

    ${nota.chave_acesso ? `<div class="chave"><strong>Chave de acesso:</strong> ${esc(nota.chave_acesso)}</div>` : ""}
    <div class="aviso">Documento auxiliar gerado pelo sistema a partir dos dados da nota. Nao substitui o DANFSe oficial emitido pelo portal da prefeitura ou pela NFS-e Nacional.</div>
  </div>
  ${opcoes.imprimir ? "<script>window.addEventListener('load', function () { window.print(); });</script>" : ""}
</body>
</html>
`;
}
