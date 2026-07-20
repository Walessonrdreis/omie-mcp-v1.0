import { z } from "zod";

export const listarEstruturasParamSchema = z.object({
  pagina: z.number().optional().describe("Página da listagem (padrão 1)."),
  registros_por_pagina: z
    .number()
    .optional()
    .describe("Quantidade de produtos por página (padrão 50)."),
});

export type ListarEstruturasParam = z.infer<typeof listarEstruturasParamSchema>;

export const buscarEstruturaPorProdutoParamSchema = z.object({
  termo: z
    .string()
    .describe(
      "Nome/descrição (ou trecho dela) ou código do produto a procurar, ex: '100kg', 'PROD-001'."
    ),
});

export type BuscarEstruturaPorProdutoParam = z.infer<typeof buscarEstruturaPorProdutoParamSchema>;

export interface ItemEstrutura {
  codigo: string;
  descricao: string;
  quantidade: number;
  unidade: string;
}

export interface ProdutoComEstrutura {
  codigoProduto: number;
  codigoSku: string;
  descricaoProduto: string;
  itens: ItemEstrutura[];
}

export interface ListarEstruturasResult {
  pagina: number;
  totalPaginas: number;
  totalRegistros: number;
  produtos: ProdutoComEstrutura[];
}

export interface BuscarEstruturaPorProdutoResult {
  encontrados: number;
  produtos: ProdutoComEstrutura[];
}
