import { CategoriaOmie, ICategoriaGateway } from "../../domain/interfaces/categoria-gateway.js";
import { aplicarFiltros } from "../../../../shared/filtro.js";
import {
  AlterarCategoriaParam,
  CategoriaResult,
  ConsultarCategoriaParam,
  IncluirCategoriaParam,
  ListarCategoriasParam,
  ListarCategoriasResult,
} from "../dto/categoria.dto.js";

function mapearCategoria(c: CategoriaOmie): CategoriaResult {
  return {
    codigo: c.codigo,
    descricao: c.descricao,
    categoriaSuperior: c.categoria_superior,
    contaDespesa: c.conta_despesa === "S",
    contaReceita: c.conta_receita === "S",
    inativa: c.conta_inativa === "S",
  };
}

export class IncluirCategoriaUseCase {
  constructor(private readonly gateway: ICategoriaGateway) {}

  async execute(param: IncluirCategoriaParam) {
    return this.gateway.incluirCategoria({
      categoriaSuperior: param.categoria_superior,
      descricao: param.descricao,
    });
  }
}

export class AlterarCategoriaUseCase {
  constructor(private readonly gateway: ICategoriaGateway) {}

  async execute(param: AlterarCategoriaParam) {
    return this.gateway.alterarCategoria({ codigo: param.codigo, descricao: param.descricao });
  }
}

export class ConsultarCategoriaUseCase {
  constructor(private readonly gateway: ICategoriaGateway) {}

  async execute(param: ConsultarCategoriaParam): Promise<CategoriaResult> {
    return mapearCategoria(await this.gateway.consultarCategoria(param.codigo));
  }
}

export class ListarCategoriasUseCase {
  constructor(private readonly gateway: ICategoriaGateway) {}

  async execute(param: ListarCategoriasParam): Promise<ListarCategoriasResult> {
    const pagina = param.pagina ?? 1;
    const registrosPorPagina = param.registros_por_pagina ?? 50;

    const resposta = await this.gateway.listarCategoriasPagina({ pagina, registrosPorPagina });

    return {
      pagina: resposta.pagina,
      totalPaginas: resposta.total_de_paginas,
      totalRegistros: resposta.total_de_registros,
      categorias: aplicarFiltros(resposta.categoria_cadastro.map(mapearCategoria), param.filtros),
    };
  }
}
