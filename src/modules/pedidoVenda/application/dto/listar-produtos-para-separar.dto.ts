import { z } from "zod";

export const listarProdutosParaSepararParamSchema = z.object({
  pagina: z.number().optional().describe("Página da listagem de pedidos (padrão 1)."),
  registros_por_pagina: z
    .number()
    .optional()
    .describe(
      "Pedidos por página (padrão 20 — cada pedido tem um payload pesado, com todos os campos " +
        "fiscais; evite valores altos)."
    ),
  etapa_codigo: z
    .string()
    .optional()
    .describe(
      "Código da etapa a filtrar (catálogo fixo da Omie para 'Venda de Produto'). Padrão '20' = " +
        "Separar Estoque. Outros códigos comuns: '10' Pedido de Venda, '50' Faturar, '60' " +
        "Faturado, '70' Entrega."
    ),
});

export type ListarProdutosParaSepararParam = z.infer<typeof listarProdutosParaSepararParamSchema>;

export interface ItemParaSeparar {
  numeroPedido: string;
  codigoPedido: number;
  codigoCliente: number;
  dataPrevisao: string;
  codigoProduto: number;
  codigoSku: string;
  descricaoProduto: string;
  quantidade: number;
  unidade: string;
}

export interface ResumoProdutoParaSeparar {
  codigoProduto: number;
  codigoSku: string;
  descricaoProduto: string;
  quantidadeTotalASeparar: number;
  emQuantosPedidos: number;
}

export interface ListarProdutosParaSepararResult {
  pagina: number;
  totalPaginas: number;
  totalRegistros: number;
  etapaCodigo: string;
  etapaDescricao: string | undefined;
  itens: ItemParaSeparar[];
  resumoPorProduto: ResumoProdutoParaSeparar[];
}
