#!/usr/bin/env node
import "dotenv/config";
import crypto from "node:crypto";
import express, { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { OmieApiError, OmieClient } from "./integrations/omie/omieClient.js";
import { genericToolDefinition, handleGenericCall } from "./tools/generic.js";
import { allTools, handleToolCall } from "./tools/registry.js";

/**
 * Segundo transporte pra cima da MESMA lógica do servidor MCP (`allTools` +
 * `handleToolCall`, de `src/tools/registry.ts`) — uma API REST local, pra
 * ser consumida por um frontend/backend próprio sem precisar falar o
 * protocolo MCP.
 *
 * Uso LOCAL por enquanto:
 * - Autenticação por API key estática (header `Authorization: Bearer <key>`),
 *   ver `HTTP_API_KEY` no .env — gere uma com `npm run gerar-api-key`.
 * - Escuta só em 127.0.0.1 (não aceita conexão de fora da própria máquina).
 * Antes de expor isso pra fora (produção, outro servidor, internet), revisar
 * de novo — API key estática serve pro estágio atual (single-user, local),
 * não é suficiente sozinha pra multi-usuário/produção.
 */

const PORT = Number(process.env.HTTP_PORT ?? 3939);
const HOST = "127.0.0.1";

const HTTP_API_KEY = process.env.HTTP_API_KEY;
if (!HTTP_API_KEY) {
  console.error(
    "ERRO: HTTP_API_KEY não definida no .env — o servidor HTTP recusa iniciar sem uma chave."
  );
  console.error("Gere uma com: npm run gerar-api-key");
  process.exit(1);
}

const client = new OmieClient();
const app = express();
app.use(express.json());

function autenticar(req: Request, res: Response, next: NextFunction) {
  const cabecalho = req.header("authorization") ?? "";
  const [esquema, token] = cabecalho.split(" ");
  const chaveRecebida = esquema === "Bearer" ? token : undefined;

  const chaveEsperada = Buffer.from(HTTP_API_KEY as string);
  const chaveComparada = Buffer.from(chaveRecebida ?? "");
  const valida =
    chaveComparada.length === chaveEsperada.length &&
    crypto.timingSafeEqual(chaveComparada, chaveEsperada);

  if (!valida) {
    res.status(401).json({ erro: "Não autenticado. Use o header Authorization: Bearer <HTTP_API_KEY>." });
    return;
  }
  next();
}

app.use(autenticar);

/**
 * Rate limit simples (janela fixa): protege contra brute-force da API key e
 * contra um script/loop travado martelando o servidor (e, por tabela, a
 * Omie) sem limite. Como o servidor só aceita conexão de 127.0.0.1, a janela
 * é efetivamente global (todo tráfego vem do mesmo IP).
 */
const JANELA_RATE_LIMIT_MS = 60_000;
const LIMITE_REQUISICOES_POR_JANELA = 120;
let inicioJanela = Date.now();
let requisicoesNaJanela = 0;

function rateLimit(req: Request, res: Response, next: NextFunction) {
  const agora = Date.now();
  if (agora - inicioJanela >= JANELA_RATE_LIMIT_MS) {
    inicioJanela = agora;
    requisicoesNaJanela = 0;
  }
  requisicoesNaJanela += 1;
  if (requisicoesNaJanela > LIMITE_REQUISICOES_POR_JANELA) {
    res.status(429).json({ erro: "Muitas requisições — tente novamente em instantes." });
    return;
  }
  next();
}

app.use(rateLimit);

/**
 * Nomes de método Omie que alteram dado (convenção Omie: Incluir/Alterar/
 * Excluir/...). Usado só pra decidir se `omie_chamar_api` (que pode chamar
 * QUALQUER método) exige confirmação — ferramentas específicas já declaram
 * isso via `destructive` em `ToolDef`.
 */
const PREFIXOS_CALL_DESTRUTIVA = /^(incluir|alterar|excluir|cancelar|deletar)/i;

function ehChamadaDestrutiva(nome: string, payload: Record<string, unknown>): boolean {
  if (nome === genericToolDefinition.name) {
    const call = typeof payload.call === "string" ? payload.call : "";
    return PREFIXOS_CALL_DESTRUTIVA.test(call);
  }
  const tool = allTools.find((t) => t.name === nome);
  return tool?.destructive === true;
}

class ConfirmacaoNecessaria extends Error {
  constructor() {
    super(
      "Esta operação altera dado na Omie (incluir/alterar/excluir). Envie o campo " +
        "\"confirmar\": true no payload pra confirmar que a chamada é intencional."
    );
  }
}

function schemaDaFerramenta(nome: string): Record<string, unknown> {
  // zod-to-json-schema v3 só gera draft-07 — remove o $schema pra não
  // rejeitar clientes que exigem 2020-12 (mesmo tratamento do registro MCP).
  const semSchema = (s: Record<string, unknown>): Record<string, unknown> => {
    delete s.$schema;
    return s;
  };
  if (nome === genericToolDefinition.name) {
    return semSchema(zodToJsonSchema(z.object(genericToolDefinition.inputSchema), nome));
  }
  const tool = allTools.find((t) => t.name === nome);
  if (!tool) return {};
  return semSchema(zodToJsonSchema(z.object({ param: tool.inputSchema.param }), nome));
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

async function executarFerramenta(nome: string, payloadOriginal: Record<string, unknown>) {
  const { confirmar, ...payload } = payloadOriginal;

  if (ehChamadaDestrutiva(nome, nome === genericToolDefinition.name ? payloadOriginal : payload)) {
    if (confirmar !== true) {
      throw new ConfirmacaoNecessaria();
    }
  }

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
  if (err instanceof ConfirmacaoNecessaria) {
    res.status(400).json({ erro: err.message });
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
  console.error("Autenticação: header Authorization: Bearer <HTTP_API_KEY> obrigatório em toda rota.");
  console.error(`GET  http://${HOST}:${PORT}/tools               — lista as ferramentas (+ ?schema pra ver o payload de cada uma)`);
  console.error(`GET  http://${HOST}:${PORT}/tools/<nome>/schema — schema do payload de uma ferramenta específica`);
  console.error(`GET  http://${HOST}:${PORT}/tools/<nome>?campo=valor — chama a ferramenta direto pela URL`);
  console.error(`POST http://${HOST}:${PORT}/tools/<nome>         — chama a ferramenta (body JSON = payload)`);
});
