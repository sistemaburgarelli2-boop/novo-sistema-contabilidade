import { describe, expect, it } from "vitest";
import {
  gerarDanfseHtml,
  gerarXmlNota,
  nomeArquivo,
  type NotaDocumento,
} from "@/modules/notas-fiscais/documento";

const nota: NotaDocumento = {
  id: "11111111-1111-1111-1111-111111111111",
  numero: "000123",
  serie: "1",
  modelo: "nfse",
  tipo: "emitida",
  status: "autorizada",
  situacao: "pendente",
  chave_acesso: "35240612345678000199550010000001231000000123",
  natureza_operacao: "Prestação de serviços",
  data_emissao: "2026-08-16T12:00:00.000Z",
  emitente_nome: "Burgarelli Contabilidade Ltda",
  emitente_cnpj: "12345678000199",
  destinatario_nome: "Cliente & Cia",
  destinatario_cnpj: "98765432000188",
  valor_total: 1500,
  valor_produtos: 0,
  valor_servicos: 1500,
  valor_desconto: 0,
  valor_frete: 0,
  valor_icms: 0,
  valor_ipi: 0,
  valor_pis: 9.75,
  valor_cofins: 45,
  valor_iss: 75,
};

describe("gerarXmlNota", () => {
  it("gera XML com identificacao, partes e valores", () => {
    const xml = gerarXmlNota(nota);
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain("<Numero>000123</Numero>");
    expect(xml).toContain("<CnpjCpf>12345678000199</CnpjCpf>");
    expect(xml).toContain("<Total>1500.00</Total>");
    expect(xml).toContain("<ISS>75.00</ISS>");
  });

  it("escapa caracteres que quebrariam o XML", () => {
    const xml = gerarXmlNota(nota);
    expect(xml).toContain("Cliente &amp; Cia");
    expect(xml).not.toContain("Cliente & Cia");
  });

  it("usa a chave de acesso como nome do arquivo", () => {
    expect(nomeArquivo(nota, "xml")).toBe(`${nota.chave_acesso}.xml`);
    expect(nomeArquivo({ ...nota, chave_acesso: null }, "xml")).toBe("nfse-000123.xml");
  });
});

describe("gerarDanfseHtml", () => {
  it("monta o espelho com partes, total e chave", () => {
    const html = gerarDanfseHtml(nota);
    expect(html).toContain("DANFSe");
    expect(html).toContain("Burgarelli Contabilidade Ltda");
    expect(html).toContain("12.345.678/0001-99");
    expect(html).toContain("98.765.432/0001-88");
    expect(html).toContain(nota.chave_acesso as string);
  });

  it("omite impostos zerados", () => {
    const html = gerarDanfseHtml(nota);
    expect(html).toContain(">ISS<");
    expect(html).not.toContain(">ICMS<");
  });

  it("so injeta o script de impressao quando pedido", () => {
    expect(gerarDanfseHtml(nota)).not.toContain("window.print();");
    expect(gerarDanfseHtml(nota, { imprimir: true })).toContain("window.print();");
  });
});
