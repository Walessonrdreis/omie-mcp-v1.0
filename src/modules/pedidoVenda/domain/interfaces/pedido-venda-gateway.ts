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
  total_pedido: {
    valor_total_pedido: number;
  };
}

export interface ListarPedidosResponse {
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

export interface OperacaoEtapas {
  cCodOperacao: string;
  cDescOperacao: string;
  etapas: EtapaFaturamento[];
}

/** Código fixo da Omie para a operação "Venda de Produto" (não confundir com serviço/OS). */
export const COD_OPERACAO_VENDA_PRODUTO = "11";

export interface ItemPedidoParaGravar {
  codigo_item_integracao: string;
  codigo_produto: number;
  quantidade: number;
  valor_unitario: number;
}

/**
 * Dados pra gravar um pedido (Incluir/Alterar). Testado ao vivo: o cliente
 * precisa ter UF preenchida no cadastro (senão a Omie recusa), e
 * `codigo_categoria`/`codigo_conta_corrente` são obrigatórios mesmo num
 * pedido simples — não há como pular pra "financeiro depois".
 */
export interface DadosPedidoParaGravar {
  codigo_pedido?: number;
  codigo_pedido_integracao?: string;
  codigo_cliente: number;
  data_previsao: string;
  etapa?: string;
  codigo_parcela?: string;
  codigo_categoria: string;
  codigo_conta_corrente: number;
  consumidor_final?: "S" | "N";
  itens: ItemPedidoParaGravar[];
}

export interface StatusPedidoOmie {
  codigo_pedido: number;
  codigo_pedido_integracao: string;
  numero_pedido: string;
  codigo_status: string;
  descricao_status: string;
}

/** Identifica um pedido — codigo_pedido ou codigo_pedido_integracao já bastam. */
export interface ChavePedido {
  codigo_pedido?: number;
  codigo_pedido_integracao?: string;
}

/**
 * Contrato de acesso a Pedidos de Venda, independente de vir da Omie real ou
 * de um fake em memória (`OMIE_MOCK=true`).
 *
 * A `etapa` do pedido tem catálogo em `ListarEtapasFaturamento`
 * (`produtos/etapafat`), na operação "11" — Venda de Produto. A Ordem de
 * Produção também tem, na operação "28": o catálogo cobre os dois recursos.
 * Em ambos, cada conta renomeia as etapas — prefira `cDescricao` e caia para
 * `cDescrPadrao` só quando ele vier vazio. Ver
 * `docs/omie-api/pedido-venda/etapas.md`.
 *
 * Importante: pedidos CANCELADOS continuam com a `etapa` antiga (o
 * cancelamento não reseta o campo) — por isso quem usa este gateway sempre
 * precisa cruzar com `infoCadastro.cancelado`.
 */
export interface IPedidoVendaGateway {
  listarPedidosPagina(
    pagina: number,
    registrosPorPagina: number,
    etapa?: string
  ): Promise<ListarPedidosResponse>;

  listarEtapasFaturamento(): Promise<OperacaoEtapas[]>;

  /** Descrição da etapa (ex: "Separar Estoque") pro código, dentro de "Venda de Produto". */
  descreverEtapaVendaProduto(etapaCodigo: string): Promise<string | undefined>;

  /** Mapa código -> descrição de todas as etapas de "Venda de Produto", pra resolver em lote. */
  mapaEtapasVendaProduto(): Promise<Map<string, string>>;

  consultarPedido(chave: ChavePedido): Promise<PedidoVenda>;

  incluirPedido(dados: DadosPedidoParaGravar): Promise<StatusPedidoOmie>;

  alterarPedido(dados: DadosPedidoParaGravar): Promise<StatusPedidoOmie>;

  excluirPedido(chave: ChavePedido): Promise<StatusPedidoOmie>;
}
