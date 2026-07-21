import {
  CaracteristicaOmie,
  ICaracteristicaGateway,
} from "../../domain/interfaces/caracteristica-gateway.js";
import { aplicarFiltros } from "../../../../shared/filtro.js";
import {
  AlterarCaracteristicaParam,
  CaracteristicaResult,
  ConsultarCaracteristicaParam,
  ExcluirCaracteristicaParam,
  IncluirCaracteristicaParam,
  ListarCaracteristicasParam,
  ListarCaracteristicasResult,
} from "../dto/caracteristica.dto.js";

function mapear(c: CaracteristicaOmie): CaracteristicaResult {
  return {
    codigo: c.nCodCaract,
    codIntCaracteristica: c.cCodIntCaract,
    nome: c.cNomeCaract,
    conteudosPermitidos: c.conteudosPermitidos.map((cp) => cp.cConteudo),
  };
}

export class IncluirCaracteristicaUseCase {
  constructor(private readonly gateway: ICaracteristicaGateway) {}

  async execute(param: IncluirCaracteristicaParam) {
    return this.gateway.incluirCaracteristica({
      codIntCaracteristica: param.cod_int_caracteristica,
      nome: param.nome,
      valorDefinido: param.valor_definido,
      conteudosPermitidos: param.conteudos_permitidos,
    });
  }
}

export class AlterarCaracteristicaUseCase {
  constructor(private readonly gateway: ICaracteristicaGateway) {}

  async execute(param: AlterarCaracteristicaParam) {
    return this.gateway.alterarCaracteristica({
      codigoCaracteristica: param.codigo_caracteristica,
      nome: param.nome,
    });
  }
}

export class ExcluirCaracteristicaUseCase {
  constructor(private readonly gateway: ICaracteristicaGateway) {}

  async execute(param: ExcluirCaracteristicaParam) {
    return this.gateway.excluirCaracteristica(param.codigo_caracteristica);
  }
}

export class ConsultarCaracteristicaUseCase {
  constructor(private readonly gateway: ICaracteristicaGateway) {}

  async execute(param: ConsultarCaracteristicaParam): Promise<CaracteristicaResult> {
    return mapear(await this.gateway.consultarCaracteristica(param.codigo_caracteristica));
  }
}

export class ListarCaracteristicasUseCase {
  constructor(private readonly gateway: ICaracteristicaGateway) {}

  async execute(param: ListarCaracteristicasParam): Promise<ListarCaracteristicasResult> {
    const pagina = param.pagina ?? 1;
    const registrosPorPagina = param.registros_por_pagina ?? 50;

    const resposta = await this.gateway.listarCaracteristicasPagina({ pagina, registrosPorPagina });

    return {
      pagina: resposta.nPagina,
      totalPaginas: resposta.nTotPaginas,
      totalRegistros: resposta.nTotRegistros,
      caracteristicas: aplicarFiltros(resposta.listaCaracteristicas.map(mapear), param.filtros),
    };
  }
}
