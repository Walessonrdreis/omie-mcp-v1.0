import { defineTool, paramSchema, ToolDef } from "./types.js";

/**
 * Módulo: Compras de insumos para produção.
 * Referência: https://developer.omie.com.br/service-list/ (Compras, Estoque e Produção)
 */
export const comprasTools: ToolDef[] = [
  defineTool({
    name: "omie_requisicao_compra_incluir",
    description:
      "Inclui uma requisição de compra de insumos para produção. Método Omie: IncluirRequisicaoCompra.",
    inputSchema: { param: paramSchema },
    resource: "produtos/requisicaocompra",
    call: "IncluirRequisicaoCompra",
    destructive: true,
  }),
  defineTool({
    name: "omie_pedido_compra_incluir",
    description: "Inclui um pedido de compra de insumos. Método Omie: IncluirPedidoCompra.",
    inputSchema: { param: paramSchema },
    resource: "produtos/pedidocompra",
    call: "IncluirPedidoCompra",
    destructive: true,
  }),
];
