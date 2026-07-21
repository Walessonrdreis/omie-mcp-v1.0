import { OmieClient } from "../../../../omieClient.js";
import {
  ChavePedido,
  COD_OPERACAO_VENDA_PRODUTO,
  DadosPedidoParaGravar,
  IPedidoVendaGateway,
  ListarPedidosResponse,
  OperacaoEtapas,
  PedidoVenda,
  StatusPedidoOmie,
} from "../../domain/interfaces/pedido-venda-gateway.js";

export {
  PedidoVenda,
  ItemPedidoVenda,
  EtapaFaturamento,
  COD_OPERACAO_VENDA_PRODUTO,
} from "../../domain/interfaces/pedido-venda-gateway.js";

interface ListarEtapasFaturamentoResponse {
  cadastros: (OperacaoEtapas | Record<string, never>)[];
}

export class PedidoVendaOmieGateway implements IPedidoVendaGateway {
  constructor(private readonly client: OmieClient) {}

  async listarPedidosPagina(
    pagina: number,
    registrosPorPagina: number,
    etapa?: string
  ): Promise<ListarPedidosResponse> {
    return this.client.call<ListarPedidosResponse>({
      resource: "produtos/pedido",
      call: "ListarPedidos",
      param: {
        pagina,
        registros_por_pagina: registrosPorPagina,
        apenas_importado_api: "N",
        ...(etapa ? { etapa } : {}),
      },
    });
  }

  async listarEtapasFaturamento(): Promise<OperacaoEtapas[]> {
    const resposta = await this.client.call<ListarEtapasFaturamentoResponse>({
      resource: "produtos/etapafat",
      call: "ListarEtapasFaturamento",
      param: { pagina: 1, registros_por_pagina: 50 },
    });
    return resposta.cadastros.filter(
      (c): c is OperacaoEtapas => "cCodOperacao" in c
    );
  }

  async descreverEtapaVendaProduto(etapaCodigo: string): Promise<string | undefined> {
    const mapa = await this.mapaEtapasVendaProduto();
    return mapa.get(etapaCodigo);
  }

  async mapaEtapasVendaProduto(): Promise<Map<string, string>> {
    const operacoes = await this.listarEtapasFaturamento();
    const vendaProduto = operacoes.find((op) => op.cCodOperacao === COD_OPERACAO_VENDA_PRODUTO);
    const mapa = new Map<string, string>();
    for (const etapa of vendaProduto?.etapas ?? []) {
      mapa.set(etapa.cCodigo, etapa.cDescricao || etapa.cDescrPadrao);
    }
    return mapa;
  }

  async consultarPedido(chave: ChavePedido): Promise<PedidoVenda> {
    const resposta = await this.client.call<{ pedido_venda_produto: PedidoVenda }>({
      resource: "produtos/pedido",
      call: "ConsultarPedido",
      param: { ...chave },
    });
    return resposta.pedido_venda_produto;
  }

  private montarParamGravacao(dados: DadosPedidoParaGravar): Record<string, unknown> {
    return {
      cabecalho: {
        codigo_pedido: dados.codigo_pedido,
        codigo_pedido_integracao: dados.codigo_pedido_integracao,
        codigo_cliente: dados.codigo_cliente,
        data_previsao: dados.data_previsao,
        etapa: dados.etapa ?? "10",
        codigo_parcela: dados.codigo_parcela ?? "000",
      },
      informacoes_adicionais: {
        codigo_categoria: dados.codigo_categoria,
        codigo_conta_corrente: dados.codigo_conta_corrente,
        consumidor_final: dados.consumidor_final ?? "N",
      },
      det: dados.itens.map((item) => ({
        ide: { codigo_item_integracao: item.codigo_item_integracao },
        produto: {
          codigo_produto: item.codigo_produto,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
        },
      })),
    };
  }

  async incluirPedido(dados: DadosPedidoParaGravar): Promise<StatusPedidoOmie> {
    return this.client.call<StatusPedidoOmie>({
      resource: "produtos/pedido",
      call: "IncluirPedido",
      param: this.montarParamGravacao(dados),
    });
  }

  async alterarPedido(dados: DadosPedidoParaGravar): Promise<StatusPedidoOmie> {
    return this.client.call<StatusPedidoOmie>({
      resource: "produtos/pedido",
      call: "AlterarPedidoVenda",
      param: this.montarParamGravacao(dados),
    });
  }

  async excluirPedido(chave: ChavePedido): Promise<StatusPedidoOmie> {
    return this.client.call<StatusPedidoOmie>({
      resource: "produtos/pedido",
      call: "ExcluirPedido",
      param: { ...chave },
    });
  }
}
