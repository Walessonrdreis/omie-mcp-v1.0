import { z } from "zod";
import { filtrosParamSchema } from "../../../../shared/filtro.js";

export const consultarExtratoParamSchema = z.object({
  codigo_conta_corrente: z
    .number()
    .describe("Código da conta corrente (nCodCC, ver omie_contas_correntes_listar)."),
  periodo_inicial: z.string().describe("Início do período, formato dd/mm/aaaa."),
  periodo_final: z.string().describe("Fim do período, formato dd/mm/aaaa."),
  filtros: filtrosParamSchema,
});
export type ConsultarExtratoParam = z.infer<typeof consultarExtratoParamSchema>;

export interface MovimentoExtrato {
  codigoLancamento?: number;
  situacao?: string;
  data: string;
  descricao: string;
  tipoDocumento?: string;
  numero?: string;
  valor: number;
  saldoApos: number;
  categoria?: string;
  documentoFiscal?: string;
  natureza?: "receita" | "despesa" | "indefinida";
  observacoes?: string;
}

export interface ExtratoContaCorrenteResult {
  codigoContaCorrente: number;
  descricaoConta: string;
  periodoInicial: string;
  periodoFinal: string;
  saldoAnterior: number;
  saldoAtual: number;
  saldoConciliado: number;
  saldoDisponivel: number;
  movimentos: MovimentoExtrato[];
}
