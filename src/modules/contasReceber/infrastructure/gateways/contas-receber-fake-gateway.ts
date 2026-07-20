import {
  ContaReceberOmie,
  IContasReceberGateway,
  ListarContasReceberResponse,
} from "../../domain/interfaces/contas-receber-gateway.js";

const CONTAS_FAKE: ContaReceberOmie[] = [
  {
    codigo_lancamento_omie: 8001,
    codigo_cliente_fornecedor: 5001,
    data_vencimento: "12/12/2026",
    valor_documento: 750,
    status_titulo: "ABERTO",
    numero_documento_fiscal: "NF-101",
    numero_pedido: "1",
    codigo_categoria: "1.01",
  },
  {
    codigo_lancamento_omie: 8002,
    codigo_cliente_fornecedor: 5001,
    data_vencimento: "01/12/2026",
    valor_documento: 300,
    status_titulo: "PAGO",
    numero_documento_fiscal: "NF-102",
    numero_pedido: "2",
    codigo_categoria: "1.01",
  },
];

/**
 * Implementação em memória de `IContasReceberGateway`, sem chamar a Omie
 * real — usada quando `OMIE_MOCK=true`, pra desenvolvimento/testes offline.
 * Não filtra por data de alteração (o fake não simula histórico de
 * alteração, só pagina os dados fixos).
 */
export class ContasReceberFakeGateway implements IContasReceberGateway {
  constructor(private readonly contas: ContaReceberOmie[] = CONTAS_FAKE) {}

  async listarPagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarContasReceberResponse> {
    const inicio = (pagina - 1) * registrosPorPagina;
    const pagina_de_contas = this.contas.slice(inicio, inicio + registrosPorPagina);
    const totalPaginas = Math.max(1, Math.ceil(this.contas.length / registrosPorPagina));

    return {
      pagina,
      total_de_paginas: totalPaginas,
      registros: pagina_de_contas.length,
      total_de_registros: this.contas.length,
      conta_receber_cadastro: pagina_de_contas,
    };
  }
}
