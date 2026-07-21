import { z } from "zod";
import { filtrosParamSchema } from "../../../../shared/filtro.js";

export const incluirContaParamSchema = z.object({
  cod_int_conta: z.string().describe("Código de integração único que você inventa."),
  nome: z.string(),
  uf: z.string().describe("UF, ex: 'DF'."),
  cidade: z.string(),
  email: z.string(),
});
export type IncluirContaParam = z.infer<typeof incluirContaParamSchema>;

export const alterarContaParamSchema = z.object({
  codigo_conta: z.number().describe("Código da conta no CRM (nCod)."),
  nome: z.string().optional(),
  uf: z.string().optional(),
  cidade: z.string().optional(),
  email: z.string().optional(),
});
export type AlterarContaParam = z.infer<typeof alterarContaParamSchema>;

export const excluirContaParamSchema = z.object({
  codigo_conta: z.number().describe("Código da conta no CRM (nCod)."),
});
export type ExcluirContaParam = z.infer<typeof excluirContaParamSchema>;

export const consultarContaParamSchema = z.object({
  codigo_conta: z.number().describe("Código da conta no CRM (nCod)."),
});
export type ConsultarContaParam = z.infer<typeof consultarContaParamSchema>;

export const listarContasParamSchema = z.object({
  pagina: z.number().optional().describe("Página da listagem (padrão 1)."),
  registros_por_pagina: z.number().optional().describe("Registros por página (padrão 50)."),
  filtros: filtrosParamSchema,
});
export type ListarContasParam = z.infer<typeof listarContasParamSchema>;

export interface ContaResult {
  codigoConta: number;
  codIntConta: string;
  nome: string;
  nomeFantasia: string;
  documento: string;
  uf: string;
  cidade: string;
  email: string;
}

export interface ListarContasResult {
  pagina: number;
  totalPaginas: number;
  totalRegistros: number;
  contas: ContaResult[];
}
