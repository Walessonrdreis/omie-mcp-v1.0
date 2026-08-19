#!/usr/bin/env node
import "dotenv/config";
// @ts-ignore - o pacote expõe types via subpath exports que o resolvedor
// NodeNext às vezes falha em casar (dist/esm/*.d.ts vs *.js); import válido em runtime.
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
// @ts-ignore
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { OmieClient, OmieApiError } from "./integrations/omie/omieClient.js";
import { genericToolDefinition, handleGenericCall } from "./tools/generic.js";
import { allTools, handleToolCall } from "./tools/registry.js";
import { carregarCredencialAtiva } from "./data/infrastructure/credenciais.js";

/**
 * Resolve a credencial da Omie que o servidor vai usar, nesta ordem:
 * 1. variáveis de ambiente (OMIE_APP_KEY/OMIE_APP_SECRET, ou .env);
 * 2. a credencial salva localmente pelo CLI `omie-data configurar`
 *    (em ~/.omie-data/), de forma que quem já configurou o CLI da skill
 *    não precise configurar de novo pro MCP;
 * 3. nenhuma → não derruba o servidor: cada chamada de ferramenta retorna
 *    erro claro pedindo pra configurar (o usuário configura e reinicia, ou
 *    o próximo acesso já funciona).
 */
function resolverCredencial(): { appKey: string; appSecret: string } | null {
  const envKey = process.env.OMIE_APP_KEY;
  const envSecret = process.env.OMIE_APP_SECRET;
  if (envKey && envSecret) {
    return { appKey: envKey, appSecret: envSecret };
  }

  const salva = carregarCredencialAtiva();
  if (salva) {
    return { appKey: salva.appKey, appSecret: salva.appSecret };
  }

  return null;
}

let client: OmieClient | null = null;

function getClient(): OmieClient {
  if (client) return client;

  // Tenta de novo a cada chamada: se o usuário configurou a credencial
  // (env/.env/omie-data configurar) depois que o servidor subiu, o
  // próximo acesso já funciona — sem precisar reiniciar.
  const credencial = resolverCredencial();
  if (!credencial) {
    throw new Error(
      "Credenciais da Omie não configuradas. Configure a credencial de acesso à API " +
        "com o comando: npx -y omie-data configurar --app-key SUA_APP_KEY --app-secret SEU_APP_SECRET " +
        "(ou defina OMIE_APP_KEY/OMIE_APP_SECRET no .env)."
    );
  }
  client = new OmieClient(credencial.appKey, credencial.appSecret);
  return client;
}

const server = new Server(
  { name: "omie-mcp", version: "0.1.0" },
  { capabilities: { tools: {} } }
);

function toContent(result: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}

function toErrorContent(err: unknown) {
  const message =
    err instanceof OmieApiError
      ? `Erro Omie${err.faultCode ? ` (${err.faultCode})` : ""}: ${err.message}`
      : err instanceof Error
      ? err.message
      : String(err);
  return {
    isError: true,
    content: [{ type: "text" as const, text: message }],
  };
}

/** Converte um schema zod pra JSON puro e remove o `$schema` (draft-07) que o
 * zod-to-json-schema injeta — clientes como o Claude Desktop exigem 2020-12
 * e rejeitam a chave. */
function jsonSchema(zodShape: Record<string, z.ZodTypeAny>): Record<string, unknown> {
  const s = zodToJsonSchema(z.object(zodShape)) as Record<string, unknown>;
  delete s.$schema;
  return s;
}

// Catálogo de ferramentas: genérica + dedicadas por módulo.
// O schema vai como JSON puro (sem $schema) pra ser válido em draft 2020-12.
const toolsCatalog = [
  {
    name: genericToolDefinition.name,
    description: genericToolDefinition.description,
    inputSchema: jsonSchema(genericToolDefinition.inputSchema),
    handler: async (args: any) => {
      try {
        return toContent(await handleGenericCall(getClient(), args as any));
      } catch (err) {
        return toErrorContent(err);
      }
    },
  },
  ...allTools.map((tool) => ({
    name: tool.name,
    description: tool.description,
    inputSchema: jsonSchema({ param: tool.inputSchema.param }),
    handler: async (args: any) => {
      try {
        return toContent(await handleToolCall(getClient(), tool.name, args as any));
      } catch (err) {
        return toErrorContent(err);
      }
    },
  })),
];

server.setRequestHandler(ListToolsRequestSchema, () => ({
  tools: toolsCatalog.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const tool = toolsCatalog.find((t) => t.name === name);
  if (!tool) {
    return toErrorContent(new Error(`Ferramenta desconhecida: ${name}`));
  }
  return tool.handler(args);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Servidor MCP Omie rodando via stdio.");
}

main().catch((err) => {
  console.error("Falha ao iniciar servidor MCP Omie:", err);
  process.exit(1);
});
