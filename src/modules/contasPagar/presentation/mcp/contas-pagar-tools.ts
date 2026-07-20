import { ToolDef, defineTool } from "../../../../tools/types.js";
import { listarContasPagarParamSchema } from "../../application/dto/listar-contas-pagar.dto.js";
import { ListarContasPagarUseCase } from "../../application/use-cases/listar-contas-pagar.js";
import { ContasPagarOmieGateway } from "../../infrastructure/gateways/contas-pagar-omie-gateway.js";
import { ClientesOmieGateway } from "../../../clientesFornecedores/infrastructure/gateways/clientes-omie-gateway.js";

export const contasPagarTools: ToolDef[] = [
  defineTool({
    name: "omie_contas_pagar_listar",
    description:
      "Lista as contas a pagar JÁ com o nome do fornecedor resolvido (a Omie só devolve " +
      "o código do fornecedor). Retorna: fornecedor (razão social), valor, data de " +
      "vencimento, status (PAGO/ABERTO/VENCIDO), documento fiscal, categoria e observação. " +
      "Suporta paginação. Use em vez de omie_chamar_api para ter os dados legíveis.",
    inputSchema: { param: listarContasPagarParamSchema },
    execute: async (client, param) => {
      const parsed = listarContasPagarParamSchema.parse(param);
      const contasGateway = new ContasPagarOmieGateway(client);
      const clientesGateway = new ClientesOmieGateway(client);
      const useCase = new ListarContasPagarUseCase(contasGateway, clientesGateway);
      return useCase.execute(parsed);
    },
  }),
];