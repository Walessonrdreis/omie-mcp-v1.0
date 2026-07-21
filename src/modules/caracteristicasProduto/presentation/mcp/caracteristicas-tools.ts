import { defineTool, ToolDef } from "../../../../tools/types.js";
import {
  alterarCaracteristicaParamSchema,
  consultarCaracteristicaParamSchema,
  excluirCaracteristicaParamSchema,
  incluirCaracteristicaParamSchema,
  listarCaracteristicasParamSchema,
} from "../../application/dto/caracteristica.dto.js";
import {
  AlterarCaracteristicaUseCase,
  ConsultarCaracteristicaUseCase,
  ExcluirCaracteristicaUseCase,
  IncluirCaracteristicaUseCase,
  ListarCaracteristicasUseCase,
} from "../../application/use-cases/caracteristica-crud.js";
import { criarGateway } from "../../infrastructure/gateways/caracteristica-gateway-factory.js";

export const caracteristicasTools: ToolDef[] = [
  defineTool({
    name: "omie_caracteristica_incluir",
    description:
      "Cria uma nova característica reutilizável de produto (ex: 'Cor', 'Tamanho'), que depois " +
      "pode ser associada a produtos. Método Omie: IncluirCaracteristica (recurso " +
      "'geral/caracteristicas').",
    inputSchema: { param: incluirCaracteristicaParamSchema },
    execute: async (client, param) => {
      const parsed = incluirCaracteristicaParamSchema.parse(param);
      const useCase = new IncluirCaracteristicaUseCase(criarGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_caracteristica_alterar",
    description: "Altera uma característica de produto já existente. Método Omie: AlterarCaracteristica.",
    inputSchema: { param: alterarCaracteristicaParamSchema },
    execute: async (client, param) => {
      const parsed = alterarCaracteristicaParamSchema.parse(param);
      const useCase = new AlterarCaracteristicaUseCase(criarGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_caracteristica_excluir",
    description:
      "Remove uma característica de produto. Método Omie: ExcluirCaracteristica. Testado ao " +
      "vivo: exclusão funciona de verdade, sem deixar rastro.",
    inputSchema: { param: excluirCaracteristicaParamSchema },
    execute: async (client, param) => {
      const parsed = excluirCaracteristicaParamSchema.parse(param);
      const useCase = new ExcluirCaracteristicaUseCase(criarGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_caracteristica_consultar",
    description: "Busca os detalhes de uma característica de produto. Método Omie: ConsultarCaracteristica.",
    inputSchema: { param: consultarCaracteristicaParamSchema },
    execute: async (client, param) => {
      const parsed = consultarCaracteristicaParamSchema.parse(param);
      const useCase = new ConsultarCaracteristicaUseCase(criarGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_caracteristica_listar",
    description:
      "Lista as características de produto cadastradas. Método Omie: ListarCaracteristicas. " +
      "Suporta paginação e o parâmetro genérico 'filtros'.",
    inputSchema: { param: listarCaracteristicasParamSchema },
    execute: async (client, param) => {
      const parsed = listarCaracteristicasParamSchema.parse(param);
      const useCase = new ListarCaracteristicasUseCase(criarGateway(client));
      return useCase.execute(parsed);
    },
  }),
];
