import {
  INotaEntradaGateway,
  ListarNotaEntradaPageParams,
  ListarNotaEntradaResponse,
  NotaEntradaOmie,
} from "../../domain/interfaces/nota-entrada-gateway.js";

const NOTAS_FAKE: NotaEntradaOmie[] = [
  {
    cabec: { nCodNotaEnt: 1001, cNumeroNotaEnt: "1", dPrevisao: "10/07/2026", nCodCli: 9001 },
    totais: { nMercadorias: 500, nDescontos: 0, nIPI: 0, nICMSST: 0, nTotalNotaEnt: 500 },
    produtos: [{ cCFOP: "1.102", cNCM: "0000.00.00", codigo_local_estoque: 1 }],
  },
];

export class NotaEntradaFakeGateway implements INotaEntradaGateway {
  constructor(private readonly notas: NotaEntradaOmie[] = NOTAS_FAKE) {}

  async listarNotasPagina(params: ListarNotaEntradaPageParams): Promise<ListarNotaEntradaResponse> {
    const inicio = (params.pagina - 1) * params.registrosPorPagina;
    const pagina = this.notas.slice(inicio, inicio + params.registrosPorPagina);

    return {
      nPagina: params.pagina,
      nTotalPaginas: Math.max(1, Math.ceil(this.notas.length / params.registrosPorPagina)),
      nRegistros: pagina.length,
      nTotalRegistros: this.notas.length,
      notas: pagina.map((n) => ({ cabec: n.cabec, totais: n.totais })),
    };
  }

  async consultarNota(codigoNota: number): Promise<NotaEntradaOmie> {
    const nota = this.notas.find((n) => n.cabec.nCodNotaEnt === codigoNota);
    if (!nota) throw new Error(`Nota de entrada ${codigoNota} não encontrada (fake).`);
    return nota;
  }
}
