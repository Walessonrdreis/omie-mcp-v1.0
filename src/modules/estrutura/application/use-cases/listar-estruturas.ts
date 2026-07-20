import { IEstruturaGateway } from "../../domain/interfaces/estrutura-gateway.js";
import { ListarEstruturasParam, ListarEstruturasResult } from "../dto/estrutura.dto.js";
import { mapearProdutoComEstrutura } from "./mapear-produto-com-estrutura.js";

/**
 * A Omie devolve a listagem de estruturas (`ListarEstruturas`) já com nome do
 * produto e nome de cada insumo — diferente de outras listagens do MCP (ex:
 * OPs), aqui não é preciso cruzar com o cadastro de produtos.
 */
export class ListarEstruturasUseCase {
  constructor(private readonly estruturaGateway: IEstruturaGateway) {}

  async execute(param: ListarEstruturasParam): Promise<ListarEstruturasResult> {
    const pagina = param.pagina ?? 1;
    const registrosPorPagina = param.registros_por_pagina ?? 50;

    const resposta = await this.estruturaGateway.listarEstruturasPagina(
      pagina,
      registrosPorPagina
    );

    return {
      pagina: resposta.nPagina,
      totalPaginas: resposta.nTotPaginas,
      totalRegistros: resposta.nTotRegistros,
      produtos: resposta.produtosEncontrados.map(mapearProdutoComEstrutura),
    };
  }
}
