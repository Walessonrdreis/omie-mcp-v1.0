import type Database from "better-sqlite3";
import { IProdutosHttpClient } from "../domain/produtos-http-client.js";
import { collectProdutos } from "./collect-produtos.js";
import { translateProdutos } from "./translate-produtos.js";
import { consultarProdutos, FiltrosProdutos, ResultadoConsultaProdutos } from "./consultar-produtos.js";

export async function rodarProdutos(
  db: Database.Database,
  client: IProdutosHttpClient,
  atualizar: boolean,
  filtros?: FiltrosProdutos
): Promise<ResultadoConsultaProdutos> {
  if (atualizar) {
    await collectProdutos(db, client);
    translateProdutos(db);
  }

  return consultarProdutos(db, filtros);
}
