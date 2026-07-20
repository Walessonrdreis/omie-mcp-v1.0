import { ToolDef, defineTool } from "../../../../tools/types.js";
import { listarContasReceberParamSchema } from "../../application/dto/listar-contas-receber.dto.js";
import { ListarContasReceberUseCase } from "../../application/use-cases/listar-contas-receber.js";
import { ContasReceberOmieGateway } from "../../infrastructure/gateways/contas-receber-omie-gateway.js";
import { ClientesOmieGateway } from "../../../clientesFornecedores/infrastructure/gateways/clientes-omie-gateway.js";

export const contasReceberTools: ToolDef[] = [
  defineTool({
    name: "omie_contas_receber_listar",
    description:
      "Lista as contas a receber JÁ com o nome do cliente resolvido (a Omie só devolve " +
      "o código do cliente). Retorna: cliente (razão social), valor, data de " +
      "vencimento, status (PAGO/ABERTO/VENCIDO), documento fiscal, número do pedido " +
      "e categoria. Suporta paginação. Use em vez de omie_chamar_api para ter os dados legíveis.",
    inputSchema: { param: listarContasReceberParamSchema },
    execute: async (client, param) => {
      const parsed = listarContasReceberParamSchema.parse(param);
      const contasGateway = new ContasReceberOmieGateway(client);
      const clientesGateway = new ClientesOmieGateway(client);
      const useCase = new ListarContasReceberUseCase(contasGateway, clientesGateway);
      return useCase.execute(parsed);
    },
  }),
];