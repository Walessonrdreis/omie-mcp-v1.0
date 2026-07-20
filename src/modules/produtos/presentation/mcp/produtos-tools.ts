import { ToolDef, paramSchema, defineTool } from "../../../../tools/types.js";
import { EstoqueOmieGateway } from "../../../estoque/infrastructure/gateways/estoque-omie-gateway.js";
import { listarProdutosComEstoqueParamSchema } from "../../application/dto/listar-produtos-com-estoque.dto.js";
import { ListarProdutosComEstoqueUseCase } from "../../application/use-cases/listar-produtos-com-estoque.js";
import { ProdutosOmieGateway } from "../../infrastructure/gateways/produtos-omie-gateway.js";

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
    description:
      "Lista produtos cadastrados, com filtros e paginação. Método Omie: ListarProdutos. " +
      "Aceita filtrar_apenas_familia (código da família, via omie_familias_listar) pra listar só " +
      "produtos de uma família. Atenção: o campo quantidade_estoque retornado aqui NÃO é confiável " +
      "(vem sempre 0) — para saber a quantidade/valor real em estoque use " +
      "omie_produtos_listar_com_estoque ou omie_estoque_total_produto.",
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
  defineTool({
    name: "omie_produtos_listar_com_estoque",
    description:
      "Lista produtos JÁ com a quantidade e o valor em estoque calculados (somando todos os " +
      "locais de estoque cadastrados na Omie). A Omie não entrega esse cruzamento pronto — o " +
      "cadastro de produtos não tem estoque confiável e a posição de estoque não tem os dados do " +
      "produto — então esta ferramenta busca os dois e junta. Use para relatórios do tipo " +
      "'lista de produtos com valor em estoque', 'quais produtos tenho parado', etc. Devolve, por " +
      "produto: quantidadeEmEstoque, valorEmEstoqueVenda (preço de venda) e valorEmEstoqueCusto " +
      "(custo médio). Suporta paginação (pagina/registros_por_pagina), o filtro " +
      "apenas_com_estoque (remove produtos com estoque zerado) e filtrar_apenas_familia (código " +
      "da família, via omie_familias_listar) pra restringir a uma família de produtos.",
    inputSchema: { param: listarProdutosComEstoqueParamSchema },
    execute: async (client, param) => {
      const parsed = listarProdutosComEstoqueParamSchema.parse(param);
      const produtosGateway = new ProdutosOmieGateway(client);
      const estoqueGateway = new EstoqueOmieGateway(client);
      const useCase = new ListarProdutosComEstoqueUseCase(produtosGateway, estoqueGateway);
      return useCase.execute(parsed);
    },
  }),
];
