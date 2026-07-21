import { ICrmAuxiliarGateway } from "../../domain/interfaces/crm-auxiliar-gateway.js";
import { aplicarFiltros } from "../../../../shared/filtro.js";
import { FaseResult, ListarCrmAuxiliarParam, OrigemResult, SolucaoResult } from "../dto/crm-auxiliar.dto.js";

export class ListarFasesUseCase {
  constructor(private readonly gateway: ICrmAuxiliarGateway) {}

  async execute(param: ListarCrmAuxiliarParam) {
    const pagina = param.pagina ?? 1;
    const registrosPorPagina = param.registros_por_pagina ?? 50;
    const resposta = await this.gateway.listarFases(pagina, registrosPorPagina);

    const fases: FaseResult[] = resposta.cadastros.map((f) => ({
      descricaoPadrao: f.cDescrPadrao,
      descricaoUsuario: f.cDescrUsuario,
      observacao: f.cObservacao,
    }));

    return {
      totalPaginas: resposta.total_de_paginas,
      totalRegistros: resposta.total_de_registros,
      fases: aplicarFiltros(fases, param.filtros),
    };
  }
}

export class ListarSolucoesUseCase {
  constructor(private readonly gateway: ICrmAuxiliarGateway) {}

  async execute(param: ListarCrmAuxiliarParam) {
    const pagina = param.pagina ?? 1;
    const registrosPorPagina = param.registros_por_pagina ?? 50;
    const resposta = await this.gateway.listarSolucoes(pagina, registrosPorPagina);

    const solucoes: SolucaoResult[] = resposta.cadastros.map((s) => ({
      codigo: s.nCodigo,
      descricao: s.cDescricao,
      inativo: s.cInativo === "S",
    }));

    return {
      totalPaginas: resposta.total_de_paginas,
      totalRegistros: resposta.total_de_registros,
      solucoes: aplicarFiltros(solucoes, param.filtros),
    };
  }
}

export class ListarOrigensUseCase {
  constructor(private readonly gateway: ICrmAuxiliarGateway) {}

  async execute(param: ListarCrmAuxiliarParam) {
    const pagina = param.pagina ?? 1;
    const registrosPorPagina = param.registros_por_pagina ?? 50;
    const resposta = await this.gateway.listarOrigens(pagina, registrosPorPagina);

    const origens: OrigemResult[] = resposta.cadastros.map((o) => ({
      codigo: o.nCodigo,
      descricao: o.cDescricao,
      observacao: o.cObservacao,
    }));

    return {
      totalPaginas: resposta.total_de_paginas,
      totalRegistros: resposta.total_de_registros,
      origens: aplicarFiltros(origens, param.filtros),
    };
  }
}
