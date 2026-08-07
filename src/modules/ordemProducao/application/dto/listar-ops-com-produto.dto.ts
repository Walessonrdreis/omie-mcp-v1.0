import { z } from "zod";
import { filtrosParamSchema } from "../../../../shared/filtro.js";

export const listarOpsComProdutoParamSchema = z.object({
  pagina: z.number().optional().describe("Página da listagem de OPs (padrão 1)."),
  registros_por_pagina: z
    .number()
    .optional()
    .describe("Quantidade de OPs por página (padrão 20 — cada OP dispara uma busca de produto)."),
  apenas_nao_concluidas: z
    .boolean()
    .optional()
    .describe("Se true, remove da lista as OPs já concluídas (cConcluida = 'S')."),
  filtros: filtrosParamSchema,
});

export type ListarOpsComProdutoParam = z.infer<typeof listarOpsComProdutoParamSchema>;

export interface OrdemProducaoComProduto {
  numeroOP: string;
  codigoOP: number;
  codigoProduto: number;
  codigoSku: string;
  descricaoProduto: string;
  quantidade: number;
  dataPrevisao: string;
  dataInicio: string;
  dataConclusao: string;
  concluida: boolean;
  /**
   * Código cru da etapa (kanban configurável por conta — sem tradução
   * confiável disponível via API). Devolvido pra quem já souber o
   * significado das etapas da própria conta.
   */
  etapaCodigo: string;
}

export interface ListarOpsComProdutoResult {
  pagina: number;
  totalPaginas: number;
  totalRegistros: number;
  itens: OrdemProducaoComProduto[];
  geradoEm: string | null;
  idadeMs: number | null;
}
