import { defineTool, ToolDef } from "../../../../tools/types.js";
import { consultarOrcamentoCaixaParamSchema } from "../../application/dto/orcamento-caixa.dto.js";
import { ConsultarOrcamentoCaixaUseCase } from "../../application/use-cases/consultar-orcamento-caixa.js";
import { criarOrcamentoCaixaGateway } from "../../infrastructure/gateways/orcamento-caixa-gateway-factory.js";

export const orcamentoCaixaTools: ToolDef[] = [
  defineTool({
    name: "omie_orcamento_caixa_consultar",
    description:
      "Consulta o orçamento de caixa NATIVO da Omie (previsto x realizado) por categoria " +
      "financeira, num mês/ano. Método Omie: ListarOrcamentos (recurso 'financas/caixa'). " +
      "Diferente de omie_fluxo_caixa_gerar (que calcula manualmente a partir de contas a " +
      "pagar/receber), este é o relatório pronto da própria Omie, organizado por categoria " +
      "(ex: '1.01.01 Vendas'), não por conta corrente/dia. Suporta o parâmetro genérico " +
      "'filtros' (ex: filtrar só categorias com diferença entre previsto e realizado).",
    inputSchema: { param: consultarOrcamentoCaixaParamSchema },
    execute: async (client, param) => {
      const parsed = consultarOrcamentoCaixaParamSchema.parse(param);
      const useCase = new ConsultarOrcamentoCaixaUseCase(criarOrcamentoCaixaGateway(client));
      return useCase.execute(parsed);
    },
  }),
];
