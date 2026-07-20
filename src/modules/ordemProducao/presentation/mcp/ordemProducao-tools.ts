import { ToolDef, paramSchema, defineTool } from "../../../../tools/types.js";
import { OmieClient } from "../../../../omieClient.js";
import { IProdutosGateway } from "../../../produtos/domain/interfaces/produtos-gateway.js";
import { ProdutosFakeGateway } from "../../../produtos/infrastructure/gateways/produtos-fake-gateway.js";
import { ProdutosOmieGateway } from "../../../produtos/infrastructure/gateways/produtos-omie-gateway.js";
import { listarOpsComProdutoParamSchema } from "../../application/dto/listar-ops-com-produto.dto.js";
import { ListarOpsComProdutoUseCase } from "../../application/use-cases/listar-ops-com-produto.js";
import { IOrdemProducaoGateway } from "../../domain/interfaces/op-gateway.js";
import { OpFakeGateway } from "../../infrastructure/gateways/op-fake-gateway.js";
import { OpOmieGateway } from "../../infrastructure/gateways/op-omie-gateway.js";

function criarOpGateway(client: OmieClient): IOrdemProducaoGateway {
  return process.env.OMIE_MOCK === "true" ? new OpFakeGateway() : new OpOmieGateway(client);
}

function criarProdutosGateway(client: OmieClient): IProdutosGateway {
  return process.env.OMIE_MOCK === "true"
    ? new ProdutosFakeGateway()
    : new ProdutosOmieGateway(client);
}

export const ordemProducaoTools: ToolDef[] = [
  defineTool({
    name: "omie_op_incluir",
    description:
      "Inclui uma nova Ordem de Produção (OP) na Omie. Método Omie: IncluirOrdemProducao. " +
      "Campos típicos: cCodIntOP, dDtPrevisao, nCodProduto, nQtde, identificacao, itens (insumos).",
    inputSchema: { param: paramSchema },
    resource: "produtos/op",
    call: "IncluirOrdemProducao",
    destructive: true,
  }),
  defineTool({
    name: "omie_op_alterar",
    description: "Altera uma Ordem de Produção existente. Método Omie: AlterarOrdemProducao.",
    inputSchema: { param: paramSchema },
    resource: "produtos/op",
    call: "AlterarOrdemProducao",
    destructive: true,
  }),
  defineTool({
    name: "omie_op_excluir",
    description: "Exclui uma Ordem de Produção. Método Omie: ExcluirOrdemProducao.",
    inputSchema: { param: paramSchema },
    resource: "produtos/op",
    call: "ExcluirOrdemProducao",
    destructive: true,
  }),
  defineTool({
    name: "omie_op_consultar",
    description:
      "Consulta uma Ordem de Produção específica (por código Omie ou código interno), com os " +
      "insumos utilizados. Método Omie: ConsultarOrdemProducao. O produto vem só como código " +
      "(nCodProduto) e a etapa como código cru (cEtapa) — para descrição/SKU do produto, use " +
      "omie_produtos_consultar ou omie_op_listar_com_produto.",
    inputSchema: { param: paramSchema },
    resource: "produtos/op",
    call: "ConsultarOrdemProducao",
  }),
  defineTool({
    name: "omie_op_listar",
    description:
      "Lista as Ordens de Produção cadastradas, com paginação e filtros. Método Omie: " +
      "ListarOrdemProducao. Devolve só o código do produto (nCodProduto, sem descrição/SKU) e a " +
      "etapa como código cru (cEtapa, configurável por conta, sem tradução via API). Para já vir " +
      "com a descrição do produto, use omie_op_listar_com_produto.",
    inputSchema: { param: paramSchema },
    resource: "produtos/op",
    call: "ListarOrdemProducao",
  }),
  defineTool({
    name: "omie_op_listar_com_produto",
    description:
      "Lista Ordens de Produção JÁ com a descrição/SKU do produto de cada OP (a Omie só devolve o " +
      "código do produto na listagem crua, sem descrição — esta ferramenta busca o cadastro de " +
      "cada produto envolvido e junta). Também expõe 'concluida' (true/false, campo confiável) " +
      "além do 'etapaCodigo' cru (a etapa do kanban é configurável por conta — de 3 a 6 fases com " +
      "nomes próprios — e a API não tem endpoint pra traduzir o código pro nome; se você souber o " +
      "significado das etapas dessa conta, pode interpretar etapaCodigo). Suporta paginação " +
      "(pagina/registros_por_pagina) e o filtro apenas_nao_concluidas.",
    inputSchema: { param: listarOpsComProdutoParamSchema },
    execute: async (client, param) => {
      const parsed = listarOpsComProdutoParamSchema.parse(param);
      const opGateway = criarOpGateway(client);
      const produtosGateway = criarProdutosGateway(client);
      const useCase = new ListarOpsComProdutoUseCase(opGateway, produtosGateway);
      return useCase.execute(parsed);
    },
  }),
];
