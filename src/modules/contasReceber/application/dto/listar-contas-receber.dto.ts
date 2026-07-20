import { z } from "zod";

export const listarContasReceberParamSchema = z.object({
  pagina: z.number().optional().describe("Página da listagem (padrão 1)."),
  registros_por_pagina: z.number().optional().describe("Registros por página (padrão 20)."),
});

export type ListarContasReceberParam = z.infer<typeof listarContasReceberParamSchema>;

export interface ContaReceber {
  codigoLancamento: number;
  cliente: {
    codigo: number;
    razaoSocial: string;
    nomeFantasia: string;
  };
  dataVencimento: string;
  valor: number;
  status: string;
  documentoFiscal: string;
  numeroPedido: string;
  categoria: string;
}

export interface ListarContasReceberResult {
  pagina: number;
  totalPaginas: number;
  totalRegistros: number;
  contas: ContaReceber[];
}