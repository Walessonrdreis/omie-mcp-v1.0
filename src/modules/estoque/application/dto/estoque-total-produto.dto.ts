import { z } from "zod";

export const estoqueTotalProdutoParamSchema = z.object({
  codigo_produto: z
    .number()
    .describe(
      "Código do produto na Omie (nCodProd/codigo_produto), obtido via omie_produtos_consultar " +
        "ou omie_produtos_listar."
    ),
});

export type EstoqueTotalProdutoParam = z.infer<typeof estoqueTotalProdutoParamSchema>;

export interface EstoqueTotalProdutoResult {
  codigoProduto: number;
  quantidadeFisicaTotal: number;
  saldoTotal: number;
  reservadoTotal: number;
  locais: Array<{
    codigoLocalEstoque: number;
    fisico: number;
    saldo: number;
    reservado: number;
  }>;
}
