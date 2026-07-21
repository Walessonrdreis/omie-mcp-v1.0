import { z } from "zod";
import { filtrosParamSchema } from "../../../../shared/filtro.js";

const itemPedidoCompraSchema = z.object({
  cod_int_item: z.string().describe("Identificador único do item que você inventa (ex: '1')."),
  codigo_produto: z.number().describe("Código do produto na Omie (nCodProd)."),
  quantidade: z.number(),
  valor_unitario: z.number(),
});

export const incluirPedidoCompraParamSchema = z.object({
  cod_int_pedido: z
    .string()
    .max(20)
    .describe("Código de integração único (máx. 20 caracteres) — você inventa."),
  data_previsao: z.string().describe("Data prevista de entrega, formato dd/mm/aaaa."),
  quantidade_parcelas: z.number().default(1),
  codigo_fornecedor: z.number().describe("Código do fornecedor na Omie (nCodFor)."),
  codigo_conta_corrente: z
    .number()
    .describe(
      "Código da conta corrente (nCodCC, ver omie_contas_correntes_listar). Testado ao vivo: " +
        "apesar do nome sugerir centro de custo/departamento, a Omie exige aqui um código de " +
        "CONTA CORRENTE — usar código de departamento é recusado."
    ),
  codigo_categoria: z.string().optional().describe("Categoria financeira (ex: '2.09.01')."),
  itens: z.array(itemPedidoCompraSchema).min(1),
});
export type IncluirPedidoCompraParam = z.infer<typeof incluirPedidoCompraParamSchema>;

export const alterarPedidoCompraParamSchema = z.object({
  codigo_pedido: z.number().describe("Código do pedido na Omie (nCodPed)."),
  quantidade_parcelas: z.number().optional(),
  itens: z
    .array(itemPedidoCompraSchema)
    .optional()
    .describe("Se enviado, SUBSTITUI os itens atuais do pedido (não faz merge)."),
});
export type AlterarPedidoCompraParam = z.infer<typeof alterarPedidoCompraParamSchema>;

export const excluirPedidoCompraParamSchema = z.object({
  codigo_pedido: z.number().describe("Código do pedido na Omie (nCodPed)."),
});
export type ExcluirPedidoCompraParam = z.infer<typeof excluirPedidoCompraParamSchema>;

export const consultarPedidoCompraParamSchema = z.object({
  codigo_pedido: z.number().describe("Código do pedido na Omie (nCodPed)."),
});
export type ConsultarPedidoCompraParam = z.infer<typeof consultarPedidoCompraParamSchema>;

export const listarPedidosCompraParamSchema = z.object({
  pagina: z.number().optional().describe("Página da listagem (padrão 1)."),
  registros_por_pagina: z.number().optional().describe("Registros por página (padrão 50)."),
  filtros: filtrosParamSchema,
});
export type ListarPedidosCompraParam = z.infer<typeof listarPedidosCompraParamSchema>;

export interface PedidoCompraResumo {
  codigoPedido: number;
  codIntPedido: string;
  numero: string;
  dataPrevisao: string;
  codigoFornecedor: number;
  codigoContaCorrente: number;
  quantidadeItens: number;
  valorTotal: number;
}

export interface ItemPedidoCompraDetalhe {
  codigo: string;
  codigoProduto: number;
  descricao: string;
  quantidade: number;
  quantidadeRecebida: number;
  valorUnitario: number;
  valorTotal: number;
}

export interface PedidoCompraDetalhe extends PedidoCompraResumo {
  itens: ItemPedidoCompraDetalhe[];
}

export interface ListarPedidosCompraResult {
  pagina: number;
  totalPaginas: number;
  totalRegistros: number;
  pedidos: PedidoCompraResumo[];
}
