import {
  FiltroMovimentos,
  IFinancasGateway,
  MovimentoFinanceiro,
} from "../../domain/interfaces/financas-gateway.js";

const CONTA_1 = 9183200875;
const CONTA_2 = 9181761228;

const MOVIMENTOS_FAKE: MovimentoFinanceiro[] = [
  {
    detalhes: {
      cCodCateg: "1.01",
      cGrupo: "Vendas",
      cNatureza: "R",
      cStatus: "LIQUIDADO",
      cTipo: "VD",
      dDtEmissao: "01/12/2026",
      dDtPagamento: "03/12/2026",
      dDtPrevisao: "03/12/2026",
      dDtVenc: "03/12/2026",
      nCodCC: CONTA_1,
      nCodTitulo: 1,
      nValorTitulo: 150,
    },
    resumo: { cLiquidado: "S", nValAberto: 0, nValLiquido: 150, nValPago: 150 },
  },
  {
    detalhes: {
      cCodCateg: "1.01",
      cGrupo: "Vendas",
      cNatureza: "R",
      cStatus: "LIQUIDADO",
      cTipo: "VD",
      dDtEmissao: "04/12/2026",
      dDtPagamento: "05/12/2026",
      dDtPrevisao: "05/12/2026",
      dDtVenc: "05/12/2026",
      nCodCC: CONTA_1,
      nCodTitulo: 2,
      nValorTitulo: 300,
    },
    resumo: { cLiquidado: "S", nValAberto: 0, nValLiquido: 300, nValPago: 300 },
  },
  {
    detalhes: {
      cCodCateg: "2.01",
      cGrupo: "Compras",
      cNatureza: "P",
      cStatus: "LIQUIDADO",
      cTipo: "CP",
      dDtEmissao: "09/12/2026",
      dDtPagamento: "10/12/2026",
      dDtPrevisao: "10/12/2026",
      dDtVenc: "10/12/2026",
      nCodCC: CONTA_1,
      nCodTitulo: 3,
      nValorTitulo: 100,
    },
    resumo: { cLiquidado: "S", nValAberto: 0, nValLiquido: 100, nValPago: 100 },
  },
  {
    detalhes: {
      cCodCateg: "1.01",
      cGrupo: "Vendas",
      cNatureza: "R",
      cStatus: "ABERTO",
      cTipo: "VD",
      dDtEmissao: "15/12/2026",
      dDtPagamento: "",
      dDtPrevisao: "20/12/2026",
      dDtVenc: "20/12/2026",
      nCodCC: CONTA_2,
      nCodTitulo: 4,
      nValorTitulo: 200,
    },
    resumo: { cLiquidado: "N", nValAberto: 200, nValLiquido: 0, nValPago: 0 },
  },
  {
    detalhes: {
      cCodCateg: "2.01",
      cGrupo: "Compras",
      cNatureza: "P",
      cStatus: "CANCELADO",
      cTipo: "CP",
      dDtEmissao: "12/12/2026",
      dDtPagamento: "",
      dDtPrevisao: "15/12/2026",
      dDtVenc: "15/12/2026",
      nCodCC: CONTA_2,
      nCodTitulo: 5,
      nValorTitulo: 50,
    },
    resumo: { cLiquidado: "N", nValAberto: 50, nValLiquido: 0, nValPago: 0 },
  },
];

function parseDataBr(data: string): Date | null {
  const match = data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, dia, mes, ano] = match;
  return new Date(Number(ano), Number(mes) - 1, Number(dia));
}

/**
 * Implementação em memória de `IFinancasGateway`, sem chamar a Omie real —
 * usada quando `OMIE_MOCK=true`, pra desenvolvimento/testes offline. Filtra
 * de fato por campoData (pagamento/vencimento) e período, imitando o
 * comportamento real, pra exercitar a agregação do use-case.
 */
export class FinancasFakeGateway implements IFinancasGateway {
  constructor(private readonly movimentos: MovimentoFinanceiro[] = MOVIMENTOS_FAKE) {}

  async listarTodosMovimentos(filtro: FiltroMovimentos): Promise<MovimentoFinanceiro[]> {
    const dataDe = parseDataBr(filtro.dataDe);
    const dataAte = parseDataBr(filtro.dataAte);
    if (!dataDe || !dataAte) return [];

    return this.movimentos.filter((m) => {
      const campo = filtro.campoData === "pagamento" ? m.detalhes.dDtPagamento : m.detalhes.dDtVenc;
      const data = parseDataBr(campo);
      if (!data) return false;
      return data.getTime() >= dataDe.getTime() && data.getTime() <= dataAte.getTime();
    });
  }
}
