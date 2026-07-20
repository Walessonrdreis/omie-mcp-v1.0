import { OmieClient } from "../../../../omieClient.js";
import {
  COD_OPERACAO_VENDA_PRODUTO,
  IPedidoVendaGateway,
  ListarPedidosResponse,
  OperacaoEtapas,
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
}
