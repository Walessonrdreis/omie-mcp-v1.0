import { ICadastrosAuxiliaresGateway } from "../../domain/interfaces/cadastros-auxiliares-gateway.js";
import { aplicarFiltros } from "../../../../shared/filtro.js";
import {
  ConsultarUnidadeParam,
  ListarBancosParam,
  ListarCidadesParam,
  ListarNCMParam,
  ListarPaisesParam,
} from "../dto/cadastros-auxiliares.dto.js";

export class ListarBancosUseCase {
  constructor(private readonly gateway: ICadastrosAuxiliaresGateway) {}

  async execute(param: ListarBancosParam) {
    const pagina = param.pagina ?? 1;
    const registrosPorPagina = param.registros_por_pagina ?? 50;
    const resposta = await this.gateway.listarBancos({ pagina, registrosPorPagina, nome: param.nome });

    const bancos = resposta.fin_banco_cadastro.map((b) => ({
      codigo: b.codigo,
      nome: b.nome,
      tipo: b.tipo,
    }));

    return {
      pagina: resposta.pagina,
      totalPaginas: resposta.total_de_paginas,
      totalRegistros: resposta.total_de_registros,
      bancos: aplicarFiltros(bancos, param.filtros),
    };
  }
}

export class ListarCidadesUseCase {
  constructor(private readonly gateway: ICadastrosAuxiliaresGateway) {}

  async execute(param: ListarCidadesParam) {
    const pagina = param.pagina ?? 1;
    const registrosPorPagina = param.registros_por_pagina ?? 50;
    const resposta = await this.gateway.listarCidades({
      pagina,
      registrosPorPagina,
      uf: param.uf,
      contendo: param.contendo,
    });

    const cidades = resposta.lista_cidades.map((c) => ({
      codigo: c.cCod,
      nome: c.cNome,
      uf: c.cUF,
      codigoIBGE: c.nCodIBGE,
    }));

    return {
      pagina: resposta.pagina,
      totalPaginas: resposta.total_de_paginas,
      totalRegistros: resposta.total_de_registros,
      cidades: aplicarFiltros(cidades, param.filtros),
    };
  }
}

export class ListarPaisesUseCase {
  constructor(private readonly gateway: ICadastrosAuxiliaresGateway) {}

  async execute(param: ListarPaisesParam) {
    const resposta = await this.gateway.listarPaises({
      codigoIso: param.codigo_iso,
      descricao: param.descricao,
    });

    const paises = resposta.lista_paises.map((p) => ({
      codigo: p.cCodigo,
      codigoIso: p.cCodigoISO,
      descricao: p.cDescricao,
    }));

    return { paises: aplicarFiltros(paises, param.filtros) };
  }
}

export class ListarNCMUseCase {
  constructor(private readonly gateway: ICadastrosAuxiliaresGateway) {}

  async execute(param: ListarNCMParam) {
    const pagina = param.pagina ?? 1;
    const registrosPorPagina = param.registros_por_pagina ?? 50;
    const resposta = await this.gateway.listarNCM({
      pagina,
      registrosPorPagina,
      codigo: param.codigo,
      descricao: param.descricao,
    });

    const codigos = resposta.listaNCM.map((n) => ({ codigo: n.cCodigo, descricao: n.cDescricao }));

    return {
      pagina: resposta.nPagina,
      totalPaginas: resposta.nTotPaginas,
      totalRegistros: resposta.nTotRegistros,
      codigos: aplicarFiltros(codigos, param.filtros),
    };
  }
}

export class ConsultarUnidadeUseCase {
  constructor(private readonly gateway: ICadastrosAuxiliaresGateway) {}

  async execute(param: ConsultarUnidadeParam) {
    const unidade = await this.gateway.consultarUnidade(param.codigo);
    return { codigo: unidade.codigo, descricao: unidade.descricao };
  }
}
