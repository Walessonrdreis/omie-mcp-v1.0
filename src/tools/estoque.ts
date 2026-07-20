import { defineTool, paramSchema, ToolDef } from "./types.js";

/**
 * Módulo: Estoque.
 * Referência: https://developer.omie.com.br/service-list/ (Compras, Estoque e Produção)
 */
export const estoqueTools: ToolDef[] = [
  defineTool({
    name: "omie_estoque_consultar",
    description:
      "Consulta a posição consolidada de estoque de um produto. Método Omie: ConsultarEstoque " +
      "(recurso 'estoque/consulta').",
    inputSchema: { param: paramSchema },
    resource: "estoque/consulta",
    call: "ConsultarEstoque",
  }),
  defineTool({
    name: "omie_estoque_ajuste_incluir",
    description:
      "Registra um ajuste/movimentação manual de estoque (ex: consumo de insumos, entrada de " +
      "produto acabado da produção). Método Omie: IncluirAjusteEstoque.",
    inputSchema: { param: paramSchema },
    resource: "estoque/ajuste",
    call: "IncluirAjusteEstoque",
  }),
  defineTool({
    name: "omie_estoque_movimentos_listar",
    description:
      "Lista os movimentos de estoque (entradas/saídas) de um produto em um período. " +
      "Método Omie: ListarMovimentos (recurso 'estoque/movestoque').",
    inputSchema: { param: paramSchema },
    resource: "estoque/movestoque",
    call: "ListarMovimentos",
  }),
];
