import { z } from "zod";
import { filtrosParamSchema } from "../../../../shared/filtro.js";

export const incluirContatoParamSchema = z.object({
  cod_int_contato: z.string().describe("Código de integração único que você inventa."),
  nome: z.string(),
  sobrenome: z.string(),
  codigo_conta: z.number().describe("Código da conta do CRM à qual este contato pertence (nCod)."),
  email: z.string().optional(),
});
export type IncluirContatoParam = z.infer<typeof incluirContatoParamSchema>;

export const alterarContatoParamSchema = z.object({
  codigo_contato: z.number().describe("Código do contato no CRM (nCod)."),
  nome: z.string().optional(),
  sobrenome: z.string().optional(),
  email: z.string().optional(),
});
export type AlterarContatoParam = z.infer<typeof alterarContatoParamSchema>;

export const excluirContatoParamSchema = z.object({
  codigo_contato: z.number().describe("Código do contato no CRM (nCod)."),
});
export type ExcluirContatoParam = z.infer<typeof excluirContatoParamSchema>;

export const consultarContatoParamSchema = z.object({
  codigo_contato: z.number().describe("Código do contato no CRM (nCod)."),
});
export type ConsultarContatoParam = z.infer<typeof consultarContatoParamSchema>;

export const listarContatosParamSchema = z.object({
  pagina: z.number().optional().describe("Página da listagem (padrão 1)."),
  registros_por_pagina: z.number().optional().describe("Registros por página (padrão 50)."),
  filtros: filtrosParamSchema,
});
export type ListarContatosParam = z.infer<typeof listarContatosParamSchema>;

export interface ContatoResult {
  codigoContato: number;
  codIntContato: string;
  nome: string;
  sobrenome: string;
  codigoConta: number;
  email: string;
}

export interface ListarContatosResult {
  pagina: number;
  totalPaginas: number;
  totalRegistros: number;
  contatos: ContatoResult[];
}
