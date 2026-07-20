import { z } from "zod";

export const incluirOPParamSchema = z.object({
  cCodIntOP: z.string().optional().describe("Código de integração da OP (opcional)."),
  nCodProduto: z
    .number()
    .describe("Código Omie do produto a produzir (precisa já ter estrutura/BOM preenchida)."),
  dDtPrevisao: z.string().describe("Data prevista de conclusão, formato dd/mm/aaaa."),
  nQtde: z.number().describe("Quantidade a produzir."),
  codigo_local_estoque: z
    .number()
    .optional()
    .default(0)
    .describe(
      "Local de estoque (testado ao vivo — obrigatório na Omie, mesmo a doc pública marcando " +
        "como opcional; 0 = local padrão)."
    ),
});

export type IncluirOPParam = z.infer<typeof incluirOPParamSchema>;

export const alterarOPParamSchema = z.object({
  nCodOP: z.number().optional().describe("Código Omie da OP a alterar."),
  cCodIntOP: z.string().optional().describe("Código de integração da OP a alterar (alternativa)."),
  nCodProduto: z.number().describe("Código Omie do produto."),
  dDtPrevisao: z.string().describe("Data prevista de conclusão, formato dd/mm/aaaa."),
  nQtde: z.number().describe("Quantidade a produzir."),
  codigo_local_estoque: z.number().optional().default(0),
});

export type AlterarOPParam = z.infer<typeof alterarOPParamSchema>;

export const chaveOPParamSchema = z
  .object({
    nCodOP: z.number().optional().describe("Código Omie da OP."),
    cCodIntOP: z.string().optional().describe("Código de integração da OP (alternativa)."),
  })
  .describe("Informe pelo menos um identificador da OP.");

export type ChaveOPParam = z.infer<typeof chaveOPParamSchema>;
