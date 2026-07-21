import { z } from "zod";
import { filtrosParamSchema } from "../../../../shared/filtro.js";

export const listarProdutosComEstoqueParamSchema = z.object({
  pagina: z.number().optional().describe("Página da listagem de produtos (padrão 1)."),
  registros_por_pagina: z
    .number()
    .optional()
    .describe("Quantidade de produtos por página (padrão 50)."),
  apenas_com_estoque: z
    .boolean()
    .optional()
    .describe("Se true, remove da lista os produtos com quantidade em estoque igual a zero."),
  filtrar_apenas_familia: z
    .number()
    .optional()
    .describe(
      "Código da família de produtos pra filtrar (obtido via omie_familias_listar, campo " +
        "'codigo'). Se omitido, lista produtos de todas as famílias."
    ),
  filtros: filtrosParamSchema,
});

export type ListarProdutosComEstoqueParam = z.infer<typeof listarProdutosComEstoqueParamSchema>;

export interface ProdutoComEstoque {
  codigoProduto: number;
  codigo: string;
  descricao: string;
  unidade: string;
  /** Soma do físico em todos os locais de estoque. */
  quantidadeEmEstoque: number;
  valorUnitarioVenda: number;
  /** quantidadeEmEstoque * valorUnitarioVenda (valor de mercado do estoque). */
  valorEmEstoqueVenda: number;
  /** Soma de (físico * custo médio) por local — valor contábil do estoque. */
  valorEmEstoqueCusto: number;
}

export interface ListarProdutosComEstoqueResult {
  pagina: number;
  totalPaginas: number;
  totalRegistros: number;
  itens: ProdutoComEstoque[];
}
