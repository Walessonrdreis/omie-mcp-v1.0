#!/usr/bin/env node
import "dotenv/config";
// @ts-ignore - o pacote expõe types via subpath exports que o resolvedor
// NodeNext às vezes falha em casar (dist/esm/*.d.ts vs *.js); import válido em runtime.
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
// @ts-ignore
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
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
 * 3. nenhuma → instrui o usuário a configurar e sai (não sobe o servidor).
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

const credencial = resolverCredencial();
if (!credencial) {
  console.error(
    [
      "Credenciais da Omie não configuradas.",
      "",
      "Para usar o servidor MCP Omie, configure a credencial de acesso à API.",
      "",
      "Comando:",
      "  npx -y omie-mcp configurar --app-key SUA_APP_KEY --app-secret SEU_APP_SECRET",
      "",
      "A App Key e o App Secret são criados em https://developer.omie.com.br/my-apps/.",
      "",
      "Dica: rodando sem argumentos, o comando abre um menu interativo que também configura.",
    ].join("\n")
  );
  process.exit(1);
}

const server = new McpServer({
  name: "omie-mcp",
  version: "0.1.0",
});

let client: OmieClient;
try {
  client = new OmieClient(credencial.appKey, credencial.appSecret);
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
