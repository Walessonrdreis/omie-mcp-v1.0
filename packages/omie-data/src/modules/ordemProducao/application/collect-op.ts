import type Database from "better-sqlite3";
import { IOrdemProducaoHttpClient } from "../../../domain/ordem-producao-http-client.js";

const REGISTROS_POR_PAGINA = 100;
const TETO_PAGINAS = 1000;
/**
 * Alinhado ao `INTERVALO_MINIMO_MS = 300` do `OmieClient` do servidor raiz
 * (src/integrations/omie/omieClient.ts): abaixo disso a Omie devolve
 * "consumo redundante" e a coleta das ~16 páginas de OP aborta no meio.
 */
export const ESPERA_ENTRE_PAGINAS_MS = 300;

function aguardar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function collectOrdemProducao(
  db: Database.Database,
  client: IOrdemProducaoHttpClient,
  esperaEntrePaginasMs: number = ESPERA_ENTRE_PAGINAS_MS
): Promise<number> {
  const upsert = db.prepare(`
    INSERT INTO raw_ordens_producao (codigo_op, payload_json, coletado_em)
    VALUES (@codigo_op, @payload_json, @coletado_em)
    ON CONFLICT(codigo_op) DO UPDATE SET
      payload_json = excluded.payload_json,
      coletado_em = excluded.coletado_em
  `);

  let pagina = 1;
  let totalPaginas = 1;
  let totalColetado = 0;
  const agora = new Date().toISOString();

  do {
    if (pagina > 1) {
      await aguardar(esperaEntrePaginasMs);
    }

    const resposta = await client.listarOrdensProducaoPagina(pagina, REGISTROS_POR_PAGINA);
    totalPaginas = Math.min(resposta.total_de_paginas, TETO_PAGINAS);

    for (const op of resposta.cadastros) {
      upsert.run({
        codigo_op: op.identificacao.nCodOP,
        payload_json: JSON.stringify(op),
        coletado_em: agora,
      });
      totalColetado++;
    }

    pagina++;
  } while (pagina <= totalPaginas);

  return totalColetado;
}
