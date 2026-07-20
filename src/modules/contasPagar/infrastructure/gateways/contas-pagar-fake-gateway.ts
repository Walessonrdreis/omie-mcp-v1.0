import {
  ContaPagarOmie,
  IContasPagarGateway,
  ListarContasPagarResponse,
} from "../../domain/interfaces/contas-pagar-gateway.js";

const CONTAS_FAKE: ContaPagarOmie[] = [
  {
    codigo_lancamento_omie: 7001,
    codigo_cliente_fornecedor: 5002,
    data_vencimento: "10/12/2026",
    valor_documento: 500,
    status_titulo: "ABERTO",
    numero_documento_fiscal: "NF-001",
    codigo_categoria: "2.01",
    observacao: "Compra de insumos (fake)",
  },
  {
    codigo_lancamento_omie: 7002,
    codigo_cliente_fornecedor: 5002,
    data_vencimento: "05/12/2026",
    valor_documento: 200,
    status_titulo: "PAGO",
    numero_documento_fiscal: "NF-002",
    codigo_categoria: "2.02",
    observacao: "",
  },
];

/**
 * Implementação em memória de `IContasPagarGateway`, sem chamar a Omie real —
 * usada quando `OMIE_MOCK=true`, pra desenvolvimento/testes offline. Não
 * filtra por data de alteração (o fake não simula histórico de alteração,
 * só pagina os dados fixos).
 */
export class ContasPagarFakeGateway implements IContasPagarGateway {
  constructor(private readonly contas: ContaPagarOmie[] = CONTAS_FAKE) {}

  async listarPagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarContasPagarResponse> {
    const inicio = (pagina - 1) * registrosPorPagina;
    const pagina_de_contas = this.contas.slice(inicio, inicio + registrosPorPagina);
    const totalPaginas = Math.max(1, Math.ceil(this.contas.length / registrosPorPagina));

    return {
      pagina,
      total_de_paginas: totalPaginas,
      registros: pagina_de_contas.length,
      total_de_registros: this.contas.length,
      conta_pagar_cadastro: pagina_de_contas,
    };
  }
}
