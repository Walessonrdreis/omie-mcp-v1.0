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
  private proximoCodigo = 9500;

  /**
   * Cópia própria por instância (não a constante `PEDIDOS_FAKE` direto) —
   * mesmo cuidado dos demais fakes desta sessão: agora que o fake também
   * cria/altera/exclui, compartilhar o array por referência vazaria estado
   * de um teste pro outro.
   */
  constructor(
    private readonly pedidos: PedidoVenda[] = PEDIDOS_FAKE.map((p) => ({
      cabecalho: { ...p.cabecalho },
      det: p.det.map((item) => ({ produto: { ...item.produto } })),
      infoCadastro: { ...p.infoCadastro },
      total_pedido: { ...p.total_pedido },
    }))
  ) {}

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

  private encontrar(chave: ChavePedido): PedidoVenda | undefined {
    return this.pedidos.find(
      (p) =>
        (chave.codigo_pedido !== undefined && p.cabecalho.codigo_pedido === chave.codigo_pedido) ||
        (chave.codigo_pedido_integracao !== undefined &&
          p.cabecalho.numero_pedido === chave.codigo_pedido_integracao)
    );
  }

  async consultarPedido(chave: ChavePedido): Promise<PedidoVenda> {
    const pedido = this.encontrar(chave);
    if (!pedido) {
      throw new Error(`Pedido não encontrado (fake): ${JSON.stringify(chave)}`);
    }
    return pedido;
  }

  async incluirPedido(dados: DadosPedidoParaGravar): Promise<StatusPedidoOmie> {
    const codigoPedido = this.proximoCodigo++;
    const valorTotal = dados.itens.reduce((soma, item) => soma + item.quantidade * item.valor_unitario, 0);

    this.pedidos.push({
      cabecalho: {
        codigo_pedido: codigoPedido,
        numero_pedido: String(codigoPedido),
        codigo_cliente: dados.codigo_cliente,
        data_previsao: dados.data_previsao,
        etapa: dados.etapa ?? "10",
        quantidade_itens: dados.itens.length,
      },
      det: dados.itens.map((item) => ({
        produto: {
          codigo_produto: item.codigo_produto,
          codigo: "",
          descricao: "",
          unidade: "",
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
          valor_mercadoria: item.quantidade * item.valor_unitario,
        },
      })),
      infoCadastro: { cancelado: "N", faturado: "N" },
      total_pedido: { valor_total_pedido: valorTotal },
    });

    return {
      codigo_pedido: codigoPedido,
      codigo_pedido_integracao: dados.codigo_pedido_integracao ?? "",
      numero_pedido: String(codigoPedido),
      codigo_status: "0",
      descricao_status: "Pedido cadastrado com sucesso! (fake)",
    };
  }

  async alterarPedido(dados: DadosPedidoParaGravar): Promise<StatusPedidoOmie> {
    const pedido = this.encontrar({
      codigo_pedido: dados.codigo_pedido,
      codigo_pedido_integracao: dados.codigo_pedido_integracao,
    });
    if (!pedido) {
      throw new Error(`Pedido não encontrado pra alterar (fake): ${JSON.stringify(dados)}`);
    }

    pedido.cabecalho.codigo_cliente = dados.codigo_cliente;
    pedido.cabecalho.data_previsao = dados.data_previsao;
    pedido.det = dados.itens.map((item) => ({
      produto: {
        codigo_produto: item.codigo_produto,
        codigo: "",
        descricao: "",
        unidade: "",
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        valor_mercadoria: item.quantidade * item.valor_unitario,
      },
    }));
    pedido.cabecalho.quantidade_itens = pedido.det.length;
    pedido.total_pedido.valor_total_pedido = dados.itens.reduce(
      (soma, item) => soma + item.quantidade * item.valor_unitario,
      0
    );

    return {
      codigo_pedido: pedido.cabecalho.codigo_pedido,
      codigo_pedido_integracao: dados.codigo_pedido_integracao ?? "",
      numero_pedido: pedido.cabecalho.numero_pedido,
      codigo_status: "0",
      descricao_status: "Pedido alterado com sucesso! (fake)",
    };
  }

  async excluirPedido(chave: ChavePedido): Promise<StatusPedidoOmie> {
    const indice = this.pedidos.findIndex(
      (p) =>
        (chave.codigo_pedido !== undefined && p.cabecalho.codigo_pedido === chave.codigo_pedido) ||
        (chave.codigo_pedido_integracao !== undefined &&
          p.cabecalho.numero_pedido === chave.codigo_pedido_integracao)
    );
    if (indice === -1) {
      throw new Error(`Pedido não encontrado pra excluir (fake): ${JSON.stringify(chave)}`);
    }

    const [pedido] = this.pedidos.splice(indice, 1);

    return {
      codigo_pedido: pedido.cabecalho.codigo_pedido,
      codigo_pedido_integracao: "",
      numero_pedido: pedido.cabecalho.numero_pedido,
      codigo_status: "0",
      descricao_status: "Pedido Excluído com sucesso! (fake)",
    };
  }
}
