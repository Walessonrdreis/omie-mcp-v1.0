import { z } from "zod";

export const listarPedidosComClienteParamSchema = z.object({
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
      "Filtra por uma etapa específica do funil de vendas (ex: '20' = Separar Estoque, '50' = " +
        "Faturar). Se omitido, traz pedidos de todas as etapas."
    ),
});

export type ListarPedidosComClienteParam = z.infer<typeof listarPedidosComClienteParamSchema>;

export interface ItemPedidoComCliente {
  codigoProduto: number;
  codigoSku: string;
  descricaoProduto: string;
  quantidade: number;
  unidade: string;
}

export interface PedidoComCliente {
  numeroPedido: string;
  codigoPedido: number;
  cliente: {
    codigo: number;
    razaoSocial: string;
    nomeFantasia: string;
  };
  dataPrevisao: string;
  etapaCodigo: string;
  etapaDescricao: string | undefined;
  cancelado: boolean;
  faturado: boolean;
  quantidadeItens: number;
  valorTotalPedido: number;
  itens: ItemPedidoComCliente[];
}

export interface ListarPedidosComClienteResult {
  pagina: number;
  totalPaginas: number;
  totalRegistros: number;
  pedidos: PedidoComCliente[];
}
