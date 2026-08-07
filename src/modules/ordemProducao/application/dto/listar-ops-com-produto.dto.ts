import { z } from "zod";
import { filtrosParamSchema } from "../../../../shared/filtro.js";

/**
 * Teto de itens por página. A leitura é local (SQLite), então o limite não é
 * sobre custo de rede: a resposta é consumida por um modelo, e cada OP é um
 * objeto de 11 campos (~250 bytes de JSON). 200 itens já são ~50 KB de
 * contexto — passar disso troca paginação/filtro por despejo de tabela.
 */
export const REGISTROS_POR_PAGINA_MAX = 200;

export const listarOpsComProdutoParamSchema = z.object({
  pagina: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Página da listagem de OPs (padrão 1). Inteiro >= 1."),
  registros_por_pagina: z
    .number()
    .int()
    .positive()
    .max(REGISTROS_POR_PAGINA_MAX)
    .optional()
    .describe(
      `Quantidade de OPs por página (padrão 20, máximo ${REGISTROS_POR_PAGINA_MAX}). A leitura vem ` +
        "do cache local, então o custo não é de rede: o limite existe porque a resposta inteira vai " +
        "pro contexto — prefira paginar ou usar 'filtros' a pedir páginas gigantes."
    ),
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
  /** Presente só quando o cache ainda não foi populado (`status: "sem_dado"`). */
  aviso?: string;
}
