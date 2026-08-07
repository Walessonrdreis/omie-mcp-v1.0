import { describe, expect, it } from "vitest";
import { abrirBanco } from "./database.js";

describe("abrirBanco", () => {
  it("cria as tabelas raw_produtos e view_produtos", () => {
    const db = abrirBanco(":memory:");

    const tabelas = db
      .prepare("SELECT name FROM sqlite_master WHERE type = 'table'")
      .all()
      .map((linha: any) => linha.name);

    expect(tabelas).toContain("raw_produtos");
    expect(tabelas).toContain("view_produtos");

    db.close();
  });

  it("cria a tabela raw_estoque com PK composta", () => {
    const db = abrirBanco(":memory:");
    const tabelas = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((l: any) => l.name);
    expect(tabelas).toContain("raw_estoque");

    // Verifica colunas de raw_estoque
    const cols = db.prepare("PRAGMA table_info(raw_estoque)").all() as any[];
    const nomes = cols.map((c: any) => c.name);
    expect(nomes).toContain("codigo_produto");
    expect(nomes).toContain("codigo_local_estoque");
    expect(nomes).toContain("payload_json");
    expect(nomes).toContain("coletado_em");

    db.close();
  });

  it("view_produtos tem as 3 colunas de estoque", () => {
    const db = abrirBanco(":memory:");
    const cols = db.prepare("PRAGMA table_info(view_produtos)").all() as any[];
    const nomes = cols.map((c: any) => c.name);
    expect(nomes).toContain("quantidade_em_estoque");
    expect(nomes).toContain("valor_em_estoque_custo");
    expect(nomes).toContain("valor_em_estoque_venda");
    db.close();
  });
});
