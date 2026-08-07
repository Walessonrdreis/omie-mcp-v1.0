import { describe, expect, it } from "vitest";
import { abrirBanco } from "../../../infrastructure/database.js";
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

  it("usa valores padrão quando campos vêm ausentes (não quebra a tradução)", () => {
    const db = abrirBanco(":memory:");

    db.prepare(
      "INSERT INTO raw_produtos (codigo_produto, payload_json, coletado_em) VALUES (?, ?, ?)"
    ).run(
      3,
      JSON.stringify({
        codigo_produto: 3,
        inativo: "N",
        codigo_familia: 0,
      }),
      new Date().toISOString()
    );

    const total = translateProdutos(db);

    expect(total).toBe(1);

    const view = db.prepare("SELECT * FROM view_produtos WHERE codigo_produto = 3").get() as any;
    expect(view.codigo).toBe("3");
    expect(view.nome).toBe("(sem nome)");
    expect(view.unidade).toBe("-");
    expect(view.valor_formatado).toBe("R$ 0,00");

    db.close();
  });

  it("faz join com raw_estoque e calcula quantidade e valor em estoque", () => {
    const db = abrirBanco(":memory:");

    // Insere produto
    db.prepare(
      "INSERT INTO raw_produtos (codigo_produto, payload_json, coletado_em) VALUES (?, ?, ?)"
    ).run(
      1,
      JSON.stringify({
        codigo_produto: 1, codigo: "A", descricao: "Produto A", unidade: "UN",
        valor_unitario: 10, inativo: "N", codigo_familia: 1, descricao_familia: "Cat X",
      }),
      new Date().toISOString()
    );

    // Insere duas posições de estoque pro mesmo produto (locais diferentes)
    const agora = new Date().toISOString();
    db.prepare(
      "INSERT INTO raw_estoque (codigo_produto, codigo_local_estoque, payload_json, coletado_em) VALUES (?, ?, ?, ?)"
    ).run(1, 1, JSON.stringify({
      cCodigo: "P1", cDescricao: "Prod 1", codigo_local_estoque: 1,
      fisico: 10, nCodProd: 1, nSaldo: 8, reservado: 2, nPendente: 0, nCMC: 5.5,
    }), agora);
    db.prepare(
      "INSERT INTO raw_estoque (codigo_produto, codigo_local_estoque, payload_json, coletado_em) VALUES (?, ?, ?, ?)"
    ).run(1, 2, JSON.stringify({
      cCodigo: "P1", cDescricao: "Prod 1", codigo_local_estoque: 2,
      fisico: 20, nCodProd: 1, nSaldo: 18, reservado: 2, nPendente: 0, nCMC: 3.0,
    }), agora);

    translateProdutos(db);

    const view = db.prepare("SELECT * FROM view_produtos WHERE codigo_produto = 1").get() as any;
    expect(view.quantidade_em_estoque).toBe(30);        // 10 + 20
    expect(view.valor_em_estoque_custo).toBe(115);       // 10*5.5 + 20*3.0 = 55 + 60
    expect(view.valor_em_estoque_venda).toBe(300);       // 30 * 10

    db.close();
  });

  it("produto sem estoque fica com zero nas colunas de estoque", () => {
    const db = abrirBanco(":memory:");

    db.prepare(
      "INSERT INTO raw_produtos (codigo_produto, payload_json, coletado_em) VALUES (?, ?, ?)"
    ).run(
      1,
      JSON.stringify({
        codigo_produto: 1, codigo: "A", descricao: "Produto A", unidade: "UN",
        valor_unitario: 10, inativo: "N", codigo_familia: 1,
      }),
      new Date().toISOString()
    );

    translateProdutos(db);

    const view = db.prepare("SELECT * FROM view_produtos WHERE codigo_produto = 1").get() as any;
    expect(view.quantidade_em_estoque).toBe(0);
    expect(view.valor_em_estoque_custo).toBe(0);
    expect(view.valor_em_estoque_venda).toBe(0);

    db.close();
  });
});
