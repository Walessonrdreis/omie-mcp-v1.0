import Database from "better-sqlite3";

export function abrirBanco(caminho: string): Database.Database {
  const db = new Database(caminho);

  db.exec(`
    CREATE TABLE IF NOT EXISTS raw_produtos (
      codigo_produto INTEGER PRIMARY KEY,
      payload_json TEXT NOT NULL,
      coletado_em TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS view_produtos (
      codigo_produto INTEGER PRIMARY KEY,
      codigo TEXT NOT NULL,
      nome TEXT NOT NULL,
      categoria TEXT NOT NULL,
      unidade TEXT NOT NULL,
      valor_formatado TEXT NOT NULL,
      ativo TEXT NOT NULL,
      gerado_em TEXT NOT NULL
    );
  `);

  return db;
}
