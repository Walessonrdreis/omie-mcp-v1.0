import { defineTool, paramSchema, ToolDef } from "./types.js";

/**
 * Módulo: Ordens de Produção e Estrutura de Produtos (BOM/ficha técnica).
 * Referência: https://developer.omie.com.br/service-list/ (Compras, Estoque e Produção)
 */
export const producaoTools: ToolDef[] = [
  defineTool({
    name: "omie_op_incluir",
    description:
      "Inclui uma nova Ordem de Produção (OP) na Omie. Método Omie: IncluirOrdemProducao. " +
      "Campos típicos: cCodIntOP, dDtPrevisao, nCodProduto, nQtde, identificacao, itens (insumos).",
    inputSchema: { param: paramSchema },
    resource: "produtos/op",
    call: "IncluirOrdemProducao",
  }),
  defineTool({
    name: "omie_op_alterar",
    description: "Altera uma Ordem de Produção existente. Método Omie: AlterarOrdemProducao.",
    inputSchema: { param: paramSchema },
    resource: "produtos/op",
    call: "AlterarOrdemProducao",
  }),
  defineTool({
    name: "omie_op_excluir",
    description: "Exclui uma Ordem de Produção. Método Omie: ExcluirOrdemProducao.",
    inputSchema: { param: paramSchema },
    resource: "produtos/op",
    call: "ExcluirOrdemProducao",
  }),
  defineTool({
    name: "omie_op_consultar",
    description:
      "Consulta uma Ordem de Produção específica (por código Omie ou código interno). " +
      "Método Omie: ConsultarOrdemProducao.",
    inputSchema: { param: paramSchema },
    resource: "produtos/op",
    call: "ConsultarOrdemProducao",
  }),
  defineTool({
    name: "omie_op_listar",
    description:
      "Lista as Ordens de Produção cadastradas, com paginação e filtros. " +
      "Método Omie: ListarOrdemProducao.",
    inputSchema: { param: paramSchema },
    resource: "produtos/op",
    call: "ListarOrdemProducao",
  }),
  defineTool({
    name: "omie_estrutura_consultar",
    description:
      "Consulta a estrutura (árvore de componentes / BOM / ficha técnica) de um produto. " +
      "Método Omie: ConsultarEstrutura (recurso 'malha').",
    inputSchema: { param: paramSchema },
    resource: "produtos/malha",
    call: "ConsultarEstrutura",
  }),
];
