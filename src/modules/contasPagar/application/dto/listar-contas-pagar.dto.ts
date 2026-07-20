import { z } from "zod";

export const listarContasPagarParamSchema = z.object({
  pagina: z.number().optional().describe("Página da listagem (padrão 1)."),
  registros_por_pagina: z.number().optional().describe("Registros por página (padrão 20)."),
});

export type ListarContasPagarParam = z.infer<typeof listarContasPagarParamSchema>;

export interface ContaPagar {
  codigoLancamento: number;
  fornecedor: {
    codigo: number;
    razaoSocial: string;
    nomeFantasia: string;
  };
  dataVencimento: string;
  valor: number;
  status: string;
  documentoFiscal: string;
  categoria: string;
  observacao: string;
}

export interface ListarContasPagarResult {
  pagina: number;
  totalPaginas: number;
  totalRegistros: number;
  contas: ContaPagar[];
}