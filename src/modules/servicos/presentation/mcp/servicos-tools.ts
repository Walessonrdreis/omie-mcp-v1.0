import { defineTool, ToolDef } from "../../../../tools/types.js";
import { OmieClient } from "../../../../omieClient.js";
import {
  alterarServicoParamSchema,
  consultarServicoParamSchema,
  excluirServicoParamSchema,
  incluirServicoParamSchema,
  listarServicosParamSchema,
} from "../../application/dto/servico.dto.js";
import {
  alterarOSParamSchema,
  consultarOSParamSchema,
  excluirOSParamSchema,
  incluirOSParamSchema,
  listarOSParamSchema,
} from "../../application/dto/ordem-servico.dto.js";
import { listarLC116ParamSchema, listarNFSeParamSchema } from "../../application/dto/nfse.dto.js";
import {
  AlterarServicoUseCase,
  ConsultarServicoUseCase,
  ExcluirServicoUseCase,
  IncluirServicoUseCase,
  ListarServicosUseCase,
} from "../../application/use-cases/servico-crud.js";
import {
  AlterarOSUseCase,
  ConsultarOSUseCase,
  ExcluirOSUseCase,
  IncluirOSUseCase,
  ListarOSUseCase,
} from "../../application/use-cases/ordem-servico-crud.js";
import { ListarLC116UseCase, ListarNFSeUseCase } from "../../application/use-cases/nfse-lc116.js";
import { IServicoGateway } from "../../domain/interfaces/servico-gateway.js";
import { IOrdemServicoGateway } from "../../domain/interfaces/ordem-servico-gateway.js";
import { INfseGateway } from "../../domain/interfaces/nfse-gateway.js";
import { ServicoFakeGateway } from "../../infrastructure/gateways/servico-fake-gateway.js";
import { ServicoOmieGateway } from "../../infrastructure/gateways/servico-omie-gateway.js";
import { OrdemServicoFakeGateway } from "../../infrastructure/gateways/ordem-servico-fake-gateway.js";
import { OrdemServicoOmieGateway } from "../../infrastructure/gateways/ordem-servico-omie-gateway.js";
import { NfseFakeGateway } from "../../infrastructure/gateways/nfse-fake-gateway.js";
import { NfseOmieGateway } from "../../infrastructure/gateways/nfse-omie-gateway.js";

function criarServicoGateway(client: OmieClient): IServicoGateway {
  return process.env.OMIE_MOCK === "true" ? new ServicoFakeGateway() : new ServicoOmieGateway(client);
}

function criarOrdemServicoGateway(client: OmieClient): IOrdemServicoGateway {
  return process.env.OMIE_MOCK === "true"
    ? new OrdemServicoFakeGateway()
    : new OrdemServicoOmieGateway(client);
}

function criarNfseGateway(client: OmieClient): INfseGateway {
  return process.env.OMIE_MOCK === "true" ? new NfseFakeGateway() : new NfseOmieGateway(client);
}

export const servicosTools: ToolDef[] = [
  defineTool({
    name: "omie_servico_incluir",
    description:
      "Cadastra um novo serviço prestado pela empresa (cadastro, não é uma venda/OS). Método " +
      "Omie: IncluirCadastroServico (recurso 'servicos/servico').",
    inputSchema: { param: incluirServicoParamSchema },
    execute: async (client, param) => {
      const parsed = incluirServicoParamSchema.parse(param);
      const useCase = new IncluirServicoUseCase(criarServicoGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_servico_alterar",
    description: "Altera um serviço já cadastrado. Método Omie: AlterarCadastroServico.",
    inputSchema: { param: alterarServicoParamSchema },
    execute: async (client, param) => {
      const parsed = alterarServicoParamSchema.parse(param);
      const useCase = new AlterarServicoUseCase(criarServicoGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_servico_excluir",
    description: "Remove um serviço do cadastro. Método Omie: ExcluirCadastroServico.",
    inputSchema: { param: excluirServicoParamSchema },
    execute: async (client, param) => {
      const parsed = excluirServicoParamSchema.parse(param);
      const useCase = new ExcluirServicoUseCase(criarServicoGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_servico_consultar",
    description: "Busca os detalhes de um serviço cadastrado. Método Omie: ConsultarCadastroServico.",
    inputSchema: { param: consultarServicoParamSchema },
    execute: async (client, param) => {
      const parsed = consultarServicoParamSchema.parse(param);
      const useCase = new ConsultarServicoUseCase(criarServicoGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_servico_listar",
    description:
      "Lista os serviços cadastrados. Método Omie: ListarCadastroServico. Suporta paginação e o " +
      "parâmetro genérico 'filtros'.",
    inputSchema: { param: listarServicosParamSchema },
    execute: async (client, param) => {
      const parsed = listarServicosParamSchema.parse(param);
      const useCase = new ListarServicosUseCase(criarServicoGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_os_incluir",
    description:
      "Cria uma nova Ordem de Serviço (venda de serviço para um cliente). Método Omie: IncluirOS " +
      "(recurso 'servicos/os'). Cada item precisa de 'codigo_servico_municipal' e " +
      "'codigo_servico_lc116' — use omie_servicos_lc116_listar pra achar um código válido (ex: " +
      "'1.01' = Análise e Desenvolvimento de Sistemas). Testado ao vivo: esses códigos precisam " +
      "ser um código já cadastrado na tabela LC116, texto livre é recusado.",
    inputSchema: { param: incluirOSParamSchema },
    execute: async (client, param) => {
      const parsed = incluirOSParamSchema.parse(param);
      const useCase = new IncluirOSUseCase(criarOrdemServicoGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_os_alterar",
    description: "Altera uma Ordem de Serviço já existente (data prevista, etapa). Método Omie: AlterarOS.",
    inputSchema: { param: alterarOSParamSchema },
    execute: async (client, param) => {
      const parsed = alterarOSParamSchema.parse(param);
      const useCase = new AlterarOSUseCase(criarOrdemServicoGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_os_excluir",
    description: "Remove uma Ordem de Serviço. Método Omie: ExcluirOS.",
    inputSchema: { param: excluirOSParamSchema },
    execute: async (client, param) => {
      const parsed = excluirOSParamSchema.parse(param);
      const useCase = new ExcluirOSUseCase(criarOrdemServicoGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_os_consultar",
    description: "Busca os detalhes de uma Ordem de Serviço (itens, valores, se faturada/cancelada). Método Omie: ConsultarOS.",
    inputSchema: { param: consultarOSParamSchema },
    execute: async (client, param) => {
      const parsed = consultarOSParamSchema.parse(param);
      const useCase = new ConsultarOSUseCase(criarOrdemServicoGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_os_listar",
    description:
      "Lista as Ordens de Serviço cadastradas. Método Omie: ListarOS. Suporta paginação e o " +
      "parâmetro genérico 'filtros'.",
    inputSchema: { param: listarOSParamSchema },
    execute: async (client, param) => {
      const parsed = listarOSParamSchema.parse(param);
      const useCase = new ListarOSUseCase(criarOrdemServicoGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_nfse_listar",
    description:
      "Lista as NFS-e (nota fiscal de serviço) já emitidas. Método Omie: ListarNFSEs (recurso " +
      "'servicos/nfse'). SOMENTE LEITURA — não emite NFS-e (mesma cautela do módulo NF-e de " +
      "produto: documento fiscal com efeito legal). Suporta paginação, filtro por período de " +
      "emissão e o parâmetro genérico 'filtros'.",
    inputSchema: { param: listarNFSeParamSchema },
    execute: async (client, param) => {
      const parsed = listarNFSeParamSchema.parse(param);
      const useCase = new ListarNFSeUseCase(criarNfseGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_servicos_lc116_listar",
    description:
      "Lista os códigos válidos da Lei Complementar 116 (classificação de serviços), usados nos " +
      "campos 'codigo_servico_lc116'/'codigo_servico_municipal' de omie_os_incluir. Método Omie: " +
      "ListarLC116 (recurso 'servicos/lc116'). Use o parâmetro genérico 'filtros' pra buscar por " +
      "descrição (ex: filtro 'contem' em 'descricao').",
    inputSchema: { param: listarLC116ParamSchema },
    execute: async (client, param) => {
      const parsed = listarLC116ParamSchema.parse(param);
      const useCase = new ListarLC116UseCase(criarNfseGateway(client));
      return useCase.execute(parsed);
    },
  }),
];
