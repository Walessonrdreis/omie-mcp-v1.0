import { OmieClient } from "../../../../omieClient.js";

export interface ContaCorrenteOmie {
  nCodCC: number;
  descricao: string;
  codigo_banco: string;
  tipo_conta_corrente: string;
  inativo: "S" | "N";
  saldo_inicial: number;
  saldo_data: string;
}

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
export class ContasCorrentesOmieGateway {
  constructor(private readonly client: OmieClient) {}

  private async listarPagina(pagina: number): Promise<ListarContasCorrentesResponse> {
    return this.client.call<ListarContasCorrentesResponse>({
      resource: "geral/contacorrente",
      call: "ListarContasCorrentes",
      param: { pagina, registros_por_pagina: 100 },
    });
  }

  /** Poucas dezenas de contas em geral — busca todas as páginas e devolve um mapa código -> conta. */
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
}
