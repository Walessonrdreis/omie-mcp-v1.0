import { IServicoGateway, ServicoOmie } from "../../domain/interfaces/servico-gateway.js";
import { aplicarFiltros } from "../../../../shared/filtro.js";
import {
  AlterarServicoParam,
  ConsultarServicoParam,
  ExcluirServicoParam,
  IncluirServicoParam,
  ListarServicosParam,
  ListarServicosResult,
  ServicoResult,
} from "../dto/servico.dto.js";

function mapearServico(servico: ServicoOmie): ServicoResult {
  return {
    codigoServico: servico.intListar.nCodServ,
    codIntServico: servico.intListar.cCodIntServ,
    codigo: servico.cabecalho.cCodigo,
    descricao: servico.cabecalho.cDescricao,
    descricaoCompleta: servico.descricao.cDescrCompleta,
    precoUnitario: servico.cabecalho.nPrecoUnit,
    codigoCategoria: servico.cabecalho.cCodCateg,
    inativo: servico.info.inativo === "S",
  };
}

export class IncluirServicoUseCase {
  constructor(private readonly gateway: IServicoGateway) {}

  async execute(param: IncluirServicoParam) {
    return this.gateway.incluirServico({
      codIntServico: param.cod_int_servico,
      descricao: param.descricao,
      codigo: param.codigo,
      precoUnitario: param.preco_unitario,
      descricaoCompleta: param.descricao_completa,
      codigoCategoria: param.codigo_categoria,
    });
  }
}

export class AlterarServicoUseCase {
  constructor(private readonly gateway: IServicoGateway) {}

  async execute(param: AlterarServicoParam) {
    return this.gateway.alterarServico({
      codigoServico: param.codigo_servico,
      descricao: param.descricao,
      precoUnitario: param.preco_unitario,
      descricaoCompleta: param.descricao_completa,
    });
  }
}

export class ExcluirServicoUseCase {
  constructor(private readonly gateway: IServicoGateway) {}

  async execute(param: ExcluirServicoParam) {
    return this.gateway.excluirServico(param.codigo_servico);
  }
}

export class ConsultarServicoUseCase {
  constructor(private readonly gateway: IServicoGateway) {}

  async execute(param: ConsultarServicoParam): Promise<ServicoResult> {
    return mapearServico(await this.gateway.consultarServico(param.codigo_servico));
  }
}

export class ListarServicosUseCase {
  constructor(private readonly gateway: IServicoGateway) {}

  async execute(param: ListarServicosParam): Promise<ListarServicosResult> {
    const pagina = param.pagina ?? 1;
    const registrosPorPagina = param.registros_por_pagina ?? 50;

    const resposta = await this.gateway.listarServicosPagina({ pagina, registrosPorPagina });

    return {
      pagina: resposta.nPagina,
      totalPaginas: resposta.nTotPaginas,
      totalRegistros: resposta.nTotRegistros,
      servicos: aplicarFiltros(resposta.cadastros.map(mapearServico), param.filtros),
    };
  }
}
