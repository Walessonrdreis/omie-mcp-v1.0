import { defineTool, ToolDef } from "../../../../tools/types.js";
import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import {
  cancelarPixParamSchema,
  codigoTituloPixParamSchema,
  gerarPixParamSchema,
  listarPixParamSchema,
} from "../../application/dto/pix.dto.js";
import {
  CancelarPixUseCase,
  GerarPixUseCase,
  ListarPixUseCase,
  ObterPixUseCase,
  ObterStatusPixUseCase,
} from "../../application/use-cases/pix-crud.js";
import { IPixGateway } from "../../domain/interfaces/pix-gateway.js";
import { PixFakeGateway } from "../../infrastructure/gateways/pix-fake-gateway.js";
import { PixOmieGateway } from "../../infrastructure/gateways/pix-omie-gateway.js";

function criarPixGateway(client: OmieClient): IPixGateway {
  return process.env.OMIE_MOCK === "true" ? new PixFakeGateway() : new PixOmieGateway(client);
}

export const pixTools: ToolDef[] = [
  defineTool({
    name: "omie_pix_listar",
    description:
      "Lista os PIX gerados para títulos de contas a receber, com resumo (título, valor, " +
      "emissão, vencimento, status). Método Omie: ListarPix (recurso 'financas/pix'). Suporta " +
      "paginação, filtro por período de emissão/status e o parâmetro genérico 'filtros'.",
    inputSchema: { param: listarPixParamSchema },
    execute: async (client, param) => {
      const parsed = listarPixParamSchema.parse(param);
      const useCase = new ListarPixUseCase(criarPixGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_pix_obter",
    description:
      "Busca o PIX (QR Code, copia-e-cola, status) de um título de contas a receber. Método " +
      "Omie: ObterPix.",
    inputSchema: { param: codigoTituloPixParamSchema },
    execute: async (client, param) => {
      const parsed = codigoTituloPixParamSchema.parse(param);
      const useCase = new ObterPixUseCase(criarPixGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_pix_obter_status",
    description: "Consulta rapidamente só o status de pagamento de um PIX. Método Omie: ObterStatusPix.",
    inputSchema: { param: codigoTituloPixParamSchema },
    execute: async (client, param) => {
      const parsed = codigoTituloPixParamSchema.parse(param);
      const useCase = new ObterStatusPixUseCase(criarPixGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_pix_gerar",
    description:
      "Gera um PIX (QR Code + copia-e-cola) para cobrar um título de contas a receber. Método " +
      "Omie: GerarPix (recurso 'financas/pix').",
    inputSchema: { param: gerarPixParamSchema },
    execute: async (client, param) => {
      const parsed = gerarPixParamSchema.parse(param);
      const useCase = new GerarPixUseCase(criarPixGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_pix_cancelar",
    description: "Cancela um PIX gerado (ainda não pago). Método Omie: CancelarPix.",
    inputSchema: { param: cancelarPixParamSchema },
    execute: async (client, param) => {
      const parsed = cancelarPixParamSchema.parse(param);
      const useCase = new CancelarPixUseCase(criarPixGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
];
