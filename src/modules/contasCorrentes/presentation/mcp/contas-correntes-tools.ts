import { ToolDef, paramSchema, defineTool } from "../../../../tools/types.js";
import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import { consultarExtratoParamSchema } from "../../application/dto/extrato.dto.js";
import { ConsultarExtratoUseCase } from "../../application/use-cases/consultar-extrato.js";
import { IContasCorrentesGateway } from "../../domain/interfaces/contas-correntes-gateway.js";
import { ContasCorrentesFakeGateway } from "../../infrastructure/gateways/contas-correntes-fake-gateway.js";
import { ContasCorrentesOmieGateway } from "../../infrastructure/gateways/contas-correntes-omie-gateway.js";

function criarContasCorrentesGateway(client: OmieClient): IContasCorrentesGateway {
  return process.env.OMIE_MOCK === "true"
    ? new ContasCorrentesFakeGateway()
    : new ContasCorrentesOmieGateway(client);
}

export const contasCorrentesTools: ToolDef[] = [
  defineTool({
    name: "omie_contas_correntes_listar",
    description:
      "Lista as contas correntes cadastradas (bancos, caixas, cartões, maquininhas), com código, " +
      "descrição, banco, tipo e saldo inicial registrado. Método Omie: ListarContasCorrentes " +
      "(recurso 'geral/contacorrente').",
    inputSchema: { param: paramSchema },
    resource: "geral/contacorrente",
    call: "ListarContasCorrentes",
  }),
  defineTool({
    name: "omie_extrato_conta_corrente_consultar",
    description:
      "Consulta o extrato de uma conta corrente num período: movimentos (data, descrição, valor, " +
      "categoria, situação — conciliado ou não) e saldos (anterior, atual, conciliado, " +
      "disponível). Método Omie: ListarExtrato (recurso 'financas/extrato'). Suporta o parâmetro " +
      "genérico 'filtros' sobre os movimentos (ex: natureza, categoria, situacao).",
    inputSchema: { param: consultarExtratoParamSchema },
    execute: async (client, param) => {
      const parsed = consultarExtratoParamSchema.parse(param);
      const useCase = new ConsultarExtratoUseCase(criarContasCorrentesGateway(client));
      return useCase.execute(parsed);
    },
  }),
];
