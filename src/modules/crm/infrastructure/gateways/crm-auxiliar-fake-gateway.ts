import { ICrmAuxiliarGateway } from "../../domain/interfaces/crm-auxiliar-gateway.js";

export class CrmAuxiliarFakeGateway implements ICrmAuxiliarGateway {
  async listarFases() {
    return {
      total_de_paginas: 1,
      total_de_registros: 1,
      cadastros: [{ cDescrPadrao: "01 Prospect", cDescrUsuario: "01 Prospect (fake)", cObservacao: "" }],
    };
  }

  async listarSolucoes() {
    return {
      total_de_paginas: 1,
      total_de_registros: 1,
      cadastros: [{ nCodigo: 1, cDescricao: "Solução 01 (fake)", cInativo: "N" as const }],
    };
  }

  async listarOrigens() {
    return {
      total_de_paginas: 1,
      total_de_registros: 1,
      cadastros: [{ nCodigo: 1, cDescricao: "Ativo (fake)", cObservacao: "" }],
    };
  }
}
