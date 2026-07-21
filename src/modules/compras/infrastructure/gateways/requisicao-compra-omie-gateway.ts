import { OmieApiError, OmieClient } from "../../../../integrations/omie/omieClient.js";
import {
  IRequisicaoCompraGateway,
  ItemRequisicaoCompra,
  ListarRequisicoesCompraPageParams,
  ListarRequisicoesCompraResponse,
  RequisicaoCompraOmie,
  RequisicaoCompraParaAlterar,
  RequisicaoCompraParaIncluir,
  StatusRequisicaoCompra,
} from "../../domain/interfaces/requisicao-compra-gateway.js";

function mapearItem(item: ItemRequisicaoCompra) {
  return {
    codIntItem: item.codIntItem,
    codProd: item.codProduto,
    qtde: item.quantidade,
    ...(item.precoUnitario !== undefined ? { precoUnit: item.precoUnitario } : {}),
  };
}

/**
 * Encapsula o acesso a Requisição de Compra da Omie
 * (`produtos/requisicaocompra`). Testado ao vivo: campos vão direto na raiz
 * do `param`, sem wrapper `requisicaoCadastro` (ver nota na interface).
 */
export class RequisicaoCompraOmieGateway implements IRequisicaoCompraGateway {
  constructor(private readonly client: OmieClient) {}

  async incluirRequisicao(dados: RequisicaoCompraParaIncluir): Promise<StatusRequisicaoCompra> {
    const resposta = await this.client.call<{
      codReqCompra: number;
      codIntReqCompra: string;
      cCodStatus: string;
      cDesStatus: string;
    }>({
      resource: "produtos/requisicaocompra",
      call: "IncluirReq",
      param: {
        codIntReqCompra: dados.codIntReqCompra,
        codCateg: dados.codigoCategoria,
        dtSugestao: dados.dataSugestao,
        ItensReqCompra: dados.itens.map(mapearItem),
      },
    });

    return {
      codigoRequisicao: resposta.codReqCompra,
      codIntReqCompra: resposta.codIntReqCompra,
      codigoStatus: resposta.cCodStatus,
      descricaoStatus: resposta.cDesStatus,
    };
  }

  async alterarRequisicao(dados: RequisicaoCompraParaAlterar): Promise<StatusRequisicaoCompra> {
    const resposta = await this.client.call<{
      codReqCompra: number;
      codIntReqCompra: string;
      cCodStatus: string;
      cDesStatus: string;
    }>({
      resource: "produtos/requisicaocompra",
      call: "AlterarReq",
      param: {
        codReqCompra: dados.codigoRequisicao,
        ...(dados.codigoCategoria !== undefined ? { codCateg: dados.codigoCategoria } : {}),
        ...(dados.dataSugestao !== undefined ? { dtSugestao: dados.dataSugestao } : {}),
        ...(dados.itens ? { ItensReqCompra: dados.itens.map(mapearItem) } : {}),
      },
    });

    return {
      codigoRequisicao: resposta.codReqCompra,
      codIntReqCompra: resposta.codIntReqCompra,
      codigoStatus: resposta.cCodStatus,
      descricaoStatus: resposta.cDesStatus,
    };
  }

  async excluirRequisicao(codigoRequisicao: number): Promise<StatusRequisicaoCompra> {
    const resposta = await this.client.call<{
      codReqCompra: number;
      codIntReqCompra: string;
      cCodStatus: string;
      cDesStatus: string;
    }>({
      resource: "produtos/requisicaocompra",
      call: "ExcluirReq",
      param: { codReqCompra: codigoRequisicao },
    });

    return {
      codigoRequisicao: resposta.codReqCompra,
      codIntReqCompra: resposta.codIntReqCompra,
      codigoStatus: resposta.cCodStatus,
      descricaoStatus: resposta.cDesStatus,
    };
  }

  async consultarRequisicao(codigoRequisicao: number): Promise<RequisicaoCompraOmie> {
    return this.client.call<RequisicaoCompraOmie>({
      resource: "produtos/requisicaocompra",
      call: "ConsultarReq",
      param: { codReqCompra: codigoRequisicao },
    });
  }

  async listarRequisicoesPagina(
    params: ListarRequisicoesCompraPageParams
  ): Promise<ListarRequisicoesCompraResponse> {
    try {
      return await this.client.call<ListarRequisicoesCompraResponse>({
        resource: "produtos/requisicaocompra",
        call: "PesquisarReq",
        param: {
          pagina: params.pagina,
          registros_por_pagina: params.registrosPorPagina,
        },
      });
    } catch (err) {
      if (err instanceof OmieApiError && err.faultCode === "SOAP-ENV:Client-5113") {
        return { total_de_paginas: 1, total_de_registros: 0, requisicaoCadastro: [] };
      }
      throw err;
    }
  }
}
