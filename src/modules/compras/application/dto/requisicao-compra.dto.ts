import { z } from "zod";
import { filtrosParamSchema } from "../../../../shared/filtro.js";

const itemRequisicaoCompraSchema = z.object({
  cod_int_item: z.string().describe("Identificador único do item que você inventa (ex: '1')."),
  codigo_produto: z.number().describe("Código do produto na Omie (nCodProd)."),
  quantidade: z.number(),
  preco_unitario: z.number().optional(),
});

export const incluirRequisicaoCompraParamSchema = z.object({
  cod_int_requisicao: z
    .string()
    .max(20)
    .describe("Código de integração único (máx. 20 caracteres) — você inventa."),
  codigo_categoria: z.string().describe("Categoria financeira (ex: '2.09.01')."),
  data_sugestao: z.string().describe("Data sugerida de compra, formato dd/mm/aaaa."),
  itens: z.array(itemRequisicaoCompraSchema).min(1),
});
export type IncluirRequisicaoCompraParam = z.infer<typeof incluirRequisicaoCompraParamSchema>;

export const alterarRequisicaoCompraParamSchema = z.object({
  codigo_requisicao: z.number().describe("Código da requisição na Omie (codReqCompra)."),
  codigo_categoria: z.string().optional(),
  data_sugestao: z.string().optional(),
  itens: z
    .array(itemRequisicaoCompraSchema)
    .optional()
    .describe("Se enviado, SUBSTITUI os itens atuais da requisição (não faz merge)."),
});
export type AlterarRequisicaoCompraParam = z.infer<typeof alterarRequisicaoCompraParamSchema>;

export const excluirRequisicaoCompraParamSchema = z.object({
  codigo_requisicao: z.number().describe("Código da requisição na Omie (codReqCompra)."),
});
export type ExcluirRequisicaoCompraParam = z.infer<typeof excluirRequisicaoCompraParamSchema>;

export const consultarRequisicaoCompraParamSchema = z.object({
  codigo_requisicao: z.number().describe("Código da requisição na Omie (codReqCompra)."),
});
export type ConsultarRequisicaoCompraParam = z.infer<typeof consultarRequisicaoCompraParamSchema>;

export const listarRequisicoesCompraParamSchema = z.object({
  pagina: z.number().optional().describe("Página da listagem (padrão 1)."),
  registros_por_pagina: z.number().optional().describe("Registros por página (padrão 50)."),
  filtros: filtrosParamSchema,
});
export type ListarRequisicoesCompraParam = z.infer<typeof listarRequisicoesCompraParamSchema>;

export interface ItemRequisicaoCompraDetalhe {
  codigoProduto: number;
  quantidade: number;
  precoUnitario: number;
}

export interface RequisicaoCompraResult {
  codigoRequisicao: number;
  codIntRequisicao: string;
  codigoCategoria: string;
  dataSugestao: string;
  itens: ItemRequisicaoCompraDetalhe[];
}

export interface ListarRequisicoesCompraResult {
  totalPaginas: number;
  totalRegistros: number;
  requisicoes: RequisicaoCompraResult[];
}
