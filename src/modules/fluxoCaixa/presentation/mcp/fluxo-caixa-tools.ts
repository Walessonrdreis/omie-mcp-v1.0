import { ToolDef, defineTool } from "../../../../tools/types.js";
import { gerarFluxoCaixaParamSchema } from "../../application/dto/gerar-fluxo-caixa.dto.js";
import { GerarFluxoCaixaUseCase } from "../../application/use-cases/gerar-fluxo-caixa.js";
import { criarFinancasGateway, criarContasCorrentesGateway } from "../../infrastructure/gateways/financas-gateway-factory.js";

export const fluxoCaixaTools: ToolDef[] = [
  defineTool({
    name: "omie_fluxo_caixa_gerar",
    description:
      "Monta o fluxo de caixa (entradas, saídas e saldo) num formato tabular pronto pra leitura ou " +
      "exportação futura pra planilha — a Omie NÃO tem esse relatório pronto, só lançamento por " +
      "lançamento de contas a pagar/receber (financas/mf ListarMovimentos), então esta ferramenta " +
      "busca todos os lançamentos do período, separa REALIZADO (já pago/recebido, pela data de " +
      "pagamento) de PREVISTO (contas em aberto ainda não liquidadas, pela data de vencimento, " +
      "excluindo canceladas) e agrega por dia ou mês E por conta corrente (nome já resolvido). " +
      "Cada linha do resultado traz: período, conta corrente, entradas/saídas realizadas, saldo " +
      "do período e acumulado, e o mesmo para o previsto (projeção incluindo o que ainda vai " +
      "vencer). IMPORTANTE: o saldo acumulado é a variação DENTRO do período pedido, não o saldo " +
      "bancário real (isso vem explicado no campo avisoSaldo da resposta). Períodos longos geram " +
      "muitas páginas na Omie e podem demorar — prefira períodos de até ~3 meses por chamada.",
    inputSchema: { param: gerarFluxoCaixaParamSchema },
    execute: async (client, param) => {
      const parsed = gerarFluxoCaixaParamSchema.parse(param);
      const financasGateway = criarFinancasGateway(client);
      const contasCorrentesGateway = criarContasCorrentesGateway(client);
      const useCase = new GerarFluxoCaixaUseCase(financasGateway, contasCorrentesGateway);
      return useCase.execute(parsed);
    },
  }),
];
