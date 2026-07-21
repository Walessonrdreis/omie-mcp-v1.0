import { z } from "zod";
import { filtrosParamSchema } from "../../../../shared/filtro.js";

export const incluirCaracteristicaParamSchema = z.object({
  cod_int_caracteristica: z.string().describe("Código de integração único que você inventa."),
  nome: z.string().describe("Nome da característica, ex: 'Cor', 'Tamanho'."),
  valor_definido: z
    .enum(["S", "N"])
    .default("N")
    .describe("'S' se os valores permitidos são uma lista fechada (ver conteudos_permitidos)."),
  conteudos_permitidos: z
    .array(z.string())
    .optional()
    .describe("Lista de valores permitidos, se valor_definido='S' (ex: ['Azul', 'Verde', 'Vermelho'])."),
});
export type IncluirCaracteristicaParam = z.infer<typeof incluirCaracteristicaParamSchema>;

export const alterarCaracteristicaParamSchema = z.object({
  codigo_caracteristica: z.number().describe("Código da característica na Omie (nCodCaract)."),
  nome: z.string().optional(),
});
export type AlterarCaracteristicaParam = z.infer<typeof alterarCaracteristicaParamSchema>;

export const excluirCaracteristicaParamSchema = z.object({
  codigo_caracteristica: z.number().describe("Código da característica na Omie (nCodCaract)."),
});
export type ExcluirCaracteristicaParam = z.infer<typeof excluirCaracteristicaParamSchema>;

export const consultarCaracteristicaParamSchema = z.object({
  codigo_caracteristica: z.number().describe("Código da característica na Omie (nCodCaract)."),
});
export type ConsultarCaracteristicaParam = z.infer<typeof consultarCaracteristicaParamSchema>;

export const listarCaracteristicasParamSchema = z.object({
  pagina: z.number().optional().describe("Página da listagem (padrão 1)."),
  registros_por_pagina: z.number().optional().describe("Registros por página (padrão 50)."),
  filtros: filtrosParamSchema,
});
export type ListarCaracteristicasParam = z.infer<typeof listarCaracteristicasParamSchema>;

export interface CaracteristicaResult {
  codigo: number;
  codIntCaracteristica: string;
  nome: string;
  conteudosPermitidos: string[];
}

export interface ListarCaracteristicasResult {
  pagina: number;
  totalPaginas: number;
  totalRegistros: number;
  caracteristicas: CaracteristicaResult[];
}
