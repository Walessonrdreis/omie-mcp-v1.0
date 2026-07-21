import { defineTool, ToolDef } from "../../../../tools/types.js";
import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import {
  alterarContaParamSchema,
  consultarContaParamSchema,
  excluirContaParamSchema,
  incluirContaParamSchema,
  listarContasParamSchema,
} from "../../application/dto/conta.dto.js";
import {
  alterarContatoParamSchema,
  consultarContatoParamSchema,
  excluirContatoParamSchema,
  incluirContatoParamSchema,
  listarContatosParamSchema,
} from "../../application/dto/contato.dto.js";
import {
  alterarOportunidadeParamSchema,
  consultarOportunidadeParamSchema,
  excluirOportunidadeParamSchema,
  incluirOportunidadeParamSchema,
  listarOportunidadesParamSchema,
} from "../../application/dto/oportunidade.dto.js";
import { listarCrmAuxiliarParamSchema } from "../../application/dto/crm-auxiliar.dto.js";
import {
  AlterarContaUseCase,
  ConsultarContaUseCase,
  ExcluirContaUseCase,
  IncluirContaUseCase,
  ListarContasUseCase,
} from "../../application/use-cases/conta-crud.js";
import {
  AlterarContatoUseCase,
  ConsultarContatoUseCase,
  ExcluirContatoUseCase,
  IncluirContatoUseCase,
  ListarContatosUseCase,
} from "../../application/use-cases/contato-crud.js";
import {
  AlterarOportunidadeUseCase,
  ConsultarOportunidadeUseCase,
  ExcluirOportunidadeUseCase,
  IncluirOportunidadeUseCase,
  ListarOportunidadesUseCase,
} from "../../application/use-cases/oportunidade-crud.js";
import { ListarFasesUseCase, ListarOrigensUseCase, ListarSolucoesUseCase } from "../../application/use-cases/crm-auxiliar.js";
import { IContaGateway } from "../../domain/interfaces/conta-gateway.js";
import { IContatoGateway } from "../../domain/interfaces/contato-gateway.js";
import { IOportunidadeGateway } from "../../domain/interfaces/oportunidade-gateway.js";
import { ICrmAuxiliarGateway } from "../../domain/interfaces/crm-auxiliar-gateway.js";
import { ContaFakeGateway } from "../../infrastructure/gateways/conta-fake-gateway.js";
import { ContaOmieGateway } from "../../infrastructure/gateways/conta-omie-gateway.js";
import { ContatoFakeGateway } from "../../infrastructure/gateways/contato-fake-gateway.js";
import { ContatoOmieGateway } from "../../infrastructure/gateways/contato-omie-gateway.js";
import { OportunidadeFakeGateway } from "../../infrastructure/gateways/oportunidade-fake-gateway.js";
import { OportunidadeOmieGateway } from "../../infrastructure/gateways/oportunidade-omie-gateway.js";
import { CrmAuxiliarFakeGateway } from "../../infrastructure/gateways/crm-auxiliar-fake-gateway.js";
import { CrmAuxiliarOmieGateway } from "../../infrastructure/gateways/crm-auxiliar-omie-gateway.js";

const mock = () => process.env.OMIE_MOCK === "true";
function criarContaGateway(client: OmieClient): IContaGateway {
  return mock() ? new ContaFakeGateway() : new ContaOmieGateway(client);
}
function criarContatoGateway(client: OmieClient): IContatoGateway {
  return mock() ? new ContatoFakeGateway() : new ContatoOmieGateway(client);
}
function criarOportunidadeGateway(client: OmieClient): IOportunidadeGateway {
  return mock() ? new OportunidadeFakeGateway() : new OportunidadeOmieGateway(client);
}
function criarCrmAuxiliarGateway(client: OmieClient): ICrmAuxiliarGateway {
  return mock() ? new CrmAuxiliarFakeGateway() : new CrmAuxiliarOmieGateway(client);
}

export const crmTools: ToolDef[] = [
  defineTool({
    name: "omie_crm_conta_incluir",
    description:
      "Cria uma nova Conta no CRM (empresa/pessoa no funil de vendas — diferente do cadastro de " +
      "Cliente/Fornecedor). Método Omie: IncluirConta (recurso 'crm/contas'). Testado ao vivo: " +
      "os blocos de endereço (uf/cidade) e email são exigidos, mesmo com poucos campos.",
    inputSchema: { param: incluirContaParamSchema },
    execute: async (client, param) => {
      const parsed = incluirContaParamSchema.parse(param);
      const useCase = new IncluirContaUseCase(criarContaGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_crm_conta_alterar",
    description: "Altera uma Conta do CRM já existente. Método Omie: AlterarConta.",
    inputSchema: { param: alterarContaParamSchema },
    execute: async (client, param) => {
      const parsed = alterarContaParamSchema.parse(param);
      const useCase = new AlterarContaUseCase(criarContaGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_crm_conta_excluir",
    description: "Remove uma Conta do CRM. Método Omie: ExcluirConta.",
    inputSchema: { param: excluirContaParamSchema },
    execute: async (client, param) => {
      const parsed = excluirContaParamSchema.parse(param);
      const useCase = new ExcluirContaUseCase(criarContaGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_crm_conta_consultar",
    description: "Busca os detalhes de uma Conta do CRM. Método Omie: ConsultarConta.",
    inputSchema: { param: consultarContaParamSchema },
    execute: async (client, param) => {
      const parsed = consultarContaParamSchema.parse(param);
      const useCase = new ConsultarContaUseCase(criarContaGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_crm_conta_listar",
    description: "Lista as Contas do CRM. Método Omie: ListarContas. Suporta paginação e o parâmetro genérico 'filtros'.",
    inputSchema: { param: listarContasParamSchema },
    execute: async (client, param) => {
      const parsed = listarContasParamSchema.parse(param);
      const useCase = new ListarContasUseCase(criarContaGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_crm_contato_incluir",
    description:
      "Cria um novo Contato do CRM, vinculado a uma Conta. Método Omie: IncluirContato (recurso " +
      "'crm/contatos').",
    inputSchema: { param: incluirContatoParamSchema },
    execute: async (client, param) => {
      const parsed = incluirContatoParamSchema.parse(param);
      const useCase = new IncluirContatoUseCase(criarContatoGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_crm_contato_alterar",
    description: "Altera um Contato do CRM já existente. Método Omie: AlterarContato.",
    inputSchema: { param: alterarContatoParamSchema },
    execute: async (client, param) => {
      const parsed = alterarContatoParamSchema.parse(param);
      const useCase = new AlterarContatoUseCase(criarContatoGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_crm_contato_excluir",
    description: "Remove um Contato do CRM. Método Omie: ExcluirContato.",
    inputSchema: { param: excluirContatoParamSchema },
    execute: async (client, param) => {
      const parsed = excluirContatoParamSchema.parse(param);
      const useCase = new ExcluirContatoUseCase(criarContatoGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_crm_contato_consultar",
    description: "Busca os detalhes de um Contato do CRM. Método Omie: ConsultarContato.",
    inputSchema: { param: consultarContatoParamSchema },
    execute: async (client, param) => {
      const parsed = consultarContatoParamSchema.parse(param);
      const useCase = new ConsultarContatoUseCase(criarContatoGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_crm_contato_listar",
    description: "Lista os Contatos do CRM. Método Omie: ListarContatos. Suporta paginação e o parâmetro genérico 'filtros'.",
    inputSchema: { param: listarContatosParamSchema },
    execute: async (client, param) => {
      const parsed = listarContatosParamSchema.parse(param);
      const useCase = new ListarContatosUseCase(criarContatoGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_crm_oportunidade_incluir",
    description:
      "Cria uma nova Oportunidade no funil de vendas do CRM. Método Omie: IncluirOportunidade " +
      "(recurso 'crm/oportunidades'). Exige conta e contato já cadastrados, mais " +
      "'codigo_solucao' (ver omie_crm_solucoes_listar) e 'codigo_origem' (ver " +
      "omie_crm_origens_listar) — testado ao vivo, ambos obrigatórios mesmo não estando claro " +
      "assim na doc pública.",
    inputSchema: { param: incluirOportunidadeParamSchema },
    execute: async (client, param) => {
      const parsed = incluirOportunidadeParamSchema.parse(param);
      const useCase = new IncluirOportunidadeUseCase(criarOportunidadeGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_crm_oportunidade_alterar",
    description: "Altera uma Oportunidade já existente. Método Omie: AlterarOportunidade.",
    inputSchema: { param: alterarOportunidadeParamSchema },
    execute: async (client, param) => {
      const parsed = alterarOportunidadeParamSchema.parse(param);
      const useCase = new AlterarOportunidadeUseCase(criarOportunidadeGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_crm_oportunidade_excluir",
    description: "Remove uma Oportunidade do CRM. Método Omie: ExcluirOportunidade.",
    inputSchema: { param: excluirOportunidadeParamSchema },
    execute: async (client, param) => {
      const parsed = excluirOportunidadeParamSchema.parse(param);
      const useCase = new ExcluirOportunidadeUseCase(criarOportunidadeGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_crm_oportunidade_consultar",
    description: "Busca os detalhes de uma Oportunidade do CRM. Método Omie: ConsultarOportunidade.",
    inputSchema: { param: consultarOportunidadeParamSchema },
    execute: async (client, param) => {
      const parsed = consultarOportunidadeParamSchema.parse(param);
      const useCase = new ConsultarOportunidadeUseCase(criarOportunidadeGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_crm_oportunidade_listar",
    description:
      "Lista as Oportunidades do funil de vendas do CRM. Método Omie: ListarOportunidades. " +
      "Suporta paginação e o parâmetro genérico 'filtros'.",
    inputSchema: { param: listarOportunidadesParamSchema },
    execute: async (client, param) => {
      const parsed = listarOportunidadesParamSchema.parse(param);
      const useCase = new ListarOportunidadesUseCase(criarOportunidadeGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_crm_fases_listar",
    description:
      "Lista as fases do funil de vendas do CRM (ex: '01 Prospect'). Método Omie: ListarFases " +
      "(recurso 'crm/fases').",
    inputSchema: { param: listarCrmAuxiliarParamSchema },
    execute: async (client, param) => {
      const parsed = listarCrmAuxiliarParamSchema.parse(param);
      const useCase = new ListarFasesUseCase(criarCrmAuxiliarGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_crm_solucoes_listar",
    description:
      "Lista as soluções/produtos cadastrados no CRM, usadas no campo 'codigo_solucao' de " +
      "omie_crm_oportunidade_incluir. Método Omie: ListarSolucoes (recurso 'crm/solucoes').",
    inputSchema: { param: listarCrmAuxiliarParamSchema },
    execute: async (client, param) => {
      const parsed = listarCrmAuxiliarParamSchema.parse(param);
      const useCase = new ListarSolucoesUseCase(criarCrmAuxiliarGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_crm_origens_listar",
    description:
      "Lista as origens de lead cadastradas no CRM, usadas no campo 'codigo_origem' de " +
      "omie_crm_oportunidade_incluir. Método Omie: ListarOrigens (recurso 'crm/origens').",
    inputSchema: { param: listarCrmAuxiliarParamSchema },
    execute: async (client, param) => {
      const parsed = listarCrmAuxiliarParamSchema.parse(param);
      const useCase = new ListarOrigensUseCase(criarCrmAuxiliarGateway(client));
      return useCase.execute(parsed);
    },
  }),
];
