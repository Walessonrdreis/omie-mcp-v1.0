import { z } from "zod";
import { filtrosParamSchema } from "../../../../shared/filtro.js";

export const listarNotaEntradaParamSchema = z.object({
  pagina: z.number().optional().describe("Página da listagem (padrão 1)."),
  registros_por_pagina: z.number().optional().describe("Registros por página (padrão 50)."),
  data_alteracao_de: z
    .string()
    .optional()
    .describe("Filtra por data de última alteração, formato dd/mm/aaaa (não é a data da nota)."),
  data_alteracao_ate: z.string().optional().describe("Fim do período de alteração, formato dd/mm/aaaa."),
  filtros: filtrosParamSchema,
});
export type ListarNotaEntradaParam = z.infer<typeof listarNotaEntradaParamSchema>;

export const consultarNotaEntradaParamSchema = z.object({
  codigo_nota: z.number().describe("Código da nota de entrada na Omie (nCodNotaEnt)."),
});
export type ConsultarNotaEntradaParam = z.infer<typeof consultarNotaEntradaParamSchema>;

export interface NotaEntradaResumo {
  codigoNota: number;
  numero: string;
  dataPrevisao: string;
  codigoFornecedor: number;
  valorMercadorias: number;
  valorTotal: number;
}

export interface ItemNotaEntrada {
  cfop: string;
  ncm: string;
  codigoLocalEstoque: number;
}

export interface NotaEntradaDetalhe extends NotaEntradaResumo {
  itens: ItemNotaEntrada[];
}

export interface ListarNotaEntradaResult {
  pagina: number;
  totalPaginas: number;
  totalRegistros: number;
  notas: NotaEntradaResumo[];
}
