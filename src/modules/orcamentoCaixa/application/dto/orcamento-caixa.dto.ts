import { z } from "zod";
import { filtrosParamSchema } from "../../../../shared/filtro.js";

export const consultarOrcamentoCaixaParamSchema = z.object({
  ano: z.number().describe("Ano do orçamento, ex: 2026."),
  mes: z.number().describe("Mês do orçamento (1 a 12)."),
  filtros: filtrosParamSchema,
});
export type ConsultarOrcamentoCaixaParam = z.infer<typeof consultarOrcamentoCaixaParamSchema>;

export interface CategoriaOrcamento {
  codigoCategoria: string;
  descricaoCategoria: string;
  valorPrevisto: number;
  valorRealizado: number;
  diferenca: number;
}

export interface OrcamentoCaixaResult {
  ano: number;
  mes: number;
  categorias: CategoriaOrcamento[];
}
