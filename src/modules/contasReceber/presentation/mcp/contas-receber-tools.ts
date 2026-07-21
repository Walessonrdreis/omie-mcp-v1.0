import { ToolDef, defineTool } from "../../../../tools/types.js";
import { listarContasReceberParamSchema } from "../../application/dto/listar-contas-receber.dto.js";
import {
  codigoTituloParamSchema,
  prorrogarBoletoParamSchema,
} from "../../application/dto/boleto.dto.js";
import { ListarContasReceberUseCase } from "../../application/use-cases/listar-contas-receber.js";
import {
  CancelarBoletoUseCase,
  GerarBoletoUseCase,
  ObterBoletoUseCase,
  ProrrogarBoletoUseCase,
} from "../../application/use-cases/boleto-crud.js";
import { criarContasReceberGateway, criarClientesGateway } from "../../infrastructure/gateways/contas-receber-gateway-factory.js";

export const contasReceberTools: ToolDef[] = [
  defineTool({
    name: "omie_contas_receber_listar",
    description:
      "Lista as contas a receber JÁ com o nome do cliente resolvido (a Omie só devolve " +
      "o código do cliente). Retorna: cliente (razão social), valor, data de " +
      "vencimento, status (PAGO/ABERTO/VENCIDO), documento fiscal, número do pedido " +
      "e categoria. Suporta paginação e filtro por data_alteracao_de/ate (data de última " +
      "alteração do lançamento, não vencimento — útil pra achar lançamentos recentes). " +
      "Use em vez de omie_chamar_api para ter os dados legíveis.",
    inputSchema: { param: listarContasReceberParamSchema },
    execute: async (client, param) => {
      const parsed = listarContasReceberParamSchema.parse(param);
      const contasGateway = criarContasReceberGateway(client);
      const clientesGateway = criarClientesGateway(client);
      const useCase = new ListarContasReceberUseCase(contasGateway, clientesGateway);
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_contas_receber_boleto_gerar",
    description:
      "Gera o boleto de um título de contas a receber. Método Omie: GerarBoleto (recurso " +
      "'financas/contareceberboleto'). Requer que a conta Omie tenha convênio bancário/boleto " +
      "configurado — sem isso a Omie recusa com erro (ex: 'Não temos suporte para geração da " +
      "remessa de pagamento para o banco -sem instituição-', testado ao vivo nesta conta).",
    inputSchema: { param: codigoTituloParamSchema },
    execute: async (client, param) => {
      const parsed = codigoTituloParamSchema.parse(param);
      const useCase = new GerarBoletoUseCase(criarContasReceberGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_contas_receber_boleto_obter",
    description:
      "Busca o link/dados do boleto já gerado de um título (ou avisa que nenhum foi gerado). " +
      "Método Omie: ObterBoleto.",
    inputSchema: { param: codigoTituloParamSchema },
    execute: async (client, param) => {
      const parsed = codigoTituloParamSchema.parse(param);
      const useCase = new ObterBoletoUseCase(criarContasReceberGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_contas_receber_boleto_prorrogar",
    description: "Prorroga (adia) a data de vencimento de um boleto já gerado. Método Omie: ProrrogarBoleto.",
    inputSchema: { param: prorrogarBoletoParamSchema },
    execute: async (client, param) => {
      const parsed = prorrogarBoletoParamSchema.parse(param);
      const useCase = new ProrrogarBoletoUseCase(criarContasReceberGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_contas_receber_boleto_cancelar",
    description: "Cancela o boleto gerado de um título. Método Omie: CancelarBoleto.",
    inputSchema: { param: codigoTituloParamSchema },
    execute: async (client, param) => {
      const parsed = codigoTituloParamSchema.parse(param);
      const useCase = new CancelarBoletoUseCase(criarContasReceberGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
];