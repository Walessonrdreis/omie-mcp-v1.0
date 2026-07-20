import {
  COD_OPERACAO_VENDA_PRODUTO,
  IPedidoVendaGateway,
  ListarPedidosResponse,
  OperacaoEtapas,
  PedidoVenda,
} from "../../domain/interfaces/pedido-venda-gateway.js";

const PEDIDOS_FAKE: PedidoVenda[] = [
  {
    cabecalho: {
      codigo_pedido: 9001,
      numero_pedido: "1",
      codigo_cliente: 5001,
      data_previsao: "20/12/2026",
      etapa: "20",
      quantidade_itens: 1,
    },
    det: [
      {
        produto: {
          codigo_produto: 111,
          codigo: "PROD-001",
          descricao: "Produto Fake 1",
          unidade: "UN",
          quantidade: 3,
          valor_unitario: 25,
          valor_mercadoria: 75,
        },
      },
    ],
    infoCadastro: { cancelado: "N", faturado: "N" },
    total_pedido: { valor_total_pedido: 75 },
  },
  {
    cabecalho: {
      codigo_pedido: 9002,
      numero_pedido: "2",
      codigo_cliente: 5002,
      data_previsao: "18/12/2026",
      etapa: "20",
      quantidade_itens: 1,
    },
    det: [
      {
        produto: {
          codigo_produto: 222,
          codigo: "PROD-002",
          descricao: "Produto Fake 2",
          unidade: "UN",
          quantidade: 2,
          valor_unitario: 50,
          valor_mercadoria: 100,
        },
      },
    ],
    infoCadastro: { cancelado: "S", faturado: "N" },
    total_pedido: { valor_total_pedido: 100 },
  },
];

const ETAPAS_VENDA_PRODUTO_FAKE: OperacaoEtapas = {
  cCodOperacao: COD_OPERACAO_VENDA_PRODUTO,
  cDescOperacao: "Venda de Produto",
  etapas: [
    { cCodigo: "10", cDescrPadrao: "Pedido de Venda", cDescricao: "Pedido de Venda", cInativo: "N" },
    { cCodigo: "20", cDescrPadrao: "Separar Estoque", cDescricao: "Separar Estoque", cInativo: "N" },
    { cCodigo: "50", cDescrPadrao: "Faturar", cDescricao: "Faturar", cInativo: "N" },
  ],
};

/**
 * Implementação em memória de `IPedidoVendaGateway`, sem chamar a Omie real —
 * usada quando `OMIE_MOCK=true`, pra desenvolvimento/testes offline. Inclui
 * de propósito um pedido cancelado na etapa "Separar Estoque" (comportamento
 * real da Omie: cancelamento não reseta a etapa), pra exercitar o filtro.
 */
export class PedidoVendaFakeGateway implements IPedidoVendaGateway {
  constructor(private readonly pedidos: PedidoVenda[] = PEDIDOS_FAKE) {}

  async listarPedidosPagina(
    pagina: number,
    registrosPorPagina: number,
    etapa?: string
  ): Promise<ListarPedidosResponse> {
    const filtrados = etapa
      ? this.pedidos.filter((p) => p.cabecalho.etapa === etapa)
      : this.pedidos;

    const inicio = (pagina - 1) * registrosPorPagina;
    const pagina_de_pedidos = filtrados.slice(inicio, inicio + registrosPorPagina);
    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / registrosPorPagina));

    return {
      pagina,
      total_de_paginas: totalPaginas,
      registros: pagina_de_pedidos.length,
      total_de_registros: filtrados.length,
      pedido_venda_produto: pagina_de_pedidos,
    };
  }

  async listarEtapasFaturamento(): Promise<OperacaoEtapas[]> {
    return [ETAPAS_VENDA_PRODUTO_FAKE];
  }

  async descreverEtapaVendaProduto(etapaCodigo: string): Promise<string | undefined> {
    const mapa = await this.mapaEtapasVendaProduto();
    return mapa.get(etapaCodigo);
  }

  async mapaEtapasVendaProduto(): Promise<Map<string, string>> {
    const mapa = new Map<string, string>();
    for (const etapa of ETAPAS_VENDA_PRODUTO_FAKE.etapas) {
      mapa.set(etapa.cCodigo, etapa.cDescricao || etapa.cDescrPadrao);
    }
    return mapa;
  }
}
