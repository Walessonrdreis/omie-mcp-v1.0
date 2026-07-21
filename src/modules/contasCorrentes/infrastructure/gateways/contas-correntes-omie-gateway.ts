import { OmieClient } from "../../../../omieClient.js";
import {
  ConsultarExtratoParams,
  ContaCorrenteOmie,
  ExtratoContaCorrenteOmie,
  IContasCorrentesGateway,
} from "../../domain/interfaces/contas-correntes-gateway.js";

export { ContaCorrenteOmie } from "../../domain/interfaces/contas-correntes-gateway.js";

interface ListarContasCorrentesResponse {
  pagina: number;
  total_de_paginas: number;
  registros: number;
  total_de_registros: number;
  ListarContasCorrentes: ContaCorrenteOmie[];
}

/**
 * Encapsula o acesso ao cadastro de contas correntes da Omie. Reaproveitado
 * por outros módulos que recebem só o código da conta (nCodCC) e precisam do
 * nome/descrição (ex: `fluxoCaixa`).
 */
export class ContasCorrentesOmieGateway implements IContasCorrentesGateway {
  constructor(private readonly client: OmieClient) {}

  private async listarPagina(pagina: number): Promise<ListarContasCorrentesResponse> {
    return this.client.call<ListarContasCorrentesResponse>({
      resource: "geral/contacorrente",
      call: "ListarContasCorrentes",
      param: { pagina, registros_por_pagina: 100 },
    });
  }

  async mapaContasPorCodigo(): Promise<Map<number, ContaCorrenteOmie>> {
    const mapa = new Map<number, ContaCorrenteOmie>();
    let pagina = 1;
    let totalPaginas = 1;

    do {
      const resposta = await this.listarPagina(pagina);
      totalPaginas = resposta.total_de_paginas;
      for (const conta of resposta.ListarContasCorrentes) {
        mapa.set(conta.nCodCC, conta);
      }
      pagina++;
    } while (pagina <= totalPaginas);

    return mapa;
  }

  async consultarExtrato(params: ConsultarExtratoParams): Promise<ExtratoContaCorrenteOmie> {
    return this.client.call<ExtratoContaCorrenteOmie>({
      resource: "financas/extrato",
      call: "ListarExtrato",
      param: {
        nCodCC: params.codigoContaCorrente,
        dPeriodoInicial: params.periodoInicial,
        dPeriodoFinal: params.periodoFinal,
      },
    });
  }
}
