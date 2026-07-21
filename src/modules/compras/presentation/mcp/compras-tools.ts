import { defineTool, ToolDef } from "../../../../tools/types.js";
import {
  alterarPedidoCompraParamSchema,
  consultarPedidoCompraParamSchema,
  excluirPedidoCompraParamSchema,
  incluirPedidoCompraParamSchema,
  listarPedidosCompraParamSchema,
} from "../../application/dto/pedido-compra.dto.js";
import {
  alterarRequisicaoCompraParamSchema,
  consultarRequisicaoCompraParamSchema,
  excluirRequisicaoCompraParamSchema,
  incluirRequisicaoCompraParamSchema,
  listarRequisicoesCompraParamSchema,
} from "../../application/dto/requisicao-compra.dto.js";
import {
  AlterarPedidoCompraUseCase,
  ConsultarPedidoCompraUseCase,
  ExcluirPedidoCompraUseCase,
  IncluirPedidoCompraUseCase,
  ListarPedidosCompraUseCase,
} from "../../application/use-cases/pedido-compra-crud.js";
import {
  AlterarRequisicaoCompraUseCase,
  ConsultarRequisicaoCompraUseCase,
  ExcluirRequisicaoCompraUseCase,
  IncluirRequisicaoCompraUseCase,
  ListarRequisicoesCompraUseCase,
} from "../../application/use-cases/requisicao-compra-crud.js";
import { criarPedidoCompraGateway, criarRequisicaoCompraGateway } from "../../infrastructure/gateways/compras-gateway-factory.js";

export const comprasTools: ToolDef[] = [
  defineTool({
    name: "omie_pedido_compra_incluir",
    description:
      "Cria um novo pedido de compra (fornecedor, itens, previsão de entrega). Método Omie: " +
      "IncluirPedCompra (recurso 'produtos/pedidocompra'). Testado ao vivo: 'codigo_conta_corrente' " +
      "(nCodCC) precisa ser um código de CONTA CORRENTE (ver omie_contas_correntes_listar) — apesar " +
      "do nome sugerir centro de custo/departamento, a Omie recusa código de departamento aqui.",
    inputSchema: { param: incluirPedidoCompraParamSchema },
    execute: async (client, param) => {
      const parsed = incluirPedidoCompraParamSchema.parse(param);
      const useCase = new IncluirPedidoCompraUseCase(criarPedidoCompraGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_pedido_compra_alterar",
    description:
      "Altera um pedido de compra já existente. Método Omie: AlteraPedCompra. Se 'itens' for " +
      "enviado, SUBSTITUI os itens atuais do pedido (não faz merge).",
    inputSchema: { param: alterarPedidoCompraParamSchema },
    execute: async (client, param) => {
      const parsed = alterarPedidoCompraParamSchema.parse(param);
      const useCase = new AlterarPedidoCompraUseCase(criarPedidoCompraGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_pedido_compra_excluir",
    description: "Remove um pedido de compra. Método Omie: ExcluirPedCompra.",
    inputSchema: { param: excluirPedidoCompraParamSchema },
    execute: async (client, param) => {
      const parsed = excluirPedidoCompraParamSchema.parse(param);
      const useCase = new ExcluirPedidoCompraUseCase(criarPedidoCompraGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_pedido_compra_consultar",
    description:
      "Busca os detalhes completos de um pedido de compra (itens, quantidade recebida, valores). " +
      "Método Omie: ConsultarPedCompra.",
    inputSchema: { param: consultarPedidoCompraParamSchema },
    execute: async (client, param) => {
      const parsed = consultarPedidoCompraParamSchema.parse(param);
      const useCase = new ConsultarPedidoCompraUseCase(criarPedidoCompraGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_pedido_compra_listar",
    description:
      "Lista os pedidos de compra cadastrados, com resumo (fornecedor, conta corrente, valor " +
      "total, quantidade de itens). Método Omie: PesquisarPedCompra. Suporta paginação e o " +
      "parâmetro genérico 'filtros'. Testado ao vivo: a Omie esconde pedidos por padrão nessa " +
      "listagem — o MCP já pede todas as situações (pendente/faturado/recebido/cancelado/" +
      "encerrado/parciais) pra sempre trazer tudo.",
    inputSchema: { param: listarPedidosCompraParamSchema },
    execute: async (client, param) => {
      const parsed = listarPedidosCompraParamSchema.parse(param);
      const useCase = new ListarPedidosCompraUseCase(criarPedidoCompraGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_requisicao_compra_incluir",
    description:
      "Solicita a compra de insumos para produção (requisição de compra). Método Omie: " +
      "IncluirReq (recurso 'produtos/requisicaocompra').",
    inputSchema: { param: incluirRequisicaoCompraParamSchema },
    execute: async (client, param) => {
      const parsed = incluirRequisicaoCompraParamSchema.parse(param);
      const useCase = new IncluirRequisicaoCompraUseCase(criarRequisicaoCompraGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_requisicao_compra_alterar",
    description:
      "Altera uma requisição de compra já existente. Método Omie: AlterarReq. Se 'itens' for " +
      "enviado, SUBSTITUI os itens atuais da requisição (não faz merge).",
    inputSchema: { param: alterarRequisicaoCompraParamSchema },
    execute: async (client, param) => {
      const parsed = alterarRequisicaoCompraParamSchema.parse(param);
      const useCase = new AlterarRequisicaoCompraUseCase(criarRequisicaoCompraGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_requisicao_compra_excluir",
    description: "Remove uma requisição de compra. Método Omie: ExcluirReq.",
    inputSchema: { param: excluirRequisicaoCompraParamSchema },
    execute: async (client, param) => {
      const parsed = excluirRequisicaoCompraParamSchema.parse(param);
      const useCase = new ExcluirRequisicaoCompraUseCase(criarRequisicaoCompraGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_requisicao_compra_consultar",
    description: "Busca os detalhes de uma requisição de compra específica. Método Omie: ConsultarReq.",
    inputSchema: { param: consultarRequisicaoCompraParamSchema },
    execute: async (client, param) => {
      const parsed = consultarRequisicaoCompraParamSchema.parse(param);
      const useCase = new ConsultarRequisicaoCompraUseCase(criarRequisicaoCompraGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_requisicao_compra_listar",
    description:
      "Lista as requisições de compra cadastradas. Método Omie: PesquisarReq. Suporta paginação " +
      "e o parâmetro genérico 'filtros'.",
    inputSchema: { param: listarRequisicoesCompraParamSchema },
    execute: async (client, param) => {
      const parsed = listarRequisicoesCompraParamSchema.parse(param);
      const useCase = new ListarRequisicoesCompraUseCase(criarRequisicaoCompraGateway(client));
      return useCase.execute(parsed);
    },
  }),
];
