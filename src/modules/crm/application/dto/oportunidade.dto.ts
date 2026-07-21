import { z } from "zod";
import { filtrosParamSchema } from "../../../../shared/filtro.js";

export const incluirOportunidadeParamSchema = z.object({
  cod_int_oportunidade: z.string().describe("Código de integração único que você inventa."),
  descricao: z.string().describe("Descrição da oportunidade."),
  codigo_conta: z.number().describe("Código da conta do CRM (nCodConta)."),
  codigo_contato: z.number().describe("Código do contato do CRM (nCodContato)."),
  codigo_solucao: z
    .number()
    .describe("Código da solução/produto ofertado — ver omie_crm_solucoes_listar."),
  codigo_origem: z.number().describe("Código da origem do lead — ver omie_crm_origens_listar."),
});
export type IncluirOportunidadeParam = z.infer<typeof incluirOportunidadeParamSchema>;

export const alterarOportunidadeParamSchema = z.object({
  codigo_oportunidade: z.number().describe("Código da oportunidade no CRM (nCodOp)."),
  descricao: z.string().optional(),
});
export type AlterarOportunidadeParam = z.infer<typeof alterarOportunidadeParamSchema>;

export const excluirOportunidadeParamSchema = z.object({
  codigo_oportunidade: z.number().describe("Código da oportunidade no CRM (nCodOp)."),
});
export type ExcluirOportunidadeParam = z.infer<typeof excluirOportunidadeParamSchema>;

export const consultarOportunidadeParamSchema = z.object({
  codigo_oportunidade: z.number().describe("Código da oportunidade no CRM (nCodOp)."),
});
export type ConsultarOportunidadeParam = z.infer<typeof consultarOportunidadeParamSchema>;

export const listarOportunidadesParamSchema = z.object({
  pagina: z.number().optional().describe("Página da listagem (padrão 1)."),
  registros_por_pagina: z.number().optional().describe("Registros por página (padrão 50)."),
  filtros: filtrosParamSchema,
});
export type ListarOportunidadesParam = z.infer<typeof listarOportunidadesParamSchema>;

export interface OportunidadeResult {
  codigoOportunidade: number;
  codIntOportunidade: string;
  descricao: string;
  numero: string;
  codigoConta: number;
  codigoContato: number;
  codigoFase: number;
  valorTicket: number;
}

export interface ListarOportunidadesResult {
  totalPaginas: number;
  totalRegistros: number;
  oportunidades: OportunidadeResult[];
}
