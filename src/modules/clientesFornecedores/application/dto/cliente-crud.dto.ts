import { z } from "zod";

const tagSchema = z.object({ tag: z.string() });

export const incluirClienteParamSchema = z.object({
  codigo_cliente_integracao: z
    .string()
    .describe(
      "Código de integração (obrigatório na Omie, apesar da doc pública dizer o contrário)."
    ),
  razao_social: z.string().describe("Razão social (ou nome, se pessoa física)."),
  cnpj_cpf: z.string().describe("CNPJ ou CPF."),
  nome_fantasia: z.string().optional(),
  email: z.string().optional(),
  tags: z.array(tagSchema).optional().describe("Ex: [{ tag: 'Cliente' }] ou [{ tag: 'Fornecedor' }]."),
  telefone1_ddd: z.string().optional(),
  telefone1_numero: z.string().optional(),
  endereco: z.string().optional(),
  endereco_numero: z.string().optional(),
  bairro: z.string().optional(),
  complemento: z.string().optional(),
  estado: z.string().optional(),
  cidade: z.string().optional(),
  cep: z.string().optional(),
  observacao: z.string().optional(),
});

export type IncluirClienteParam = z.infer<typeof incluirClienteParamSchema>;

export const alterarClienteParamSchema = z.object({
  codigo_cliente_omie: z.number().optional().describe("Código Omie do cliente a alterar."),
  codigo_cliente_integracao: z
    .string()
    .optional()
    .describe("Código de integração do cliente a alterar (alternativa)."),
  razao_social: z.string().optional(),
  cnpj_cpf: z.string().optional(),
  nome_fantasia: z.string().optional(),
  email: z.string().optional(),
  tags: z.array(tagSchema).optional(),
  telefone1_ddd: z.string().optional(),
  telefone1_numero: z.string().optional(),
  endereco: z.string().optional(),
  endereco_numero: z.string().optional(),
  bairro: z.string().optional(),
  complemento: z.string().optional(),
  estado: z.string().optional(),
  cidade: z.string().optional(),
  cep: z.string().optional(),
  observacao: z.string().optional(),
});

export type AlterarClienteParam = z.infer<typeof alterarClienteParamSchema>;

export const excluirClienteParamSchema = z
  .object({
    codigo_cliente_omie: z.number().optional(),
    codigo_cliente_integracao: z.string().optional(),
  })
  .describe("Informe pelo menos um identificador do cliente.");

export type ExcluirClienteParam = z.infer<typeof excluirClienteParamSchema>;
