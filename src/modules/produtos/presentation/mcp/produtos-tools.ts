import { ToolDef, paramSchema, defineTool } from "../../../../tools/types.js";
import { OmieClient } from "../../../../omieClient.js";
import { IEstoqueGateway } from "../../../estoque/domain/interfaces/estoque-gateway.js";
import { EstoqueFakeGateway } from "../../../estoque/infrastructure/gateways/estoque-fake-gateway.js";
import { EstoqueOmieGateway } from "../../../estoque/infrastructure/gateways/estoque-omie-gateway.js";
import { listarProdutosComEstoqueParamSchema } from "../../application/dto/listar-produtos-com-estoque.dto.js";
import {
  alterarProdutoParamSchema,
  excluirProdutoParamSchema,
  incluirProdutoParamSchema,
} from "../../application/dto/produto-crud.dto.js";
import { ListarProdutosComEstoqueUseCase } from "../../application/use-cases/listar-produtos-com-estoque.js";
import { IncluirProdutoUseCase } from "../../application/use-cases/incluir-produto.js";
import { AlterarProdutoUseCase } from "../../application/use-cases/alterar-produto.js";
import { ExcluirProdutoUseCase } from "../../application/use-cases/excluir-produto.js";
import { IProdutosGateway } from "../../domain/interfaces/produtos-gateway.js";
import { ProdutosFakeGateway } from "../../infrastructure/gateways/produtos-fake-gateway.js";
import { ProdutosOmieGateway } from "../../infrastructure/gateways/produtos-omie-gateway.js";

function criarProdutosGateway(client: OmieClient): IProdutosGateway {
  return process.env.OMIE_MOCK === "true"
    ? new ProdutosFakeGateway()
    : new ProdutosOmieGateway(client);
}

function criarEstoqueGateway(client: OmieClient): IEstoqueGateway {
  return process.env.OMIE_MOCK === "true"
    ? new EstoqueFakeGateway()
    : new EstoqueOmieGateway(client);
}

export const produtosTools: ToolDef[] = [
  defineTool({
    name: "omie_produtos_consultar",
    description: "Consulta o cadastro de um produto específico. Método Omie: ConsultarProduto.",
    inputSchema: { param: paramSchema },
    resource: "geral/produtos",
    call: "ConsultarProduto",
  }),
  defineTool({
    name: "omie_produtos_incluir",
    description:
      "Cria um novo produto/serviço no cadastro. Método Omie: IncluirProduto. Campos " +
      "obrigatórios (testado ao vivo — a doc pública da Omie erra ao marcar 'codigo' como " +
      "opcional): codigo (SKU), descricao, unidade. Opcionais comuns: codigo_produto_integracao, " +
      "ncm, valor_unitario, ean, codigo_familia (via omie_familias_listar), tipoItem, peso_liq, " +
      "peso_bruto, marca, modelo. Retorna codigo_produto (código Omie gerado).",
    inputSchema: { param: incluirProdutoParamSchema },
    execute: async (client, param) => {
      const parsed = incluirProdutoParamSchema.parse(param);
      const useCase = new IncluirProdutoUseCase(criarProdutosGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_produtos_alterar",
    description:
      "Altera um produto/serviço já cadastrado. Método Omie: AlterarProduto. Precisa identificar " +
      "o produto por codigo_produto, codigo (SKU) ou codigo_produto_integracao, e enviar os campos " +
      "que devem mudar (mesmos campos aceitos em omie_produtos_incluir).",
    inputSchema: { param: alterarProdutoParamSchema },
    execute: async (client, param) => {
      const parsed = alterarProdutoParamSchema.parse(param);
      const useCase = new AlterarProdutoUseCase(criarProdutosGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_produtos_excluir",
    description:
      "Exclui um produto/serviço do cadastro. Método Omie: ExcluirProduto. Identifique o produto " +
      "por codigo_produto, codigo (SKU) ou codigo_produto_integracao (só um deles é suficiente). " +
      "A Omie recusa a exclusão se o produto já tiver movimentação (pedido, estoque, OP, etc.).",
    inputSchema: { param: excluirProdutoParamSchema },
    execute: async (client, param) => {
      const parsed = excluirProdutoParamSchema.parse(param);
      const useCase = new ExcluirProdutoUseCase(criarProdutosGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
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
      "da família, via omie_familias_listar) pra restringir a uma família de produtos. Também " +
      "aceita o parâmetro genérico 'filtros' (critérios campo/operador/valor sobre qualquer " +
      "campo do item, ex: descricao, valorEmEstoqueVenda).",
    inputSchema: { param: listarProdutosComEstoqueParamSchema },
    execute: async (client, param) => {
      const parsed = listarProdutosComEstoqueParamSchema.parse(param);
      const produtosGateway = criarProdutosGateway(client);
      const estoqueGateway = criarEstoqueGateway(client);
      const useCase = new ListarProdutosComEstoqueUseCase(produtosGateway, estoqueGateway);
      return useCase.execute(parsed);
    },
  }),
];
