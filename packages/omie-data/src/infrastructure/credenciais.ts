import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { diretorioDados } from "./caminhos.js";

export function hashCredencial(appKey: string): string {
  return createHash("sha256").update(appKey).digest("hex").slice(0, 16);
}

function diretorioCredenciais(): string {
  return path.join(diretorioDados(), "credentials");
}

export function salvarCredencial(appKey: string, appSecret: string): string {
  const hash = hashCredencial(appKey);
  const dir = diretorioCredenciais();
  mkdirSync(dir, { recursive: true });

  writeFileSync(
    path.join(dir, `${hash}.json`),
    JSON.stringify({ app_key: appKey, app_secret: appSecret }, null, 2)
  );

  return hash;
}

export interface CredencialSalva {
  hash: string;
  appKey: string;
  appSecret: string;
}

export function carregarCredencialAtiva(): CredencialSalva | null {
  const dir = diretorioCredenciais();
  if (!existsSync(dir)) return null;

  const arquivos = readdirSync(dir).filter((nome) => nome.endsWith(".json"));
  if (arquivos.length === 0) return null;

  const [arquivo] = arquivos;
  const hash = arquivo.replace(/\.json$/, "");
  const conteudo = JSON.parse(readFileSync(path.join(dir, arquivo), "utf-8"));

  return { hash, appKey: conteudo.app_key, appSecret: conteudo.app_secret };
}
