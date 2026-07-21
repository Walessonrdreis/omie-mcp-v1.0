import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import {
  FiltroMovimentos,
  IFinancasGateway,
  MovimentoFinanceiro,
} from "../../domain/interfaces/financas-gateway.js";

export {
  MovimentoFinanceiro,
  FiltroMovimentos,
} from "../../domain/interfaces/financas-gateway.js";

interface ListarMovimentosResponse {
  nPagina: number;
  nTotPaginas: number;
  nRegistros: number;
  nTotRegistros: number;
  movimentos: MovimentoFinanceiro[];
}

const REGISTROS_POR_PAGINA = 100;

/**
 * Encapsula o acesso aos lançamentos financeiros da Omie (contas a pagar e a
 * receber). A Omie não tem endpoint de "fluxo de caixa" pronto — só devolve
 * lançamento por lançamento, paginado (teto de 100/página independente do
 * que se peça) — por isso este gateway só busca os dados brutos; a
 * agregação por dia/mês/conta fica no use-case (`fluxoCaixa`).
 */
export class FinancasOmieGateway implements IFinancasGateway {
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
