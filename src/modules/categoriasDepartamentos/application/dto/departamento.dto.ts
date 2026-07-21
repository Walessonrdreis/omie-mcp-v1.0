import { z } from "zod";
import { filtrosParamSchema } from "../../../../shared/filtro.js";

export const incluirDepartamentoParamSchema = z.object({
  codigo_pai: z
    .string()
    .describe(
      "Código do departamento/centro de custo PAI (onde o novo será incluído) — ver " +
        "omie_departamento_listar. A Omie gera e devolve o código do novo departamento."
    ),
  descricao: z.string(),
});
export type IncluirDepartamentoParam = z.infer<typeof incluirDepartamentoParamSchema>;

export const alterarDepartamentoParamSchema = z.object({
  codigo: z.string().describe("Código do departamento (devolvido ao incluir, ou visto no listar)."),
  descricao: z.string().optional(),
});
export type AlterarDepartamentoParam = z.infer<typeof alterarDepartamentoParamSchema>;

export const excluirDepartamentoParamSchema = z.object({
  codigo: z.string().describe("Código do departamento."),
});
export type ExcluirDepartamentoParam = z.infer<typeof excluirDepartamentoParamSchema>;

export const consultarDepartamentoParamSchema = z.object({
  codigo: z.string().describe("Código do departamento."),
});
export type ConsultarDepartamentoParam = z.infer<typeof consultarDepartamentoParamSchema>;

export const listarDepartamentosParamSchema = z.object({
  pagina: z.number().optional().describe("Página da listagem (padrão 1)."),
  registros_por_pagina: z.number().optional().describe("Registros por página (padrão 50)."),
  filtros: filtrosParamSchema,
});
export type ListarDepartamentosParam = z.infer<typeof listarDepartamentosParamSchema>;

export interface DepartamentoResult {
  codigo: string;
  descricao: string;
  estrutura: string;
  inativo: boolean;
}

export interface ListarDepartamentosResult {
  pagina: number;
  totalPaginas: number;
  totalRegistros: number;
  departamentos: DepartamentoResult[];
}
