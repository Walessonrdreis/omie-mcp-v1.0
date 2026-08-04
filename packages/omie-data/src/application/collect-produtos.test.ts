import { describe, expect, it } from "vitest";
import { abrirBanco } from "../infrastructure/database.js";
import { FakeOmieHttpClient } from "../infrastructure/fake-omie-http-client.js";
import { collectProdutos } from "./collect-produtos.js";

describe("collectProdutos", () => {
  it("grava cada produto em raw_produtos com payload bruto e timestamp", async () => {
    const db = abrirBanco(":memory:");
    const client = new FakeOmieHttpClient([
      { codigo_produto: 1, codigo: "A", descricao: "Produto A", unidade: "UN", valor_unitario: 10, inativo: "N", codigo_familia: 1, descricao_familia: "Fam 1" },
    ]);

    const total = await collectProdutos(db, client);

    expect(total).toBe(1);

    const linha = db
      .prepare("SELECT codigo_produto, payload_json, coletado_em FROM raw_produtos WHERE codigo_produto = 1")
      .get() as { codigo_produto: number; payload_json: string; coletado_em: string };

    expect(linha.codigo_produto).toBe(1);
    expect(JSON.parse(linha.payload_json).codigo).toBe("A");
    expect(linha.coletado_em).toBeTruthy();

    db.close();
  });

  it("faz upsert: rodar duas vezes não duplica linha", async () => {
    const db = abrirBanco(":memory:");
    const client = new FakeOmieHttpClient([
      { codigo_produto: 1, codigo: "A", descricao: "Produto A", unidade: "UN", valor_unitario: 10, inativo: "N", codigo_familia: 1 },
    ]);

    await collectProdutos(db, client);
    await collectProdutos(db, client);

    const linhas = db.prepare("SELECT COUNT(*) as total FROM raw_produtos").get() as { total: number };
    expect(linhas.total).toBe(1);

    db.close();
  });

  it("aguarda entre páginas quando há mais de uma", async () => {
    const db = abrirBanco(":memory:");
    const produtos = Array.from({ length: 150 }, (_, i) => ({
      codigo_produto: i + 1,
      codigo: `P${i + 1}`,
      descricao: `Produto ${i + 1}`,
      unidade: "UN",
      valor_unitario: 10,
      inativo: "N" as const,
      codigo_familia: 1,
    }));
    const client = new FakeOmieHttpClient(produtos);

    const total = await collectProdutos(db, client, 0);

    expect(total).toBe(150);

    db.close();
  });
});
