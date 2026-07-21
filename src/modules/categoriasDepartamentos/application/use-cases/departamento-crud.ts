import { DepartamentoOmie, IDepartamentoGateway } from "../../domain/interfaces/departamento-gateway.js";
import { aplicarFiltros } from "../../../../shared/filtro.js";
import {
  AlterarDepartamentoParam,
  ConsultarDepartamentoParam,
  DepartamentoResult,
  ExcluirDepartamentoParam,
  IncluirDepartamentoParam,
  ListarDepartamentosParam,
  ListarDepartamentosResult,
} from "../dto/departamento.dto.js";

function mapearDepartamento(d: DepartamentoOmie): DepartamentoResult {
  return {
    codigo: d.codigo,
    descricao: d.descricao,
    estrutura: d.estrutura,
    inativo: d.inativo === "S",
  };
}

export class IncluirDepartamentoUseCase {
  constructor(private readonly gateway: IDepartamentoGateway) {}

  async execute(param: IncluirDepartamentoParam) {
    return this.gateway.incluirDepartamento({ codigoPai: param.codigo_pai, descricao: param.descricao });
  }
}

export class AlterarDepartamentoUseCase {
  constructor(private readonly gateway: IDepartamentoGateway) {}

  async execute(param: AlterarDepartamentoParam) {
    return this.gateway.alterarDepartamento({ codigo: param.codigo, descricao: param.descricao });
  }
}

export class ExcluirDepartamentoUseCase {
  constructor(private readonly gateway: IDepartamentoGateway) {}

  async execute(param: ExcluirDepartamentoParam) {
    return this.gateway.excluirDepartamento(param.codigo);
  }
}

export class ConsultarDepartamentoUseCase {
  constructor(private readonly gateway: IDepartamentoGateway) {}

  async execute(param: ConsultarDepartamentoParam): Promise<DepartamentoResult> {
    return mapearDepartamento(await this.gateway.consultarDepartamento(param.codigo));
  }
}

export class ListarDepartamentosUseCase {
  constructor(private readonly gateway: IDepartamentoGateway) {}

  async execute(param: ListarDepartamentosParam): Promise<ListarDepartamentosResult> {
    const pagina = param.pagina ?? 1;
    const registrosPorPagina = param.registros_por_pagina ?? 50;

    const resposta = await this.gateway.listarDepartamentosPagina({ pagina, registrosPorPagina });

    return {
      pagina: resposta.pagina,
      totalPaginas: resposta.total_de_paginas,
      totalRegistros: resposta.total_de_registros,
      departamentos: aplicarFiltros(resposta.departamentos.map(mapearDepartamento), param.filtros),
    };
  }
}
