#!/usr/bin/env node
import "dotenv/config";
// @ts-ignore - o pacote expõe types via subpath exports que o resolvedor
// NodeNext às vezes falha em casar (dist/esm/*.d.ts vs *.js); import válido em runtime.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
// @ts-ignore
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { OmieClient, OmieApiError } from "./omieClient.js";
import { genericToolDefinition, handleGenericCall } from "./tools/generic.js";
import { allTools, handleToolCall } from "./tools/registry.js";

const server = new McpServer({
  name: "omie-mcp",
  version: "0.1.0",
});

let client: OmieClient;
try {
  client = new OmieClient();
} catch (err) {
  // Ainda registramos o servidor para que o erro apareça de forma clara
  // quando uma ferramenta for chamada, em vez de derrubar o processo.
  console.error((err as Error).message);
}

function getClient(): OmieClient {
  if (!client) {
    client = new OmieClient();
  }
  return client;
}

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

// Ferramenta genérica: cobre todos os módulos da Omie (financeiro, CRM,
// vendas, NF-e, serviços, cadastros, etc.)
server.registerTool(
  genericToolDefinition.name,
  {
    description: genericToolDefinition.description,
    inputSchema: genericToolDefinition.inputSchema,
  },
  async (args: any) => {
    try {
      const result = await handleGenericCall(getClient(), args as any);
      return toContent(result);
    } catch (err) {
      return toErrorContent(err);
    }
  }
);

// Ferramentas dedicadas por módulo (produção, produtos, estoque, compras,
// e futuramente financeiro, CRM, vendas, etc. — ver src/tools/registry.ts)
for (const tool of allTools) {
  server.registerTool(
    tool.name,
    {
      description: tool.description,
      inputSchema: tool.inputSchema,
    },
    async (args: any) => {
      try {
        const result = await handleToolCall(getClient(), tool.name, args as any);
        return toContent(result);
      } catch (err) {
        return toErrorContent(err);
      }
    }
  );
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Servidor MCP Omie rodando via stdio.");
}

main().catch((err) => {
  console.error("Falha ao iniciar servidor MCP Omie:", err);
  process.exit(1);
});
