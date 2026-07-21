import { z } from "zod";
import { filtrosParamSchema } from "../../../../shared/filtro.js";

export const listarNfeParamSchema = z.object({
  pagina: z.number().optional().describe("Página da listagem (padrão 1)."),
  registros_por_pagina: z
    .number()
    .optional()
    .describe("Quantidade de notas por página (padrão 50)."),
  data_de: z
    .string()
    .optional()
    .describe("Filtra notas emitidas a partir desta data (formato dd/mm/aaaa)."),
  data_ate: z
    .string()
    .optional()
    .describe("Filtra notas emitidas até esta data (formato dd/mm/aaaa)."),
  apenas_canceladas: z
    .boolean()
    .optional()
    .describe("Se true, lista só as notas canceladas. Se false, só as não canceladas. Padrão: todas."),
  tipo: z
    .enum(["entrada", "saida"])
    .optional()
    .describe("Filtra por tipo de nota: entrada (compra) ou saida (venda). Padrão: todas."),
  filtros: filtrosParamSchema,
});

export type ListarNfeParam = z.infer<typeof listarNfeParamSchema>;

export const consultarNfeParamSchema = z
  .object({
    chave: z.string().optional().describe("Chave de acesso da NF-e (44 dígitos)."),
    codigo: z.number().optional().describe("Código interno da nota na Omie (nIdNF)."),
  })
  .refine((v) => v.chave !== undefined || v.codigo !== undefined, {
    message: "Informe 'chave' ou 'codigo' para consultar a nota.",
  });

export type ConsultarNfeParam = z.infer<typeof consultarNfeParamSchema>;

export interface ItemNotaFiscal {
  codigo: string;
  descricao: string;
  ncm: string;
  cfop: string;
  quantidade: number;
  unidade: string;
  valorUnitario: number;
  valorTotal: number;
}

export interface NotaFiscalResumo {
  codigoNota: number;
  chave: string;
  numero: string;
  serie: string;
  dataEmissao: string;
  cancelada: boolean;
  tipo: "entrada" | "saida";
  ambiente: "producao" | "homologacao";
  cliente: string;
  cnpjCpf: string;
  valorTotal: number;
  quantidadeItens: number;
}

export interface NotaFiscalDetalhe extends NotaFiscalResumo {
  itens: ItemNotaFiscal[];
  codigoPedido?: number;
  titulos: { numero: string; vencimento: string; valor: number }[];
}

export interface ListarNfeResult {
  pagina: number;
  totalPaginas: number;
  totalRegistros: number;
  notas: NotaFiscalResumo[];
}
