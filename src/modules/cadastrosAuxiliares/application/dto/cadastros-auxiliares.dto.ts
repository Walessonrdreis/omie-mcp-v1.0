import { z } from "zod";
import { filtrosParamSchema } from "../../../../shared/filtro.js";

export const listarBancosParamSchema = z.object({
  pagina: z.number().optional().describe("Página da listagem (padrão 1)."),
  registros_por_pagina: z.number().optional().describe("Registros por página (padrão 50)."),
  nome: z.string().optional().describe("Filtra pelo nome do banco (busca nativa da Omie)."),
  filtros: filtrosParamSchema,
});
export type ListarBancosParam = z.infer<typeof listarBancosParamSchema>;

export const listarCidadesParamSchema = z.object({
  pagina: z.number().optional().describe("Página da listagem (padrão 1)."),
  registros_por_pagina: z.number().optional().describe("Registros por página (padrão 50)."),
  uf: z.string().optional().describe("Filtra por UF (2 letras, ex: 'DF')."),
  contendo: z.string().optional().describe("Filtra por nome da cidade (contém), ex: 'Brasilia'."),
  filtros: filtrosParamSchema,
});
export type ListarCidadesParam = z.infer<typeof listarCidadesParamSchema>;

export const listarPaisesParamSchema = z.object({
  codigo_iso: z.string().optional().describe("Filtra pelo código ISO de 2 letras, ex: 'BR'."),
  descricao: z.string().optional().describe("Filtra pela descrição do país."),
  filtros: filtrosParamSchema,
});
export type ListarPaisesParam = z.infer<typeof listarPaisesParamSchema>;

export const listarNCMParamSchema = z.object({
  pagina: z.number().optional().describe("Página da listagem (padrão 1)."),
  registros_por_pagina: z.number().optional().describe("Registros por página (padrão 50)."),
  codigo: z.string().optional().describe("Filtra por código NCM (formato 9999.99.99)."),
  descricao: z.string().optional().describe("Filtra pela descrição do NCM."),
  filtros: filtrosParamSchema,
});
export type ListarNCMParam = z.infer<typeof listarNCMParamSchema>;

export const consultarUnidadeParamSchema = z.object({
  codigo: z.string().describe("Código da unidade de medida, ex: 'UN', 'KG', 'CX'."),
});
export type ConsultarUnidadeParam = z.infer<typeof consultarUnidadeParamSchema>;
