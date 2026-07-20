import { z } from "zod";
import { OmieClient } from "../omieClient.js";

/**
 * Ferramentas dedicadas ao módulo "Compras, Estoque e Produção" da Omie,
 * cobrindo o fluxo de Chão de Fábrica:
 *   - Ordens de Produção (op)
 *   - Estrutura de Produtos / BOM (malha)
 *   - Produtos
 *   - Estoque (consulta, ajustes, movimentação, locais)
 *   - Requisições e Pedidos de Compra (insumos para produção)
 *
 * Referência: https://developer.omie.com.br/service-list/ (seção "Compras, Estoque e Produção")
 *
 * O parâmetro `param` de cada ferramenta é repassado diretamente para a Omie,
 * seguindo os campos documentados para o respectivo método.
 */

const paramSchema = z
  .record(z.unknown())
  .describe("Parâmetros da chamada, conforme documentação Omie para este método.");

export const chaoDeFabricaTools = [
  {
    name: "omie_op_incluir",
    description:
      "Inclui uma nova Ordem de Produção (OP) na Omie. Método Omie: IncluirOrdemProducao. " +
      "Campos típicos: cCodIntOP, dDtPrevisao, nCodProduto, nQtde, identificacao, itens (insumos).",
    inputSchema: { param: paramSchema },
    resource: "produtos/op",
    call: "IncluirOrdemProducao",
  },
  {
    name: "omie_op_alterar",
    description: "Altera uma Ordem de Produção existente. Método Omie: AlterarOrdemProducao.",
    inputSchema: { param: paramSchema },
    resource: "produtos/op",
    call: "AlterarOrdemProducao",
  },
  {
    name: "omie_op_excluir",
    description: "Exclui uma Ordem de Produção. Método Omie: ExcluirOrdemProducao.",
    inputSchema: { param: paramSchema },
    resource: "produtos/op",
    call: "ExcluirOrdemProducao",
  },
  {
    name: "omie_op_consultar",
    description:
      "Consulta uma Ordem de Produção específica (por código Omie ou código interno). " +
      "Método Omie: ConsultarOrdemProducao.",
    inputSchema: { param: paramSchema },
    resource: "produtos/op",
    call: "ConsultarOrdemProducao",
  },
  {
    name: "omie_op_listar",
    description:
      "Lista as Ordens de Produção cadastradas, com paginação e filtros. " +
      "Método Omie: ListarOrdemProducao.",
    inputSchema: { param: paramSchema },
    resource: "produtos/op",
    call: "ListarOrdemProducao",
  },
  {
    name: "omie_estrutura_consultar",
    description:
      "Consulta a estrutura (árvore de componentes / BOM / ficha técnica) de um produto. " +
      "Método Omie: ConsultarEstrutura (recurso 'malha').",
    inputSchema: { param: paramSchema },
    resource: "produtos/malha",
    call: "ConsultarEstrutura",
  },
  {
    name: "omie_produtos_consultar",
    description: "Consulta o cadastro de um produto específico. Método Omie: ConsultarProduto.",
    inputSchema: { param: paramSchema },
    resource: "geral/produtos",
    call: "ConsultarProduto",
  },
  {
    name: "omie_produtos_listar",
    description: "Lista produtos cadastrados, com filtros e paginação. Método Omie: ListarProdutos.",
    inputSchema: { param: paramSchema },
    resource: "geral/produtos",
    call: "ListarProdutos",
  },
  {
    name: "omie_estoque_consultar",
    description:
      "Consulta a posição consolidada de estoque de um produto. Método Omie: ConsultarEstoque " +
      "(recurso 'estoque/consulta').",
    inputSchema: { param: paramSchema },
    resource: "estoque/consulta",
    call: "ConsultarEstoque",
  },
  {
    name: "omie_estoque_ajuste_incluir",
    description:
      "Registra um ajuste/movimentação manual de estoque (ex: consumo de insumos, entrada de " +
      "produto acabado da produção). Método Omie: IncluirAjusteEstoque.",
    inputSchema: { param: paramSchema },
    resource: "estoque/ajuste",
    call: "IncluirAjusteEstoque",
  },
  {
    name: "omie_estoque_movimentos_listar",
    description:
      "Lista os movimentos de estoque (entradas/saídas) de um produto em um período. " +
      "Método Omie: ListarMovimentos (recurso 'estoque/movestoque').",
    inputSchema: { param: paramSchema },
    resource: "estoque/movestoque",
    call: "ListarMovimentos",
  },
  {
    name: "omie_requisicao_compra_incluir",
    description:
      "Inclui uma requisição de compra de insumos para produção. Método Omie: IncluirRequisicaoCompra.",
    inputSchema: { param: paramSchema },
    resource: "produtos/requisicaocompra",
    call: "IncluirRequisicaoCompra",
  },
  {
    name: "omie_pedido_compra_incluir",
    description: "Inclui um pedido de compra de insumos. Método Omie: IncluirPedidoCompra.",
    inputSchema: { param: paramSchema },
    resource: "produtos/pedidocompra",
    call: "IncluirPedidoCompra",
  },
  {
    name: "omie_familias_listar",
    description:
      "Lista as famílias de produtos cadastradas, com paginação. Método Omie: PesquisarFamilias " +
      "(recurso 'geral/familias'). Campos típicos: pagina, registros_por_pagina.",
    inputSchema: { param: paramSchema },
    resource: "geral/familias",
    call: "PesquisarFamilias",
  },
] as const;

export async function handleChaoDeFabricaTool(
  client: OmieClient,
  toolName: string,
  args: { param?: Record<string, unknown> }
) {
  const tool = chaoDeFabricaTools.find((t) => t.name === toolName);
  if (!tool) {
    throw new Error(`Ferramenta de Chão de Fábrica desconhecida: ${toolName}`);
  }
  return client.call({
    resource: tool.resource,
    call: tool.call,
    param: args.param ?? {},
  });
}
