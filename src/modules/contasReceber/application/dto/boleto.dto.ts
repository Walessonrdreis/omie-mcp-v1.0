import { z } from "zod";

export const codigoTituloParamSchema = z.object({
  codigo_titulo: z
    .number()
    .describe("Código do título de contas a receber na Omie (codigo_lancamento_omie)."),
});
export type CodigoTituloParam = z.infer<typeof codigoTituloParamSchema>;

export const prorrogarBoletoParamSchema = z.object({
  codigo_titulo: z.number().describe("Código do título de contas a receber na Omie."),
  nova_data_vencimento: z.string().describe("Nova data de vencimento, formato dd/mm/aaaa."),
});
export type ProrrogarBoletoParam = z.infer<typeof prorrogarBoletoParamSchema>;

export interface BoletoResult {
  linkBoleto: string;
  codigoStatus: string;
  descricaoStatus: string;
  dataEmissao: string;
  numeroBoleto: string;
  codigoBarras: string;
}

export interface CancelamentoBoletoResult {
  codigoStatus: string;
  descricaoStatus: string;
}
