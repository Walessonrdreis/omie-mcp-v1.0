import { z } from "zod";
import { OmieClient } from "../integrations/omie/omieClient.js";

/**
 * Ferramenta MCP no formato "passthrough": mapeia 1:1 para um método da API
 * Omie (resource + call), repassando `param` direto pra Omie sem lógica
 * própria. É o formato padrão pra módulos simples (cadastros, consultas
 * unitárias).
 */
export interface PassthroughToolDef {
  name: string;
  description: string;
  inputSchema: { param: z.ZodTypeAny };
  resource: string;
  call: string;
  execute?: undefined;
  /** Inclui, altera ou exclui dado na Omie — exige confirmação explícita via HTTP (ver httpServer.ts). */
  destructive?: boolean;
  /** Cadastro de apoio que muda pouco (ex: famílias) — resposta cacheada por OMIE_CACHE_TTL_MS. */
  cacheable?: boolean;
}

/**
 * Ferramenta MCP com lógica própria (use-case): a Omie não entrega o dado já
 * pronto pro que o usuário pediu (ex: soma de estoque entre locais), então o
 * `execute` orquestra 1+ chamadas à Omie e aplica a regra de negócio antes de
 * devolver o resultado.
 */
export interface UseCaseToolDef {
  name: string;
  description: string;
  inputSchema: { param: z.ZodTypeAny };
  resource?: undefined;
  call?: undefined;
  execute: (client: OmieClient, param: Record<string, unknown>) => Promise<unknown>;
  /** Inclui, altera ou exclui dado na Omie — exige confirmação explícita via HTTP (ver httpServer.ts). */
  destructive?: boolean;
}

export type ToolDef = PassthroughToolDef | UseCaseToolDef;

export const paramSchema = z
  .record(z.unknown())
  .describe("Parâmetros da chamada, conforme documentação Omie para este método.");

/** Helper para declarar uma ToolDef com menos repetição. */
export function defineTool(def: ToolDef): ToolDef {
  return def;
}
