import type Database from "better-sqlite3";
import { IEstoqueHttpClient } from "../../../domain/estoque-http-client.js";

const REGISTROS_POR_PAGINA = 100;
const TETO_PAGINAS = 1000;
const ESPERA_ENTRE_PAGINAS_MS = 200;

function aguardar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function collectEstoque(
  db: Database.Database,
  client: IEstoqueHttpClient,
  esperaEntrePaginasMs: number = ESPERA_ENTRE_PAGINAS_MS
): Promise<number> {
  const upsert = db.prepare(`
    INSERT INTO raw_estoque (codigo_produto, codigo_local_estoque, payload_json, coletado_em)
    VALUES (@codigo_produto, @codigo_local_estoque, @payload_json, @coletado_em)
    ON CONFLICT(codigo_produto, codigo_local_estoque) DO UPDATE SET
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

    const resposta = await client.listarPosicoesEstoquePagina(pagina, REGISTROS_POR_PAGINA);
    totalPaginas = Math.min(resposta.total_de_paginas, TETO_PAGINAS);

    for (const posicao of resposta.pos_estoque) {
      upsert.run({
        codigo_produto: posicao.nCodProd,
        codigo_local_estoque: posicao.codigo_local_estoque,
        payload_json: JSON.stringify(posicao),
        coletado_em: agora,
      });
      totalColetado++;
    }

    pagina++;
  } while (pagina <= totalPaginas);

  return totalColetado;
}
