import { defineTool, ToolDef } from "../../../../tools/types.js";
import { OmieClient } from "../../../../omieClient.js";
import {
  buscarEstruturaPorProdutoParamSchema,
  listarEstruturasParamSchema,
} from "../../application/dto/estrutura.dto.js";
import { BuscarEstruturaPorProdutoUseCase } from "../../application/use-cases/buscar-estrutura-por-produto.js";
import { ListarEstruturasUseCase } from "../../application/use-cases/listar-estruturas.js";
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
      "Suporta paginação (pagina/registros_por_pagina, padrão 50).",
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
];
