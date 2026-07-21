import { z } from "zod";
import { filtrosParamSchema } from "../../../../shared/filtro.js";

export const listarPixParamSchema = z.object({
  pagina: z.number().optional().describe("Página da listagem (padrão 1)."),
  registros_por_pagina: z.number().optional().describe("Registros por página (padrão 50)."),
  emissao_de: z.string().optional().describe("Filtra por data de emissão, formato dd/mm/aaaa."),
  emissao_ate: z.string().optional().describe("Fim do período de emissão, formato dd/mm/aaaa."),
  status: z
    .string()
    .optional()
    .describe("Filtra por status (ex: 'LIQUIDADO', 'AGUARDANDO', 'CANCELADO')."),
  filtros: filtrosParamSchema,
});
export type ListarPixParam = z.infer<typeof listarPixParamSchema>;

export const codigoTituloPixParamSchema = z.object({
  codigo_titulo: z.number().describe("Código do título de contas a receber na Omie."),
});
export type CodigoTituloPixParam = z.infer<typeof codigoTituloPixParamSchema>;

export const gerarPixParamSchema = z.object({
  codigo_titulo: z.number().describe("Código do título de contas a receber na Omie."),
  valor: z.number().describe("Valor do PIX a cobrar."),
  codigo_conta_corrente: z
    .number()
    .describe("Código da conta corrente que vai receber (nCodCC/nIdConta)."),
});
export type GerarPixParam = z.infer<typeof gerarPixParamSchema>;

export const cancelarPixParamSchema = z.object({
  id_pix: z.number().describe("Identificador do PIX na Omie (nIdPix, ver omie_pix_obter)."),
});
export type CancelarPixParam = z.infer<typeof cancelarPixParamSchema>;

export interface PixResumo {
  idPix: number;
  codigoTitulo: number;
  valor: number;
  dataEmissao: string;
  dataVencimento: string;
  status: string;
}

export interface PixDetalhe extends PixResumo {
  urlPix: string;
  copiaCola: string;
}

export interface ListarPixResult {
  pagina: number;
  totalPaginas: number;
  totalRegistros: number;
  registros: PixResumo[];
}
