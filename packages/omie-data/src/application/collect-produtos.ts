import type Database from "better-sqlite3";
import { IOmieHttpClient } from "../domain/omie-http-client.js";

const REGISTROS_POR_PAGINA = 100;
const TETO_PAGINAS = 1000;
const ESPERA_ENTRE_PAGINAS_MS = 200;

function aguardar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function collectProdutos(
  db: Database.Database,
  client: IOmieHttpClient,
  esperaEntrePaginasMs: number = ESPERA_ENTRE_PAGINAS_MS
): Promise<number> {
  const upsert = db.prepare(`
    INSERT INTO raw_produtos (codigo_produto, payload_json, coletado_em)
    VALUES (@codigo_produto, @payload_json, @coletado_em)
    ON CONFLICT(codigo_produto) DO UPDATE SET
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

    const resposta = await client.listarProdutosPagina(pagina, REGISTROS_POR_PAGINA);
    totalPaginas = Math.min(resposta.total_de_paginas, TETO_PAGINAS);

    for (const produto of resposta.produto_servico_cadastro) {
      upsert.run({
        codigo_produto: produto.codigo_produto,
        payload_json: JSON.stringify(produto),
        coletado_em: agora,
      });
      totalColetado++;
    }

    pagina++;
  } while (pagina <= totalPaginas);

  return totalColetado;
}
