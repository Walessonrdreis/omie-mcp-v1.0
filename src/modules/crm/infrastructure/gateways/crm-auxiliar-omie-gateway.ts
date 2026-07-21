import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import { chaveCache, comCache } from "../../../../shared/cache.js";
import { ICrmAuxiliarGateway } from "../../domain/interfaces/crm-auxiliar-gateway.js";

export class CrmAuxiliarOmieGateway implements ICrmAuxiliarGateway {
  constructor(private readonly client: OmieClient) {}

  async listarFases(pagina: number, registrosPorPagina: number) {
    const resource = "crm/fases";
    const call = "ListarFases";
    const param = { pagina, registros_por_pagina: registrosPorPagina };
    return comCache(chaveCache(resource, call, param), () => this.client.call<any>({ resource, call, param }));
  }

  async listarSolucoes(pagina: number, registrosPorPagina: number) {
    const resource = "crm/solucoes";
    const call = "ListarSolucoes";
    const param = { pagina, registros_por_pagina: registrosPorPagina };
    return comCache(chaveCache(resource, call, param), () => this.client.call<any>({ resource, call, param }));
  }

  async listarOrigens(pagina: number, registrosPorPagina: number) {
    const resource = "crm/origens";
    const call = "ListarOrigens";
    const param = { pagina, registros_por_pagina: registrosPorPagina };
    return comCache(chaveCache(resource, call, param), () => this.client.call<any>({ resource, call, param }));
  }
}
