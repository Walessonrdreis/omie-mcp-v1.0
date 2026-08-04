import type Database from "better-sqlite3";
import { IOmieHttpClient } from "../domain/omie-http-client.js";
import { collectProdutos } from "./collect-produtos.js";
import { translateProdutos } from "./translate-produtos.js";
import { consultarProdutos, ResultadoConsultaProdutos } from "./consultar-produtos.js";

export async function rodarProdutos(
  db: Database.Database,
  client: IOmieHttpClient,
  atualizar: boolean
): Promise<ResultadoConsultaProdutos> {
  if (atualizar) {
    await collectProdutos(db, client);
    translateProdutos(db);
  }

  return consultarProdutos(db);
}
