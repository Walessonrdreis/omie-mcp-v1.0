import { z } from "zod";

const itemParaIncluirSchema = z.object({
  intMalha: z
    .string()
    .describe(
      "Identificador do item dentro da malha (obrigatório na Omie, apesar da doc pública " +
        "dizer o contrário) — invente um código único, ex: 'ITEM-001'."
    ),
  idProdMalha: z.number().describe("Código Omie do produto/insumo componente."),
  quantProdMalha: z.number().describe("Quantidade do insumo usada na estrutura."),
  percPerdaProdMalha: z.number().optional().describe("Percentual de perda do insumo."),
  obsProdMalha: z.string().optional(),
});

export const incluirEstruturaParamSchema = z.object({
  idProduto: z
    .number()
    .describe(
      "Código Omie do produto pai (precisa ser tipo '03 - Produto em Processo' ou " +
        "'04 - Produto Acabado', senão a Omie recusa)."
    ),
  itens: z.array(itemParaIncluirSchema).min(1).describe("Insumos/componentes a adicionar."),
});

export type IncluirEstruturaParam = z.infer<typeof incluirEstruturaParamSchema>;

const itemParaAlterarSchema = z.object({
  idMalha: z.number().describe("Identificador do item de estrutura a alterar."),
  idProdMalha: z
    .number()
    .describe("Código Omie do produto/insumo componente (obrigatório mesmo só pra mudar quantidade)."),
  quantProdMalha: z.number().optional(),
  percPerdaProdMalha: z.number().optional(),
  obsProdMalha: z.string().optional(),
});

export const alterarEstruturaParamSchema = z.object({
  idProduto: z.number().describe("Código Omie do produto pai."),
  itens: z.array(itemParaAlterarSchema).min(1).describe("Itens a alterar."),
});

export type AlterarEstruturaParam = z.infer<typeof alterarEstruturaParamSchema>;

export const excluirEstruturaParamSchema = z.object({
  idProduto: z.number().describe("Código Omie do produto pai."),
  idMalha: z.number().describe("Identificador do item de estrutura a remover."),
});

export type ExcluirEstruturaParam = z.infer<typeof excluirEstruturaParamSchema>;
