import { z } from "zod";

/**
 * Formato padrão de uma ferramenta MCP que mapeia 1:1 para um método da API
 * Omie (resource + call), recebendo um único parâmetro `param` repassado
 * diretamente para a Omie.
 *
 * Todo módulo novo (financeiro, CRM, vendas, etc.) deve exportar um array de
 * `ToolDef` nesse formato; o registro no servidor MCP (src/index.ts) é
 * genérico e não precisa ser alterado ao adicionar módulos.
 */
export interface ToolDef {
  name: string;
  description: string;
  inputSchema: { param: z.ZodTypeAny };
  resource: string;
  call: string;
}

export const paramSchema = z
  .record(z.unknown())
  .describe("Parâmetros da chamada, conforme documentação Omie para este método.");

/** Helper para declarar uma ToolDef com menos repetição. */
export function defineTool(def: ToolDef): ToolDef {
  return def;
}
