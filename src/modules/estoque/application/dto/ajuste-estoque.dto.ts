import { z } from "zod";

export const incluirAjusteEstoqueParamSchema = z.object({
  id_prod: z.number().describe("Código Omie do produto."),
  data: z.string().describe("Data do ajuste, formato dd/mm/aaaa."),
  tipo: z
    .enum(["ENT", "SAI", "SLD", "TRF"])
    .describe("ENT = entrada, SAI = saída, SLD = saldo, TRF = transferência entre locais."),
  quan: z.number().describe("Quantidade movimentada."),
  valor: z.number().optional().describe("Valor unitário do movimento."),
  obs: z.string().optional(),
  origem: z.enum(["AJU", "PDV"]).default("AJU"),
  motivo: z
    .enum(["INI", "INV", "OPE", "PDV"])
    .describe(
      "Testado ao vivo — só esses 4 valores são aceitos pela Omie (não documentado na doc " +
        "pública): INI = estoque inicial, INV = inventário/divergência, OPE = operacional, " +
        "PDV = ponto de venda."
    ),
  codigo_local_estoque: z.number().optional(),
  codigo_local_estoque_destino: z
    .number()
    .optional()
    .describe("Obrigatório quando tipo = 'TRF' (local de destino da transferência)."),
});

export type IncluirAjusteEstoqueParam = z.infer<typeof incluirAjusteEstoqueParamSchema>;

export const excluirAjusteEstoqueParamSchema = z.object({
  id_ajuste: z
    .number()
    .describe(
      "Código do ajuste a excluir (devolvido em id_ajuste na inclusão). ATENÇÃO: excluir o " +
        "ajuste não desfaz a dependência criada no produto — a Omie mantém um histórico " +
        "permanente que passa a impedir excluir esse produto depois."
    ),
});

export type ExcluirAjusteEstoqueParam = z.infer<typeof excluirAjusteEstoqueParamSchema>;
