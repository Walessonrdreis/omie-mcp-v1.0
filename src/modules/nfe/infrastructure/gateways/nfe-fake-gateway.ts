import {
  INfeGateway,
  ListarNFPageParams,
  ListarNFResponse,
  NotaFiscalOmie,
} from "../../domain/interfaces/nfe-gateway.js";

const NOTAS_FAKE: NotaFiscalOmie[] = [
  {
    compl: { cChaveNFe: "35240100000000000100550010000000011000000010", nIdNF: 1001, nIdPedido: 5001 },
    ide: { nNF: "000000001", serie: "1", dEmi: "01/07/2026", dCan: "", tpNF: "1", tpAmb: "1" },
    nfDestInt: { cRazao: "Cliente Fake Ltda", cnpj_cpf: "11.111.111/0001-11", nCodCli: 9001 },
    det: [
      {
        prod: {
          cProd: "PROD-001",
          xProd: "Ração 100kg",
          NCM: "2309.90.00",
          CFOP: "5.102",
          uCom: "UN",
          qCom: 10,
          vUnCom: 50,
          vProd: 500,
        },
      },
    ],
    titulos: [{ cNumTitulo: "000000001/1", dDtVenc: "31/07/2026", nValorTitulo: 500 }],
    total: { ICMSTot: { vNF: 500 } },
  },
  {
    compl: { cChaveNFe: "35240100000000000100550010000000022000000021", nIdNF: 1002, nIdPedido: 0 },
    ide: { nNF: "000000002", serie: "1", dEmi: "02/07/2026", dCan: "02/07/2026", tpNF: "1", tpAmb: "1" },
    nfDestInt: { cRazao: "Outro Cliente Fake", cnpj_cpf: "22.222.222/0001-22", nCodCli: 9002 },
    det: [
      {
        prod: {
          cProd: "PROD-002",
          xProd: "Produto Fake 2",
          NCM: "1234.00.00",
          CFOP: "5.102",
          uCom: "UN",
          qCom: 1,
          vUnCom: 100,
          vProd: 100,
        },
      },
    ],
    total: { ICMSTot: { vNF: 100 } },
  },
];

/**
 * Implementação em memória de `INfeGateway`, sem chamar a Omie real — usada
 * quando `OMIE_MOCK=true`, pra desenvolvimento/testes offline.
 */
export class NfeFakeGateway implements INfeGateway {
  constructor(private readonly notas: NotaFiscalOmie[] = NOTAS_FAKE.map((n) => ({ ...n }))) {}

  async listarNotasPagina(params: ListarNFPageParams): Promise<ListarNFResponse> {
    let notas = this.notas;
    if (params.filtrarPorStatus === "N") notas = notas.filter((n) => n.ide.dCan === "");
    if (params.filtrarPorStatus === "C") notas = notas.filter((n) => n.ide.dCan !== "");

    const inicio = (params.pagina - 1) * params.registrosPorPagina;
    const pagina = notas.slice(inicio, inicio + params.registrosPorPagina);
    const totalPaginas = Math.max(1, Math.ceil(notas.length / params.registrosPorPagina));

    return {
      pagina: params.pagina,
      total_de_paginas: totalPaginas,
      registros: pagina.length,
      total_de_registros: notas.length,
      nfCadastro: pagina,
    };
  }

  async consultarNotaPorChave(chave: string): Promise<NotaFiscalOmie> {
    const nota = this.notas.find((n) => n.compl.cChaveNFe === chave);
    if (!nota) throw new Error(`Nota fiscal com chave ${chave} não encontrada (fake).`);
    return nota;
  }

  async consultarNotaPorCodigo(nCodNF: number): Promise<NotaFiscalOmie> {
    const nota = this.notas.find((n) => n.compl.nIdNF === nCodNF);
    if (!nota) throw new Error(`Nota fiscal com código ${nCodNF} não encontrada (fake).`);
    return nota;
  }
}
