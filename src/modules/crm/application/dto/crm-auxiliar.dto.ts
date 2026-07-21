import { z } from "zod";
import { filtrosParamSchema } from "../../../../shared/filtro.js";

export const listarCrmAuxiliarParamSchema = z.object({
  pagina: z.number().optional().describe("Página da listagem (padrão 1)."),
  registros_por_pagina: z.number().optional().describe("Registros por página (padrão 50)."),
  filtros: filtrosParamSchema,
});
export type ListarCrmAuxiliarParam = z.infer<typeof listarCrmAuxiliarParamSchema>;

export interface FaseResult {
  descricaoPadrao: string;
  descricaoUsuario: string;
  observacao: string;
}

export interface SolucaoResult {
  codigo: number;
  descricao: string;
  inativo: boolean;
}

export interface OrigemResult {
  codigo: number;
  descricao: string;
  observacao: string;
}
