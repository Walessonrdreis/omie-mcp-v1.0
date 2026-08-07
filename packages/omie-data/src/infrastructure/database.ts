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

    CREATE TABLE IF NOT EXISTS raw_estoque (
      codigo_produto INTEGER,
      codigo_local_estoque INTEGER,
      payload_json TEXT NOT NULL,
      coletado_em TEXT NOT NULL,
      PRIMARY KEY (codigo_produto, codigo_local_estoque)
    );
  `);

  // Migração: adiciona colunas de estoque em view_produtos se não existirem
  for (const col of ["quantidade_em_estoque", "valor_em_estoque_custo", "valor_em_estoque_venda"]) {
    try {
      db.exec(`ALTER TABLE view_produtos ADD COLUMN ${col} REAL NOT NULL DEFAULT 0`);
    } catch {
      // coluna já existe — ignora
    }
  }

  return db;
}
