import { OmieApiError, OmieClient } from "../../../../integrations/omie/omieClient.js";
import {
  IPedidoCompraGateway,
  ItemPedidoCompra,
  ListarPedidosCompraPageParams,
  ListarPedidosCompraResponse,
  PedidoCompraOmie,
  PedidoCompraParaAlterar,
  PedidoCompraParaIncluir,
  StatusPedidoCompra,
} from "../../domain/interfaces/pedido-compra-gateway.js";

function mapearItemIncluir(item: ItemPedidoCompra) {
  return {
    cCodIntItem: item.codIntItem,
    nCodProd: item.codProduto,
    nQtde: item.quantidade,
    nValUnit: item.valorUnitario,
  };
}

/**
 * Encapsula o acesso a Pedido de Compra da Omie (`produtos/pedidocompra`).
 */
export class PedidoCompraOmieGateway implements IPedidoCompraGateway {
  constructor(private readonly client: OmieClient) {}

  async incluirPedido(dados: PedidoCompraParaIncluir): Promise<StatusPedidoCompra> {
    const resposta = await this.client.call<{
      nCodPed: number;
      cCodIntPed: string;
      cCodStatus: string;
      cDescStatus: string;
      cNumero: string;
    }>({
      resource: "produtos/pedidocompra",
      call: "IncluirPedCompra",
      param: {
        cabecalho_incluir: {
          cCodIntPed: dados.codIntPed,
          dDtPrevisao: dados.dataPrevisao,
          nQtdeParc: dados.quantidadeParcelas,
          nCodFor: dados.codigoFornecedor,
          nCodCC: dados.codigoContaCorrente,
          cCodCateg: dados.codigoCategoria,
        },
        frete_incluir: {},
        produtos_incluir: dados.itens.map(mapearItemIncluir),
      },
    });

    return {
      codigoPedido: resposta.nCodPed,
      codIntPed: resposta.cCodIntPed,
      codigoStatus: resposta.cCodStatus,
      descricaoStatus: resposta.cDescStatus,
      numero: resposta.cNumero,
    };
  }

  async alterarPedido(dados: PedidoCompraParaAlterar): Promise<StatusPedidoCompra> {
    const resposta = await this.client.call<{
      nCodPed: number;
      cCodIntPed: string;
      cCodStatus: string;
      cDescStatus: string;
      cNumero: string;
    }>({
      resource: "produtos/pedidocompra",
      call: "AlteraPedCompra",
      param: {
        cabecalho_alterar: {
          nCodPed: dados.codigoPedido,
          ...(dados.quantidadeParcelas !== undefined ? { nQtdeParc: dados.quantidadeParcelas } : {}),
        },
        ...(dados.itens ? { produtos_alterar: dados.itens.map(mapearItemIncluir) } : {}),
      },
    });

    return {
      codigoPedido: resposta.nCodPed,
      codIntPed: resposta.cCodIntPed,
      codigoStatus: resposta.cCodStatus,
      descricaoStatus: resposta.cDescStatus,
      numero: resposta.cNumero,
    };
  }

  async excluirPedido(codigoPedido: number): Promise<StatusPedidoCompra> {
    const resposta = await this.client.call<{
      nCodPed: number;
      cCodIntPed: string;
      cCodStatus: string;
      cDescStatus: string;
    }>({
      resource: "produtos/pedidocompra",
      call: "ExcluirPedCompra",
      param: { nCodPed: codigoPedido },
    });

    return {
      codigoPedido: resposta.nCodPed,
      codIntPed: resposta.cCodIntPed,
      codigoStatus: resposta.cCodStatus,
      descricaoStatus: resposta.cDescStatus,
    };
  }

  async consultarPedido(codigoPedido: number): Promise<PedidoCompraOmie> {
    return this.client.call<PedidoCompraOmie>({
      resource: "produtos/pedidocompra",
      call: "ConsultarPedCompra",
      param: { nCodPed: codigoPedido },
    });
  }

  async listarPedidosPagina(
    params: ListarPedidosCompraPageParams
  ): Promise<ListarPedidosCompraResponse> {
    try {
      return await this.client.call<ListarPedidosCompraResponse>({
        resource: "produtos/pedidocompra",
        call: "PesquisarPedCompra",
        param: {
          nPagina: params.pagina,
          nRegsPorPagina: params.registrosPorPagina,
          // Testado ao vivo: a Omie esconde TUDO por padrão nesta listagem —
          // é preciso pedir explicitamente cada situação de pedido que se
          // quer ver, senão "Não existem registros" mesmo com pedidos ativos.
          lExibirPedidosPendentes: "S",
          lExibirPedidosFaturados: "S",
          lExibirPedidosRecebidos: "S",
          lExibirPedidosCancelados: "S",
          lExibirPedidosEncerrados: "S",
          lExibirPedidosRecParciais: "S",
          lExibirPedidosFatParciais: "S",
        },
      });
    } catch (err) {
      // Testado ao vivo: a Omie devolve erro (não uma lista vazia) quando a
      // página pedida não tem registros — normalizamos pra lista vazia.
      if (err instanceof OmieApiError && err.faultCode === "SOAP-ENV:Client-5113") {
        return { nTotalPaginas: 1, nTotalRegistros: 0, pedidos_pesquisa: [] };
      }
      throw err;
    }
  }
}
