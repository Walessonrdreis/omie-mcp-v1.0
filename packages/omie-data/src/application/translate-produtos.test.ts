import { describe, expect, it } from "vitest";
import { abrirBanco } from "../infrastructure/database.js";
import { translateProdutos } from "./translate-produtos.js";

describe("translateProdutos", () => {
  it("traduz raw_produtos pra view_produtos com campos legíveis", () => {
    const db = abrirBanco(":memory:");

    db.prepare(
      "INSERT INTO raw_produtos (codigo_produto, payload_json, coletado_em) VALUES (?, ?, ?)"
    ).run(
      1,
      JSON.stringify({
        codigo_produto: 1,
        codigo: "A",
        descricao: "Produto A",
        unidade: "UN",
        valor_unitario: 1234.5,
        inativo: "N",
        codigo_familia: 1,
        descricao_familia: "Categoria X",
      }),
      new Date().toISOString()
    );

    const total = translateProdutos(db);

    expect(total).toBe(1);

    const view = db
      .prepare("SELECT * FROM view_produtos WHERE codigo_produto = 1")
      .get() as any;

    expect(view.codigo).toBe("A");
    expect(view.nome).toBe("Produto A");
    expect(view.categoria).toBe("Categoria X");
    expect(view.valor_formatado).toBe("R$ 1.234,50");
    expect(view.ativo).toBe("Sim");
    expect(view.gerado_em).toBeTruthy();

    db.close();
  });

  it("usa 'Sem categoria' quando descricao_familia não vem", () => {
    const db = abrirBanco(":memory:");

    db.prepare(
      "INSERT INTO raw_produtos (codigo_produto, payload_json, coletado_em) VALUES (?, ?, ?)"
    ).run(
      2,
      JSON.stringify({
        codigo_produto: 2,
        codigo: "B",
        descricao: "Produto B",
        unidade: "UN",
        valor_unitario: 5,
        inativo: "S",
        codigo_familia: 0,
      }),
      new Date().toISOString()
    );

    translateProdutos(db);

    const view = db.prepare("SELECT * FROM view_produtos WHERE codigo_produto = 2").get() as any;
    expect(view.categoria).toBe("Sem categoria");
    expect(view.ativo).toBe("Não");

    db.close();
  });
});
