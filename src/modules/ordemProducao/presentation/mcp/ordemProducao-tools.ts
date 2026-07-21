import { ToolDef, paramSchema, defineTool } from "../../../../tools/types.js";
import { OmieClient } from "../../../../omieClient.js";
import { IProdutosGateway } from "../../../produtos/domain/interfaces/produtos-gateway.js";
import { ProdutosFakeGateway } from "../../../produtos/infrastructure/gateways/produtos-fake-gateway.js";
import { ProdutosOmieGateway } from "../../../produtos/infrastructure/gateways/produtos-omie-gateway.js";
import { listarOpsComProdutoParamSchema } from "../../application/dto/listar-ops-com-produto.dto.js";
import {
  alterarOPParamSchema,
  chaveOPParamSchema,
  incluirOPParamSchema,
} from "../../application/dto/op-crud.dto.js";
import { ListarOpsComProdutoUseCase } from "../../application/use-cases/listar-ops-com-produto.js";
import { IncluirOPUseCase } from "../../application/use-cases/incluir-op.js";
import { AlterarOPUseCase } from "../../application/use-cases/alterar-op.js";
import { ExcluirOPUseCase } from "../../application/use-cases/excluir-op.js";
import { ConsultarOPUseCase } from "../../application/use-cases/consultar-op.js";
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
      "Precisa de nCodProduto (o produto já precisa ter estrutura/BOM preenchida, senão a Omie " +
      "recusa — veja omie_estrutura_incluir), dDtPrevisao (dd/mm/aaaa) e nQtde. " +
      "codigo_local_estoque é opcional (padrão 0, testado ao vivo: a Omie exige o campo mesmo " +
      "assim, mesmo a doc pública marcando como opcional).",
    inputSchema: { param: incluirOPParamSchema },
    execute: async (client, param) => {
      const parsed = incluirOPParamSchema.parse(param);
      const useCase = new IncluirOPUseCase(criarOpGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_op_alterar",
    description:
      "Altera uma Ordem de Produção existente. Método Omie: AlterarOrdemProducao. Identifique " +
      "por nCodOP ou cCodIntOP e reenvie os dados (nCodProduto, dDtPrevisao, nQtde).",
    inputSchema: { param: alterarOPParamSchema },
    execute: async (client, param) => {
      const parsed = alterarOPParamSchema.parse(param);
      const useCase = new AlterarOPUseCase(criarOpGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_op_excluir",
    description:
      "Exclui uma Ordem de Produção. Método Omie: ExcluirOrdemProducao. Identifique por nCodOP " +
      "ou cCodIntOP.",
    inputSchema: { param: chaveOPParamSchema },
    execute: async (client, param) => {
      const parsed = chaveOPParamSchema.parse(param);
      const useCase = new ExcluirOPUseCase(criarOpGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_op_consultar",
    description:
      "Consulta uma Ordem de Produção específica (por código Omie ou código interno), com os " +
      "insumos utilizados. Método Omie: ConsultarOrdemProducao. O produto vem só como código " +
      "(nCodProduto) e a etapa como código cru (cEtapa) — para descrição/SKU do produto, use " +
      "omie_produtos_consultar ou omie_op_listar_com_produto.",
    inputSchema: { param: chaveOPParamSchema },
    execute: async (client, param) => {
      const parsed = chaveOPParamSchema.parse(param);
      const useCase = new ConsultarOPUseCase(criarOpGateway(client));
      return useCase.execute(parsed);
    },
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
      "(pagina/registros_por_pagina), o filtro apenas_nao_concluidas e o parâmetro genérico " +
      "'filtros' — lista de critérios (campo/operador/valor) aplicados sobre QUALQUER campo do " +
      "resultado já enriquecido (ex: descricaoProduto, codigoSku, quantidade), com operadores " +
      "igual/diferente/contem/maior_que/menor_que/entre. Ex: filtros: [{ campo: " +
      "'descricaoProduto', operador: 'contem', valor: '100kg' }].",
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
