import path from "node:path";
import { abrirBanco, diretorioDados, hashCredencial } from "omie-data";

/**
 * Tipo do handle de banco devolvido por `abrirBanco`. Derivado por `ReturnType`
 * de propósito: `better-sqlite3` (e seus tipos) é dependência do pacote
 * `omie-data`, não da raiz — importar `better-sqlite3` aqui quebraria o `tsc`
 * da raiz sem acrescentar nada.
 */
export type BancoOp = ReturnType<typeof abrirBanco>;

/**
 * Reproduz exatamente a composição usada pelo CLI do `omie-data`
 * (`path.join(diretorioDados(), `${hash}.db`)`), pra que MCP e CLI leiam e
 * escrevam no MESMO arquivo de cache — é isso que dá sentido ao cache
 * compartilhado.
 */
export function caminhoBancoAtivo(appKey: string): string {
  return path.join(diretorioDados(), `${hashCredencial(appKey)}.db`);
}

export interface CredenciaisOmie {
  appKey: string;
  appSecret: string;
}

export function credenciaisOmieOuFalha(): CredenciaisOmie {
  const appKey = process.env.OMIE_APP_KEY;
  const appSecret = process.env.OMIE_APP_SECRET;
  if (!appKey || !appSecret) {
    throw new Error(
      "Credenciais da Omie não configuradas. Defina OMIE_APP_KEY e OMIE_APP_SECRET no .env."
    );
  }
  return { appKey, appSecret };
}

export function abrirBancoAtivo(appKey: string): BancoOp {
  return abrirBanco(caminhoBancoAtivo(appKey));
}
