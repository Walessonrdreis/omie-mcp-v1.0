import { OmieClient } from "../../../../omieClient.js";

/**
 * Um lançamento financeiro (conta a pagar ou a receber) conforme devolvido
 * pela Omie em `financas/mf` / `ListarMovimentos`. Nem todo campo aparece em
 * todo lançamento (varia por tipo de origem: venda, compra, boleto, etc.),
 * por isso os campos menos essenciais ficam opcionais.
 */
export interface MovimentoFinanceiro {
  detalhes: {
    cCodCateg: string;
    cGrupo: string;
    /** "P" = Contas a Pagar, "R" = Contas a Receber. */
    cNatureza: "P" | "R";
    cStatus: string;
    cTipo: string;
    dDtEmissao: string;
    dDtPagamento: string;
    dDtPrevisao: string;
    dDtVenc: string;
    nCodCC: number;
    nCodTitulo: number;
    nValorTitulo: number;
  };
  resumo: {
    cLiquidado: "S" | "N";
    nValAberto: number;
    nValLiquido: number;
    nValPago: number;
  };
}

interface ListarMovimentosResponse {
  nPagina: number;
  nTotPaginas: number;
  nRegistros: number;
  nTotRegistros: number;
  movimentos: MovimentoFinanceiro[];
}

export interface FiltroMovimentos {
  /** "pagamento" filtra por dDtPagamento (realizado); "vencimento" filtra por dDtVenc (previsto). */
  campoData: "pagamento" | "vencimento";
  dataDe: string;
  dataAte: string;
}

const REGISTROS_POR_PAGINA = 100;

/**
 * Encapsula o acesso aos lançamentos financeiros da Omie (contas a pagar e a
 * receber). A Omie não tem endpoint de "fluxo de caixa" pronto — só devolve
 * lançamento por lançamento, paginado (teto de 100/página independente do
 * que se peça) — por isso este gateway só busca os dados brutos; a
 * agregação por dia/mês/conta fica no use-case (`fluxoCaixa`).
 */
export class FinancasOmieGateway {
  constructor(private readonly client: OmieClient) {}

  private async listarMovimentosPagina(
    pagina: number,
    filtro: FiltroMovimentos
  ): Promise<ListarMovimentosResponse> {
    const param: Record<string, unknown> = {
      nPagina: pagina,
      nRegPorPagina: REGISTROS_POR_PAGINA,
    };
    if (filtro.campoData === "pagamento") {
      param.dDtPagtoDe = filtro.dataDe;
      param.dDtPagtoAte = filtro.dataAte;
    } else {
      param.dDtVencDe = filtro.dataDe;
      param.dDtVencAte = filtro.dataAte;
    }

    return this.client.call<ListarMovimentosResponse>({
      resource: "financas/mf",
      call: "ListarMovimentos",
      param,
    });
  }

  /** Varre todas as páginas de lançamentos que casam com o filtro (pode ser lento em períodos longos). */
  async listarTodosMovimentos(filtro: FiltroMovimentos): Promise<MovimentoFinanceiro[]> {
    const movimentos: MovimentoFinanceiro[] = [];
    let pagina = 1;
    let totalPaginas = 1;

    do {
      const resposta = await this.listarMovimentosPagina(pagina, filtro);
      totalPaginas = resposta.nTotPaginas;
      movimentos.push(...resposta.movimentos);
      pagina++;
    } while (pagina <= totalPaginas);

    return movimentos;
  }
}
