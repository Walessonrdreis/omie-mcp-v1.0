#!/usr/bin/env node
import "dotenv/config";
import express, { Request, Response } from "express";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { OmieApiError, OmieClient } from "./omieClient.js";
import { genericToolDefinition, handleGenericCall } from "./tools/generic.js";
import { allTools, handleToolCall } from "./tools/registry.js";

/**
 * Segundo transporte pra cima da MESMA lógica do servidor MCP (`allTools` +
 * `handleToolCall`, de `src/tools/registry.ts`) — uma API REST local, pra
 * ser consumida por um frontend/backend próprio sem precisar falar o
 * protocolo MCP.
 *
 * ATENÇÃO — só pra uso LOCAL por enquanto:
 * - Sem autenticação nenhuma.
 * - Sem validação de origem (CORS aberto pra localhost).
 * - Escuta só em 127.0.0.1 (não aceita conexão de fora da própria máquina).
 * Antes de expor isso pra fora (produção, outro servidor, internet), é
 * preciso adicionar autenticação e revisar segurança — mesma ressalva já
 * feita sobre transformar o omie-mcp num Connector remoto.
 */

const PORT = Number(process.env.HTTP_PORT ?? 3939);
const HOST = "127.0.0.1";

const client = new OmieClient();
const app = express();
app.use(express.json());

function schemaDaFerramenta(nome: string): Record<string, unknown> {
  if (nome === genericToolDefinition.name) {
    return zodToJsonSchema(z.object(genericToolDefinition.inputSchema), nome);
  }
  const tool = allTools.find((t) => t.name === nome);
  if (!tool) return {};
  return zodToJsonSchema(z.object({ param: tool.inputSchema.param }), nome);
}

/**
 * Converte query string (tudo vem como texto) pra um objeto com tipos —
 * cada valor é tentado como JSON (número, boolean, array, objeto); se não
 * for JSON válido, mantém como string. Permite montar o payload direto na
 * URL do navegador, ex: ?pagina=1&apenas_com_estoque=true.
 */
function payloadDaQuery(query: Request["query"]): Record<string, unknown> {
  const payload: Record<string, unknown> = {};
  for (const [chave, valor] of Object.entries(query)) {
    if (typeof valor !== "string") {
      payload[chave] = valor;
      continue;
    }
    try {
      payload[chave] = JSON.parse(valor);
    } catch {
      payload[chave] = valor;
    }
  }
  return payload;
}

async function executarFerramenta(nome: string, payload: Record<string, unknown>) {
  if (nome === genericToolDefinition.name) {
    return handleGenericCall(client, payload as any);
  }
  const tool = allTools.find((t) => t.name === nome);
  if (!tool) {
    throw new NaoEncontrada(nome);
  }
  return handleToolCall(client, nome, { param: payload });
}

class NaoEncontrada extends Error {
  constructor(nome: string) {
    super(`Ferramenta desconhecida: ${nome}`);
  }
}

function tratarErro(err: unknown, res: Response) {
  if (err instanceof NaoEncontrada) {
    res.status(404).json({ erro: err.message });
    return;
  }
  const mensagem =
    err instanceof OmieApiError
      ? `Erro Omie${err.faultCode ? ` (${err.faultCode})` : ""}: ${err.message}`
      : err instanceof Error
      ? err.message
      : String(err);
  res.status(502).json({ erro: mensagem });
}

app.get("/tools", (req: Request, res: Response) => {
  const comSchema = req.query.schema !== undefined;
  const ferramentas = [
    { name: genericToolDefinition.name, description: genericToolDefinition.description },
    ...allTools.map((t) => ({ name: t.name, description: t.description })),
  ].map((t) => (comSchema ? { ...t, schema: schemaDaFerramenta(t.name) } : t));
  res.json({ ferramentas });
});

app.get("/tools/:name/schema", (req: Request, res: Response) => {
  const nome = String(req.params.name);
  const existe =
    nome === genericToolDefinition.name || allTools.some((t) => t.name === nome);
  if (!existe) {
    res.status(404).json({ erro: `Ferramenta desconhecida: ${nome}` });
    return;
  }
  res.json({ name: nome, schema: schemaDaFerramenta(nome) });
});

// GET: pra testar/chamar direto pela URL do navegador — payload vem da query string.
app.get("/tools/:name", async (req: Request, res: Response) => {
  const nome = String(req.params.name);
  try {
    const resultado = await executarFerramenta(nome, payloadDaQuery(req.query));
    res.json(resultado);
  } catch (err) {
    tratarErro(err, res);
  }
});

// POST: payload vai no corpo JSON — melhor pra payloads grandes/aninhados.
app.post("/tools/:name", async (req: Request, res: Response) => {
  const nome = String(req.params.name);
  try {
    const resultado = await executarFerramenta(nome, req.body ?? {});
    res.json(resultado);
  } catch (err) {
    tratarErro(err, res);
  }
});

app.listen(PORT, HOST, () => {
  console.error(`Servidor HTTP local do omie-mcp rodando em http://${HOST}:${PORT}`);
  console.error("AVISO: sem autenticação, uso local apenas — não expor além desta máquina.");
  console.error(`GET  http://${HOST}:${PORT}/tools               — lista as ferramentas (+ ?schema pra ver o payload de cada uma)`);
  console.error(`GET  http://${HOST}:${PORT}/tools/<nome>/schema — schema do payload de uma ferramenta específica`);
  console.error(`GET  http://${HOST}:${PORT}/tools/<nome>?campo=valor — chama a ferramenta direto pela URL`);
  console.error(`POST http://${HOST}:${PORT}/tools/<nome>         — chama a ferramenta (body JSON = payload)`);
});
