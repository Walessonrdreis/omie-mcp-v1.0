import { z } from "zod";

export const incluirProdutoParamSchema = z.object({
  codigo: z.string().describe("Código/SKU do produto (obrigatório na Omie, apesar da doc pública dizer o contrário)."),
  codigo_produto_integracao: z
    .string()
    .optional()
    .describe("Código de integração externo, se você mantém um."),
  descricao: z.string().describe("Descrição/nome do produto."),
  unidade: z.string().describe("Unidade de medida (ex: UN, KG, CX)."),
  ncm: z.string().optional().describe("Código NCM (obrigatório pra produtos, opcional pra serviços)."),
  valor_unitario: z.number().optional().describe("Preço unitário de venda."),
  ean: z.string().optional(),
  codigo_familia: z.number().optional().describe("Código da família (via omie_familias_listar)."),
  tipoItem: z.string().optional(),
  peso_liq: z.number().optional(),
  peso_bruto: z.number().optional(),
  marca: z.string().optional(),
  modelo: z.string().optional(),
});

export type IncluirProdutoParam = z.infer<typeof incluirProdutoParamSchema>;

export const alterarProdutoParamSchema = z.object({
  codigo_produto: z.number().optional().describe("Código Omie do produto a alterar."),
  codigo: z.string().optional().describe("SKU do produto a alterar (alternativa ao codigo_produto)."),
  codigo_produto_integracao: z
    .string()
    .optional()
    .describe("Código de integração do produto a alterar (alternativa)."),
  descricao: z.string().optional(),
  unidade: z.string().optional(),
  ncm: z.string().optional(),
  valor_unitario: z.number().optional(),
  ean: z.string().optional(),
  codigo_familia: z.number().optional(),
  tipoItem: z.string().optional(),
  peso_liq: z.number().optional(),
  peso_bruto: z.number().optional(),
  marca: z.string().optional(),
  modelo: z.string().optional(),
});

export type AlterarProdutoParam = z.infer<typeof alterarProdutoParamSchema>;

export const excluirProdutoParamSchema = z
  .object({
    codigo_produto: z.number().optional(),
    codigo: z.string().optional(),
    codigo_produto_integracao: z.string().optional(),
  })
  .describe("Informe pelo menos um identificador do produto.");

export type ExcluirProdutoParam = z.infer<typeof excluirProdutoParamSchema>;
