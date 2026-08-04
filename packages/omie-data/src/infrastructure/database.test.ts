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
});
