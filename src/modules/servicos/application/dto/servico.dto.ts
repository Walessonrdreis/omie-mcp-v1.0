import { z } from "zod";
import { filtrosParamSchema } from "../../../../shared/filtro.js";

export const incluirServicoParamSchema = z.object({
  cod_int_servico: z.string().describe("Código de integração único que você inventa."),
  descricao: z.string().describe("Descrição breve do serviço."),
  codigo: z.string().describe("Código interno do serviço (SKU de serviço)."),
  preco_unitario: z.number(),
  descricao_completa: z.string().optional(),
  codigo_categoria: z.string().optional(),
});
export type IncluirServicoParam = z.infer<typeof incluirServicoParamSchema>;

export const alterarServicoParamSchema = z.object({
  codigo_servico: z.number().describe("Código do serviço na Omie (nCodServ)."),
  descricao: z.string().optional(),
  preco_unitario: z.number().optional(),
  descricao_completa: z.string().optional(),
});
export type AlterarServicoParam = z.infer<typeof alterarServicoParamSchema>;

export const excluirServicoParamSchema = z.object({
  codigo_servico: z.number().describe("Código do serviço na Omie (nCodServ)."),
});
export type ExcluirServicoParam = z.infer<typeof excluirServicoParamSchema>;

export const consultarServicoParamSchema = z.object({
  codigo_servico: z.number().describe("Código do serviço na Omie (nCodServ)."),
});
export type ConsultarServicoParam = z.infer<typeof consultarServicoParamSchema>;

export const listarServicosParamSchema = z.object({
  pagina: z.number().optional().describe("Página da listagem (padrão 1)."),
  registros_por_pagina: z.number().optional().describe("Registros por página (padrão 50)."),
  filtros: filtrosParamSchema,
});
export type ListarServicosParam = z.infer<typeof listarServicosParamSchema>;

export interface ServicoResult {
  codigoServico: number;
  codIntServico: string;
  codigo: string;
  descricao: string;
  descricaoCompleta: string;
  precoUnitario: number;
  codigoCategoria: string;
  inativo: boolean;
}

export interface ListarServicosResult {
  pagina: number;
  totalPaginas: number;
  totalRegistros: number;
  servicos: ServicoResult[];
}
