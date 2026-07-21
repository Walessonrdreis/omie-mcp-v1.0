import { z } from "zod";

const itemSchema = z.object({
  codigo_item_integracao: z.string().describe("Identificador único do item dentro do pedido, ex: 'ITEM-1'."),
  codigo_produto: z.number().describe("Código Omie do produto."),
  quantidade: z.number(),
  valor_unitario: z.number(),
});

export const incluirPedidoParamSchema = z.object({
  codigo_pedido_integracao: z.string().optional().describe("Código de integração do pedido (opcional)."),
  codigo_cliente: z
    .number()
    .describe(
      "Código Omie do cliente (precisa ter UF preenchida no cadastro, senão a Omie recusa o pedido)."
    ),
  data_previsao: z.string().describe("Data prevista de entrega/faturamento, formato dd/mm/aaaa."),
  etapa: z.string().optional().default("10").describe("Etapa inicial (padrão '10' = Pedido de Venda)."),
  codigo_parcela: z.string().optional().default("000").describe("Condição de pagamento (padrão '000' = à vista)."),
  codigo_categoria: z
    .string()
    .describe(
      "Código da categoria financeira (ver omie_chamar_api com resource 'geral/categorias', call " +
        "'ListarCategorias' — use uma categoria de receita, ex: '1.01.01')."
    ),
  codigo_conta_corrente: z
    .number()
    .describe("Código da conta corrente de recebimento (via omie_contas_correntes_listar)."),
  consumidor_final: z.enum(["S", "N"]).optional().default("N"),
  itens: z.array(itemSchema).min(1).describe("Itens do pedido."),
});

export type IncluirPedidoParam = z.infer<typeof incluirPedidoParamSchema>;

export const alterarPedidoParamSchema = z.object({
  codigo_pedido: z.number().optional().describe("Código Omie do pedido a alterar."),
  codigo_pedido_integracao: z.string().optional().describe("Código de integração do pedido a alterar (alternativa)."),
  codigo_cliente: z.number(),
  data_previsao: z.string(),
  etapa: z.string().optional().default("10"),
  codigo_parcela: z.string().optional().default("000"),
  codigo_categoria: z.string(),
  codigo_conta_corrente: z.number(),
  consumidor_final: z.enum(["S", "N"]).optional().default("N"),
  itens: z.array(itemSchema).min(1),
});

export type AlterarPedidoParam = z.infer<typeof alterarPedidoParamSchema>;

export const chavePedidoParamSchema = z
  .object({
    codigo_pedido: z.number().optional(),
    codigo_pedido_integracao: z.string().optional(),
  })
  .describe("Informe pelo menos um identificador do pedido.");

export type ChavePedidoParam = z.infer<typeof chavePedidoParamSchema>;
