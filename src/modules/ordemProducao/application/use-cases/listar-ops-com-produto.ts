import { IProdutosGateway } from "../../../produtos/domain/interfaces/produtos-gateway.js";
import { IOrdemProducaoGateway } from "../../domain/interfaces/op-gateway.js";
import {
  ListarOpsComProdutoParam,
  ListarOpsComProdutoResult,
  OrdemProducaoComProduto,
} from "../dto/listar-ops-com-produto.dto.js";

/**
 * A Omie não entrega a lista de OPs pronta pra leitura: `ListarOrdemProducao`
 * só devolve `nCodProduto` (sem descrição/SKU) e `cEtapa` como código cru —
 * pra saber "OP de qual produto, em que fase" seria preciso consultar cada
 * produto à parte. Esse use-case busca a página de OPs e enriquece com a
 * descrição/SKU de cada produto envolvido (reaproveitando o
 * `ProdutosOmieGateway` do módulo `produtos`), num único resultado.
 */
export class ListarOpsComProdutoUseCase {
  constructor(
    private readonly opGateway: IOrdemProducaoGateway,
    private readonly produtosGateway: IProdutosGateway
  ) {}

  async execute(param: ListarOpsComProdutoParam): Promise<ListarOpsComProdutoResult> {
    const pagina = param.pagina ?? 1;
    const registrosPorPagina = param.registros_por_pagina ?? 20;

    const opsResposta = await this.opGateway.listarOrdensPagina(pagina, registrosPorPagina);
    const codigosProduto = opsResposta.cadastros.map((op) => op.identificacao.nCodProduto);
    const produtosPorCodigo = await this.produtosGateway.consultarProdutosPorCodigo(codigosProduto);

    let itens: OrdemProducaoComProduto[] = opsResposta.cadastros.map((op) => {
      const produto = produtosPorCodigo.get(op.identificacao.nCodProduto);
      return {
        numeroOP: op.identificacao.cNumOP,
        codigoOP: op.identificacao.nCodOP,
        codigoProduto: op.identificacao.nCodProduto,
        codigoSku: produto?.codigo ?? "",
        descricaoProduto: produto?.descricao ?? "(produto não encontrado)",
        quantidade: op.identificacao.nQtde,
        dataPrevisao: op.identificacao.dDtPrevisao,
        dataInicio: op.infAdicionais.dDtInicio,
        dataConclusao: op.infAdicionais.dDtConclusao,
        concluida: op.outrasInf.cConcluida === "S",
        etapaCodigo: op.infAdicionais.cEtapa,
      };
    });

    if (param.apenas_nao_concluidas) {
      itens = itens.filter((item) => !item.concluida);
    }

    return {
      pagina: opsResposta.pagina,
      totalPaginas: opsResposta.total_de_paginas,
      totalRegistros: opsResposta.total_de_registros,
      itens,
    };
  }
}
