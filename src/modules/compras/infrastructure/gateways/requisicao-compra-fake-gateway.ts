import {
  IRequisicaoCompraGateway,
  ListarRequisicoesCompraPageParams,
  ListarRequisicoesCompraResponse,
  RequisicaoCompraOmie,
  RequisicaoCompraParaAlterar,
  RequisicaoCompraParaIncluir,
  StatusRequisicaoCompra,
} from "../../domain/interfaces/requisicao-compra-gateway.js";

/**
 * Implementação em memória de `IRequisicaoCompraGateway`, sem chamar a Omie
 * real — usada quando `OMIE_MOCK=true`, pra desenvolvimento/testes offline.
 */
export class RequisicaoCompraFakeGateway implements IRequisicaoCompraGateway {
  private proximoCodigo = 7000;
  private readonly requisicoes = new Map<number, RequisicaoCompraOmie>();

  async incluirRequisicao(dados: RequisicaoCompraParaIncluir): Promise<StatusRequisicaoCompra> {
    const codigoRequisicao = this.proximoCodigo++;

    this.requisicoes.set(codigoRequisicao, {
      codReqCompra: codigoRequisicao,
      codIntReqCompra: dados.codIntReqCompra,
      codCateg: dados.codigoCategoria,
      dtSugestao: dados.dataSugestao,
      ItensReqCompra: dados.itens.map((item) => ({
        codIntItem: item.codIntItem,
        codProd: item.codProduto,
        qtde: item.quantidade,
        precoUnit: item.precoUnitario ?? 0,
      })),
    });

    return {
      codigoRequisicao,
      codIntReqCompra: dados.codIntReqCompra,
      codigoStatus: "0",
      descricaoStatus: "Requisição de Compras cadastrada com sucesso! (fake)",
    };
  }

  private encontrarRequisicao(codigoRequisicao: number): RequisicaoCompraOmie {
    const requisicao = this.requisicoes.get(codigoRequisicao);
    if (!requisicao) {
      throw new Error(`Requisição de compra ${codigoRequisicao} não encontrada (fake).`);
    }
    return requisicao;
  }

  async alterarRequisicao(dados: RequisicaoCompraParaAlterar): Promise<StatusRequisicaoCompra> {
    const requisicao = this.encontrarRequisicao(dados.codigoRequisicao);

    if (dados.codigoCategoria !== undefined) requisicao.codCateg = dados.codigoCategoria;
    if (dados.dataSugestao !== undefined) requisicao.dtSugestao = dados.dataSugestao;
    if (dados.itens) {
      requisicao.ItensReqCompra = dados.itens.map((item) => ({
        codIntItem: item.codIntItem,
        codProd: item.codProduto,
        qtde: item.quantidade,
        precoUnit: item.precoUnitario ?? 0,
      }));
    }

    return {
      codigoRequisicao: requisicao.codReqCompra,
      codIntReqCompra: requisicao.codIntReqCompra,
      codigoStatus: "0",
      descricaoStatus: "Requisição de Compras alterada com sucesso! (fake)",
    };
  }

  async excluirRequisicao(codigoRequisicao: number): Promise<StatusRequisicaoCompra> {
    const requisicao = this.encontrarRequisicao(codigoRequisicao);
    this.requisicoes.delete(codigoRequisicao);

    return {
      codigoRequisicao: requisicao.codReqCompra,
      codIntReqCompra: requisicao.codIntReqCompra,
      codigoStatus: "0",
      descricaoStatus: "Requisição de Compras excluída com sucesso! (fake)",
    };
  }

  async consultarRequisicao(codigoRequisicao: number): Promise<RequisicaoCompraOmie> {
    return this.encontrarRequisicao(codigoRequisicao);
  }

  async listarRequisicoesPagina(
    params: ListarRequisicoesCompraPageParams
  ): Promise<ListarRequisicoesCompraResponse> {
    const todas = Array.from(this.requisicoes.values());
    const inicio = (params.pagina - 1) * params.registrosPorPagina;
    const pagina = todas.slice(inicio, inicio + params.registrosPorPagina);

    return {
      total_de_paginas: Math.max(1, Math.ceil(todas.length / params.registrosPorPagina)),
      total_de_registros: todas.length,
      requisicaoCadastro: pagina,
    };
  }
}
