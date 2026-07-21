import { defineTool, ToolDef } from "../../../../tools/types.js";
import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import {
  buscarEstruturaPorProdutoParamSchema,
  listarEstruturasParamSchema,
} from "../../application/dto/estrutura.dto.js";
import {
  alterarEstruturaParamSchema,
  excluirEstruturaParamSchema,
  incluirEstruturaParamSchema,
} from "../../application/dto/estrutura-crud.dto.js";
import { BuscarEstruturaPorProdutoUseCase } from "../../application/use-cases/buscar-estrutura-por-produto.js";
import { ListarEstruturasUseCase } from "../../application/use-cases/listar-estruturas.js";
import { IncluirEstruturaUseCase } from "../../application/use-cases/incluir-estrutura.js";
import { AlterarEstruturaUseCase } from "../../application/use-cases/alterar-estrutura.js";
import { ExcluirEstruturaUseCase } from "../../application/use-cases/excluir-estrutura.js";
import { IEstruturaGateway } from "../../domain/interfaces/estrutura-gateway.js";
import { EstruturaFakeGateway } from "../../infrastructure/gateways/estrutura-fake-gateway.js";
import { EstruturaOmieGateway } from "../../infrastructure/gateways/estrutura-omie-gateway.js";

function criarEstruturaGateway(client: OmieClient): IEstruturaGateway {
  return process.env.OMIE_MOCK === "true"
    ? new EstruturaFakeGateway()
    : new EstruturaOmieGateway(client);
}

export const estruturaTools: ToolDef[] = [
  defineTool({
    name: "omie_estrutura_listar",
    description:
      "Lista os produtos que TÊM estrutura (BOM/ficha técnica) cadastrada, já com o nome do " +
      "produto e o nome de cada insumo/componente (a Omie devolve isso pronto — não precisa " +
      "cruzar com o cadastro de produtos). Método Omie: ListarEstruturas (recurso 'malha'). " +
      "Suporta paginação (pagina/registros_por_pagina, padrão 50) e o parâmetro genérico " +
      "'filtros' (critérios campo/operador/valor sobre qualquer campo do produto, ex: " +
      "descricaoProduto, itens).",
    inputSchema: { param: listarEstruturasParamSchema },
    execute: async (client, param) => {
      const parsed = listarEstruturasParamSchema.parse(param);
      const useCase = new ListarEstruturasUseCase(criarEstruturaGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_estrutura_buscar_por_produto",
    description:
      "Busca a estrutura (BOM/ficha técnica) de um produto pelo NOME/descrição (ou trecho dela) " +
      "ou pelo código, sem precisar saber o código interno da Omie de antemão — ex: 'qual a " +
      "estrutura do produto 100kg'. Internamente pagina ListarEstruturas e filtra pela descrição/" +
      "código do produto (a Omie não tem busca por texto nesse endpoint). Devolve os produtos que " +
      "baterem, já com nome e quantidade de cada insumo. Se vier mais de um resultado, refine o " +
      "termo de busca.",
    inputSchema: { param: buscarEstruturaPorProdutoParamSchema },
    execute: async (client, param) => {
      const parsed = buscarEstruturaPorProdutoParamSchema.parse(param);
      const useCase = new BuscarEstruturaPorProdutoUseCase(criarEstruturaGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_estrutura_incluir",
    description:
      "Adiciona um ou mais insumos/componentes à estrutura (BOM/ficha técnica) de um produto. " +
      "Método Omie: IncluirEstrutura. O produto pai (idProduto) precisa ser do tipo '03 - Produto " +
      "em Processo' ou '04 - Produto Acabado' (a Omie recusa outros tipos). Cada item exige " +
      "intMalha (identificador único que você inventa pro item, ex: 'ITEM-001' — testado ao vivo: " +
      "é obrigatório mesmo a doc pública da Omie dizendo o contrário), idProdMalha (código do " +
      "produto/insumo componente, já cadastrado) e quantProdMalha.",
    inputSchema: { param: incluirEstruturaParamSchema },
    execute: async (client, param) => {
      const parsed = incluirEstruturaParamSchema.parse(param);
      const useCase = new IncluirEstruturaUseCase(criarEstruturaGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_estrutura_alterar",
    description:
      "Altera item(ns) já existentes na estrutura de um produto (ex: mudar quantidade de um " +
      "insumo). Método Omie: AlterarEstrutura. Cada item precisa de idMalha (identifica o item — " +
      "veja em omie_estrutura_buscar_por_produto/omie_estrutura_listar) e idProdMalha (testado ao " +
      "vivo: obrigatório mesmo só pra mudar quantidade).",
    inputSchema: { param: alterarEstruturaParamSchema },
    execute: async (client, param) => {
      const parsed = alterarEstruturaParamSchema.parse(param);
      const useCase = new AlterarEstruturaUseCase(criarEstruturaGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_estrutura_excluir",
    description:
      "Remove um item específico da estrutura (BOM) de um produto. Método Omie: ExcluirEstrutura. " +
      "Precisa de idProduto (produto pai) e idMalha (identifica o item — veja em " +
      "omie_estrutura_buscar_por_produto/omie_estrutura_listar).",
    inputSchema: { param: excluirEstruturaParamSchema },
    execute: async (client, param) => {
      const parsed = excluirEstruturaParamSchema.parse(param);
      const useCase = new ExcluirEstruturaUseCase(criarEstruturaGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
];
