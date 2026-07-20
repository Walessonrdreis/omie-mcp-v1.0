import { defineTool, paramSchema, ToolDef } from "./types.js";

/**
 * Módulo: Cadastro de Produtos e Famílias.
 * Referência: https://developer.omie.com.br/service-list/ (Geral)
 */
export const produtosTools: ToolDef[] = [
  defineTool({
    name: "omie_produtos_consultar",
    description: "Consulta o cadastro de um produto específico. Método Omie: ConsultarProduto.",
    inputSchema: { param: paramSchema },
    resource: "geral/produtos",
    call: "ConsultarProduto",
  }),
  defineTool({
    name: "omie_produtos_listar",
    description: "Lista produtos cadastrados, com filtros e paginação. Método Omie: ListarProdutos.",
    inputSchema: { param: paramSchema },
    resource: "geral/produtos",
    call: "ListarProdutos",
  }),
  defineTool({
    name: "omie_familias_listar",
    description:
      "Lista as famílias de produtos cadastradas, com paginação. Método Omie: PesquisarFamilias " +
      "(recurso 'geral/familias'). Campos típicos: pagina, registros_por_pagina.",
    inputSchema: { param: paramSchema },
    resource: "geral/familias",
    call: "PesquisarFamilias",
  }),
];
