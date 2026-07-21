import { OmieClient } from "../../../../omieClient.js";
import { ICrmAuxiliarGateway } from "../../domain/interfaces/crm-auxiliar-gateway.js";

export class CrmAuxiliarOmieGateway implements ICrmAuxiliarGateway {
  constructor(private readonly client: OmieClient) {}

  async listarFases(pagina: number, registrosPorPagina: number) {
    return this.client.call<any>({
      resource: "crm/fases",
      call: "ListarFases",
      param: { pagina, registros_por_pagina: registrosPorPagina },
    });
  }

  async listarSolucoes(pagina: number, registrosPorPagina: number) {
    return this.client.call<any>({
      resource: "crm/solucoes",
      call: "ListarSolucoes",
      param: { pagina, registros_por_pagina: registrosPorPagina },
    });
  }

  async listarOrigens(pagina: number, registrosPorPagina: number) {
    return this.client.call<any>({
      resource: "crm/origens",
      call: "ListarOrigens",
      param: { pagina, registros_por_pagina: registrosPorPagina },
    });
  }
}
