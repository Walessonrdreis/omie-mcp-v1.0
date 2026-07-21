import { z } from "zod";
import { filtrosParamSchema } from "../../../../shared/filtro.js";

export const incluirCategoriaParamSchema = z.object({
  categoria_superior: z
    .string()
    .describe(
      "Código da categoria PAI (grupo), ex: '2.09'. A Omie gera o código do filho " +
        "automaticamente (ex: '2.09.04') e devolve na resposta."
    ),
  descricao: z.string(),
});
export type IncluirCategoriaParam = z.infer<typeof incluirCategoriaParamSchema>;

export const alterarCategoriaParamSchema = z.object({
  codigo: z.string().describe("Código da categoria (ex: '2.09.04')."),
  descricao: z.string().optional(),
});
export type AlterarCategoriaParam = z.infer<typeof alterarCategoriaParamSchema>;

export const consultarCategoriaParamSchema = z.object({
  codigo: z.string().describe("Código da categoria (ex: '2.09.04')."),
});
export type ConsultarCategoriaParam = z.infer<typeof consultarCategoriaParamSchema>;

export const listarCategoriasParamSchema = z.object({
  pagina: z.number().optional().describe("Página da listagem (padrão 1)."),
  registros_por_pagina: z.number().optional().describe("Registros por página (padrão 50)."),
  filtros: filtrosParamSchema,
});
export type ListarCategoriasParam = z.infer<typeof listarCategoriasParamSchema>;

export interface CategoriaResult {
  codigo: string;
  descricao: string;
  categoriaSuperior: string;
  contaDespesa: boolean;
  contaReceita: boolean;
  inativa: boolean;
}

export interface ListarCategoriasResult {
  pagina: number;
  totalPaginas: number;
  totalRegistros: number;
  categorias: CategoriaResult[];
}
