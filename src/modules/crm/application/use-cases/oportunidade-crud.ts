import { IOportunidadeGateway, OportunidadeOmie } from "../../domain/interfaces/oportunidade-gateway.js";
import { aplicarFiltros } from "../../../../shared/filtro.js";
import {
  AlterarOportunidadeParam,
  ConsultarOportunidadeParam,
  ExcluirOportunidadeParam,
  IncluirOportunidadeParam,
  ListarOportunidadesParam,
  ListarOportunidadesResult,
  OportunidadeResult,
} from "../dto/oportunidade.dto.js";

function mapearOportunidade(op: OportunidadeOmie): OportunidadeResult {
  return {
    codigoOportunidade: op.identificacao.nCodOp,
    codIntOportunidade: op.identificacao.cCodIntOp,
    descricao: op.identificacao.cDesOp,
    numero: op.identificacao.cNumOp,
    codigoConta: op.identificacao.nCodConta,
    codigoContato: op.identificacao.nCodContato,
    codigoFase: op.fasesStatus.nCodFase,
    valorTicket: op.ticket.nTicket,
  };
}

export class IncluirOportunidadeUseCase {
  constructor(private readonly gateway: IOportunidadeGateway) {}

  async execute(param: IncluirOportunidadeParam) {
    return this.gateway.incluirOportunidade({
      codIntOportunidade: param.cod_int_oportunidade,
      descricao: param.descricao,
      codigoConta: param.codigo_conta,
      codigoContato: param.codigo_contato,
      codigoSolucao: param.codigo_solucao,
      codigoOrigem: param.codigo_origem,
    });
  }
}

export class AlterarOportunidadeUseCase {
  constructor(private readonly gateway: IOportunidadeGateway) {}

  async execute(param: AlterarOportunidadeParam) {
    return this.gateway.alterarOportunidade({
      codigoOportunidade: param.codigo_oportunidade,
      descricao: param.descricao,
    });
  }
}

export class ExcluirOportunidadeUseCase {
  constructor(private readonly gateway: IOportunidadeGateway) {}

  async execute(param: ExcluirOportunidadeParam) {
    return this.gateway.excluirOportunidade(param.codigo_oportunidade);
  }
}

export class ConsultarOportunidadeUseCase {
  constructor(private readonly gateway: IOportunidadeGateway) {}

  async execute(param: ConsultarOportunidadeParam): Promise<OportunidadeResult> {
    return mapearOportunidade(await this.gateway.consultarOportunidade(param.codigo_oportunidade));
  }
}

export class ListarOportunidadesUseCase {
  constructor(private readonly gateway: IOportunidadeGateway) {}

  async execute(param: ListarOportunidadesParam): Promise<ListarOportunidadesResult> {
    const pagina = param.pagina ?? 1;
    const registrosPorPagina = param.registros_por_pagina ?? 50;

    const resposta = await this.gateway.listarOportunidadesPagina({ pagina, registrosPorPagina });

    return {
      totalPaginas: resposta.total_de_paginas,
      totalRegistros: resposta.total_de_registros,
      oportunidades: aplicarFiltros(resposta.cadastros.map(mapearOportunidade), param.filtros),
    };
  }
}
