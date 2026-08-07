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

    CREATE TABLE IF NOT EXISTS raw_ordens_producao (
      codigo_op INTEGER PRIMARY KEY,
      payload_json TEXT NOT NULL,
      coletado_em TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS view_ordens_producao (
      codigo_op INTEGER PRIMARY KEY,
      numero_op TEXT NOT NULL,
      codigo_produto INTEGER NOT NULL,
      codigo_sku TEXT NOT NULL,
      descricao_produto TEXT NOT NULL,
      quantidade REAL NOT NULL,
      data_previsao TEXT NOT NULL,
      data_inicio TEXT NOT NULL,
      data_conclusao TEXT NOT NULL,
      concluida INTEGER NOT NULL DEFAULT 0,
      etapa_codigo TEXT NOT NULL,
      gerado_em TEXT NOT NULL
    );
  `);

  // Migração: adiciona colunas de estoque em view_produtos se não existirem
  for (const col of ["quantidade_em_estoque", "valor_em_estoque_custo", "valor_em_estoque_venda"]) {
    try {
      db.exec(`ALTER TABLE view_produtos ADD COLUMN ${col} REAL NOT NULL DEFAULT 0`);
    } catch (error) {
      if (!(error as Error).message.includes("duplicate column name")) {
        throw error;
      }
      // coluna já existe — ignora
    }
  }

  return db;
}
