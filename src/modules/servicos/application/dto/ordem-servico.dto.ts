import { z } from "zod";
import { filtrosParamSchema } from "../../../../shared/filtro.js";

const itemOSSchema = z.object({
  quantidade: z.number(),
  valor_unitario: z.number(),
  descricao: z.string(),
  tributacao_servico: z
    .string()
    .default("1")
    .describe("Código de tributação do serviço (padrão '1' = tributável no município)."),
  codigo_servico_municipal: z
    .string()
    .describe(
      "Código do serviço na lista municipal — precisa ser um código válido, ver " +
        "omie_servicos_lc116_listar (ex: '1.01')."
    ),
  codigo_servico_lc116: z
    .string()
    .describe("Código da Lei Complementar 116, ver omie_servicos_lc116_listar (ex: '1.01')."),
  retem_iss: z.enum(["S", "N"]).default("N"),
});

export const incluirOSParamSchema = z.object({
  cod_int_os: z.string().describe("Código de integração único que você inventa."),
  codigo_cliente: z.number().describe("Código do cliente na Omie (nCodCli)."),
  codigo_condicao_pagamento: z.string().default("999").describe("Código da condição de pagamento (padrão '999' = à vista)."),
  data_previsao: z.string().describe("Data prevista, formato dd/mm/aaaa."),
  etapa: z
    .string()
    .default("10")
    .describe("Etapa da OS: 00, 10, 20, 30, 40 ou 50 (padrão '10')."),
  quantidade_parcelas: z.number().default(1),
  codigo_categoria: z.string().describe("Categoria financeira (ex: '1.01.02')."),
  codigo_conta_corrente: z.number().describe("Código da conta corrente (nCodCC)."),
  itens: z.array(itemOSSchema).min(1),
});
export type IncluirOSParam = z.infer<typeof incluirOSParamSchema>;

export const alterarOSParamSchema = z.object({
  codigo_os: z.number().describe("Código da OS na Omie (nCodOS)."),
  data_previsao: z.string().optional(),
  etapa: z.string().optional(),
});
export type AlterarOSParam = z.infer<typeof alterarOSParamSchema>;

export const excluirOSParamSchema = z.object({
  codigo_os: z.number().describe("Código da OS na Omie (nCodOS)."),
});
export type ExcluirOSParam = z.infer<typeof excluirOSParamSchema>;

export const consultarOSParamSchema = z.object({
  codigo_os: z.number().describe("Código da OS na Omie (nCodOS)."),
});
export type ConsultarOSParam = z.infer<typeof consultarOSParamSchema>;

export const listarOSParamSchema = z.object({
  pagina: z.number().optional().describe("Página da listagem (padrão 1)."),
  registros_por_pagina: z.number().optional().describe("Registros por página (padrão 50)."),
  filtros: filtrosParamSchema,
});
export type ListarOSParam = z.infer<typeof listarOSParamSchema>;

export interface OSResumo {
  codigoOS: number;
  codIntOS: string;
  numero: string;
  codigoCliente: number;
  etapa: string;
  dataPrevisao: string;
  valorTotal: number;
  faturada: boolean;
  cancelada: boolean;
}

export interface ItemOSDetalhe {
  descricao: string;
  quantidade: number;
  valorUnitario: number;
}

export interface OSDetalhe extends OSResumo {
  itens: ItemOSDetalhe[];
}

export interface ListarOSResult {
  pagina: number;
  totalPaginas: number;
  totalRegistros: number;
  ordens: OSResumo[];
}
