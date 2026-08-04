import type Database from "better-sqlite3";
import { IOmieHttpClient } from "../domain/omie-http-client.js";

const REGISTROS_POR_PAGINA = 100;

export async function collectProdutos(
  db: Database.Database,
  client: IOmieHttpClient
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
    const resposta = await client.listarProdutosPagina(pagina, REGISTROS_POR_PAGINA);
    totalPaginas = resposta.total_de_paginas;

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
