import { describe, expect, it } from "vitest";
import { abrirBanco } from "../../../infrastructure/database.js";
import { translateOrdemProducao } from "./translate-op.js";

function inserirProduto(db: any, codigo: number, codigoTexto: string, descricao: string) {
  db.prepare(
    "INSERT INTO raw_produtos (codigo_produto, payload_json, coletado_em) VALUES (?, ?, ?)"
  ).run(
    codigo,
    JSON.stringify({
      codigo_produto: codigo, codigo: codigoTexto, descricao, unidade: "UN",
      valor_unitario: 10, inativo: "N", codigo_familia: 1,
    }),
    new Date().toISOString()
  );
}

function inserirOpBruta(db: any, nCodOP: number, nCodProduto: number, cConcluida: "S" | "N") {
  db.prepare(
    "INSERT INTO raw_ordens_producao (codigo_op, payload_json, coletado_em) VALUES (?, ?, ?)"
  ).run(
    nCodOP,
    JSON.stringify({
      identificacao: {
        cCodIntOP: "", cNumOP: `2024/${nCodOP}`, codigo_local_estoque: 1,
        dDtPrevisao: "01/01/2024", nCodOP, nCodProduto, nQtde: 25,
      },
      infAdicionais: { cEtapa: "80", dDtConclusao: "02/01/2024", dDtInicio: "01/01/2024", nCodProjeto: 0 },
      // Valor DIFERENTE de dDtConclusao de propósito: são campos distintos com
      // nomes quase iguais, e a view tem que usar infAdicionais.dDtConclusao.
      outrasInf: { cConcluida, dConclusao: "31/12/2099", dInclusao: "01/01/2024" },
    }),
    new Date().toISOString()
  );
}

describe("translateOrdemProducao", () => {
  it("faz join com raw_produtos e traz descrição/SKU do produto", () => {
    const db = abrirBanco(":memory:");
    inserirProduto(db, 1, "SKU-A", "Produto A");
    inserirOpBruta(db, 100, 1, "S");

    translateOrdemProducao(db);

    const view = db.prepare("SELECT * FROM view_ordens_producao WHERE codigo_op = 100").get() as any;
    expect(view.numero_op).toBe("2024/100");
    expect(view.codigo_produto).toBe(1);
    expect(view.codigo_sku).toBe("SKU-A");
    expect(view.descricao_produto).toBe("Produto A");
    expect(view.quantidade).toBe(25);
    expect(view.concluida).toBe(1);
    expect(view.etapa_codigo).toBe("80");

    db.close();
  });

  it("produto não encontrado no cache vira fallback legível", () => {
    const db = abrirBanco(":memory:");
    inserirOpBruta(db, 200, 999, "N");

    translateOrdemProducao(db);

    const view = db.prepare("SELECT * FROM view_ordens_producao WHERE codigo_op = 200").get() as any;
    expect(view.codigo_sku).toBe("");
    expect(view.descricao_produto).toBe("(produto não encontrado)");
    expect(view.concluida).toBe(0);

    db.close();
  });

  it("data_conclusao vem de infAdicionais.dDtConclusao, não de outrasInf.dConclusao", () => {
    const db = abrirBanco(":memory:");
    inserirProduto(db, 1, "SKU-A", "Produto A");
    inserirOpBruta(db, 300, 1, "S");

    translateOrdemProducao(db);

    const view = db.prepare("SELECT * FROM view_ordens_producao WHERE codigo_op = 300").get() as any;
    expect(view.data_conclusao).toBe("02/01/2024");
    expect(view.data_conclusao).not.toBe("31/12/2099");
    expect(view.data_previsao).toBe("01/01/2024");
    expect(view.data_inicio).toBe("01/01/2024");

    db.close();
  });

  it("é idempotente: rodar duas vezes não duplica nem corrompe a view", () => {
    const db = abrirBanco(":memory:");
    inserirProduto(db, 1, "SKU-A", "Produto A");
    inserirOpBruta(db, 400, 1, "S");
    inserirOpBruta(db, 401, 1, "N");

    expect(translateOrdemProducao(db)).toBe(2);
    expect(translateOrdemProducao(db)).toBe(2);

    const total = db.prepare("SELECT COUNT(*) AS n FROM view_ordens_producao").get() as any;
    expect(total.n).toBe(2);

    const view = db.prepare("SELECT * FROM view_ordens_producao WHERE codigo_op = 400").get() as any;
    expect(view.descricao_produto).toBe("Produto A");
    expect(view.concluida).toBe(1);

    db.close();
  });

  it("reprocessa a view com o dado novo quando o produto muda no cache", () => {
    const db = abrirBanco(":memory:");
    inserirOpBruta(db, 500, 7, "N");

    translateOrdemProducao(db);
    const antes = db.prepare("SELECT * FROM view_ordens_producao WHERE codigo_op = 500").get() as any;
    expect(antes.descricao_produto).toBe("(produto não encontrado)");

    inserirProduto(db, 7, "SKU-G", "Produto G");
    translateOrdemProducao(db);

    const depois = db.prepare("SELECT * FROM view_ordens_producao WHERE codigo_op = 500").get() as any;
    expect(depois.descricao_produto).toBe("Produto G");
    expect(depois.codigo_sku).toBe("SKU-G");

    db.close();
  });
});
