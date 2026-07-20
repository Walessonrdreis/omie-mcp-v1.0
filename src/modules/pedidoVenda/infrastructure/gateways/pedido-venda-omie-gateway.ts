import { OmieClient } from "../../../../omieClient.js";

export interface ItemPedidoVenda {
  produto: {
    codigo_produto: number;
    codigo: string;
    descricao: string;
    unidade: string;
    quantidade: number;
    valor_unitario: number;
    valor_mercadoria: number;
  };
}

export interface PedidoVenda {
  cabecalho: {
    codigo_pedido: number;
    numero_pedido: string;
    codigo_cliente: number;
    data_previsao: string;
    etapa: string;
    quantidade_itens: number;
  };
  det: ItemPedidoVenda[];
  infoCadastro: {
    cancelado: "S" | "N";
    faturado: "S" | "N";
  };
}

interface ListarPedidosResponse {
  pagina: number;
  total_de_paginas: number;
  registros: number;
  total_de_registros: number;
  pedido_venda_produto: PedidoVenda[];
}

export interface EtapaFaturamento {
  cCodigo: string;
  cDescrPadrao: string;
  cDescricao: string;
  cInativo: "S" | "N";
}

interface OperacaoEtapas {
  cCodOperacao: string;
  cDescOperacao: string;
  etapas: EtapaFaturamento[];
}

interface ListarEtapasFaturamentoResponse {
  cadastros: (OperacaoEtapas | Record<string, never>)[];
}

/** Código fixo da Omie para a operação "Venda de Produto" (não confundir com serviço/OS). */
export const COD_OPERACAO_VENDA_PRODUTO = "11";

/**
 * Encapsula o acesso a Pedidos de Venda da Omie. Diferente da Ordem de
 * Produção, aqui a `etapa` do pedido É um catálogo fixo e documentado
 * (`ListarEtapasFaturamento`, resource `produtos/etapafat`), não configurável
 * por conta — então dá pra traduzir o código com confiança.
 *
 * Importante: pedidos CANCELADOS continuam com a `etapa` antiga (o
 * cancelamento não reseta o campo) — por isso quem usa este gateway sempre
 * precisa cruzar com `infoCadastro.cancelado`.
 */
export class PedidoVendaOmieGateway {
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

  /** Descrição da etapa (ex: "Separar Estoque") pro código, dentro de "Venda de Produto". */
  async descreverEtapaVendaProduto(etapaCodigo: string): Promise<string | undefined> {
    const operacoes = await this.listarEtapasFaturamento();
    const vendaProduto = operacoes.find((op) => op.cCodOperacao === COD_OPERACAO_VENDA_PRODUTO);
    const etapa = vendaProduto?.etapas.find((e) => e.cCodigo === etapaCodigo);
    return etapa?.cDescricao || etapa?.cDescrPadrao;
  }
}
