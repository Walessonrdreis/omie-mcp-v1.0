import { z } from "zod";
import { filtrosParamSchema } from "../../../../shared/filtro.js";

export const listarNFSeParamSchema = z.object({
  pagina: z.number().optional().describe("Página da listagem (padrão 1)."),
  registros_por_pagina: z.number().optional().describe("Registros por página (padrão 50)."),
  emissao_de: z.string().optional().describe("Filtra por data de emissão, formato dd/mm/aaaa."),
  emissao_ate: z.string().optional().describe("Fim do período de emissão, formato dd/mm/aaaa."),
  filtros: filtrosParamSchema,
});
export type ListarNFSeParam = z.infer<typeof listarNFSeParamSchema>;

export const listarLC116ParamSchema = z.object({
  pagina: z.number().optional().describe("Página da listagem (padrão 1)."),
  registros_por_pagina: z.number().optional().describe("Registros por página (padrão 50)."),
  filtros: filtrosParamSchema,
});
export type ListarLC116Param = z.infer<typeof listarLC116ParamSchema>;

export interface NFSeResumo {
  numero: string;
  serie: string;
  dataEmissao: string;
  codigoCliente: number;
  valorServicos: number;
  status: string;
}

export interface ListarNFSeResult {
  pagina: number;
  totalPaginas: number;
  totalRegistros: number;
  notas: NFSeResumo[];
}

export interface CodigoLC116 {
  codigo: string;
  descricao: string;
  descricaoCompleta: string;
}

export interface ListarLC116Result {
  totalPaginas: number;
  totalRegistros: number;
  codigos: CodigoLC116[];
}
