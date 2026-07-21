import { defineTool, ToolDef } from "../../../../tools/types.js";
import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import {
  consultarUnidadeParamSchema,
  listarBancosParamSchema,
  listarCidadesParamSchema,
  listarNCMParamSchema,
  listarPaisesParamSchema,
} from "../../application/dto/cadastros-auxiliares.dto.js";
import {
  ConsultarUnidadeUseCase,
  ListarBancosUseCase,
  ListarCidadesUseCase,
  ListarNCMUseCase,
  ListarPaisesUseCase,
} from "../../application/use-cases/cadastros-auxiliares.js";
import { ICadastrosAuxiliaresGateway } from "../../domain/interfaces/cadastros-auxiliares-gateway.js";
import { CadastrosAuxiliaresFakeGateway } from "../../infrastructure/gateways/cadastros-auxiliares-fake-gateway.js";
import { CadastrosAuxiliaresOmieGateway } from "../../infrastructure/gateways/cadastros-auxiliares-omie-gateway.js";

function criarGateway(client: OmieClient): ICadastrosAuxiliaresGateway {
  return process.env.OMIE_MOCK === "true"
    ? new CadastrosAuxiliaresFakeGateway()
    : new CadastrosAuxiliaresOmieGateway(client);
}

export const cadastrosAuxiliaresTools: ToolDef[] = [
  defineTool({
    name: "omie_bancos_listar",
    description:
      "Lista os bancos cadastrados na Omie (tabela oficial do Bacen, 1233 registros). Método " +
      "Omie: ListarBancos (recurso 'geral/bancos'). Suporta paginação, filtro nativo por nome, e " +
      "o parâmetro genérico 'filtros'.",
    inputSchema: { param: listarBancosParamSchema },
    execute: async (client, param) => {
      const parsed = listarBancosParamSchema.parse(param);
      const useCase = new ListarBancosUseCase(criarGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_cidades_listar",
    description:
      "Lista/pesquisa cidades brasileiras (tabela IBGE, 5734 registros). Método Omie: " +
      "PesquisarCidades (recurso 'geral/cidades'). Suporta paginação, filtro nativo por UF e por " +
      "nome (contém), e o parâmetro genérico 'filtros'.",
    inputSchema: { param: listarCidadesParamSchema },
    execute: async (client, param) => {
      const parsed = listarCidadesParamSchema.parse(param);
      const useCase = new ListarCidadesUseCase(criarGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_paises_listar",
    description:
      "Lista países (tabela com código ISO). Método Omie: ListarPaises (recurso 'geral/paises'). " +
      "Sem paginação (lista inteira, ~250 países); suporta filtro nativo por código ISO/descrição " +
      "e o parâmetro genérico 'filtros'.",
    inputSchema: { param: listarPaisesParamSchema },
    execute: async (client, param) => {
      const parsed = listarPaisesParamSchema.parse(param);
      const useCase = new ListarPaisesUseCase(criarGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_ncm_listar",
    description:
      "Lista/pesquisa códigos NCM (tabela oficial da Receita Federal, ~14 mil registros). Método " +
      "Omie: ListarNCM (recurso 'produtos/ncm'). Suporta paginação, filtro nativo por código " +
      "(prefixo) e descrição, e o parâmetro genérico 'filtros'.",
    inputSchema: { param: listarNCMParamSchema },
    execute: async (client, param) => {
      const parsed = listarNCMParamSchema.parse(param);
      const useCase = new ListarNCMUseCase(criarGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_unidade_consultar",
    description:
      "Consulta a descrição de uma unidade de medida pelo código (ex: 'UN', 'KG', 'CX'). Método " +
      "Omie: ListarUnidades (recurso 'geral/unidade'). Testado ao vivo: diferente das demais " +
      "listagens, este endpoint exige o código exato (não pagina/lista tudo).",
    inputSchema: { param: consultarUnidadeParamSchema },
    execute: async (client, param) => {
      const parsed = consultarUnidadeParamSchema.parse(param);
      const useCase = new ConsultarUnidadeUseCase(criarGateway(client));
      return useCase.execute(parsed);
    },
  }),
];
