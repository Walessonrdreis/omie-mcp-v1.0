import { describe, expect, it } from "vitest";
import { abrirBanco } from "../../../infrastructure/database.js";
import { FakeHttpClient } from "../../../infrastructure/fake-http-client.js";
import { PosicaoEstoqueOmieBruta } from "../domain/estoque.js";
import { collectEstoque } from "./collect-estoque.js";

describe("collectEstoque", () => {
  it("grava cada posição em raw_estoque com payload bruto", async () => {
    const db = abrirBanco(":memory:");
    const posicoes: PosicaoEstoqueOmieBruta[] = [
      { cCodigo: "P1", cDescricao: "Prod 1", codigo_local_estoque: 1, fisico: 10, nCodProd: 100, nSaldo: 8, reservado: 2, nPendente: 0, nCMC: 5.5 },
    ];
    const client = new FakeHttpClient([], posicoes);

    const total = await collectEstoque(db, client);

    expect(total).toBe(1);

    const linha = db.prepare(
      "SELECT codigo_produto, codigo_local_estoque, payload_json, coletado_em FROM raw_estoque WHERE codigo_produto = 100 AND codigo_local_estoque = 1"
    ).get() as any;

    expect(linha.codigo_produto).toBe(100);
    expect(JSON.parse(linha.payload_json).fisico).toBe(10);
    expect(linha.coletado_em).toBeTruthy();

    db.close();
  });

  it("faz upsert: mesmo produto+local rodado duas vezes não duplica", async () => {
    const db = abrirBanco(":memory:");
    const posicoes: PosicaoEstoqueOmieBruta[] = [
      { cCodigo: "P1", cDescricao: "Prod 1", codigo_local_estoque: 1, fisico: 10, nCodProd: 100, nSaldo: 8, reservado: 2, nPendente: 0, nCMC: 5.5 },
    ];
    const client = new FakeHttpClient([], posicoes);

    await collectEstoque(db, client);
    await collectEstoque(db, client);

    const linhas = db.prepare("SELECT COUNT(*) as total FROM raw_estoque").get() as { total: number };
    expect(linhas.total).toBe(1);

    db.close();
  });

  it("aguarda entre páginas quando há mais de uma", async () => {
    const db = abrirBanco(":memory:");
    const posicoes = Array.from({ length: 150 }, (_, i) => ({
      cCodigo: `P${i + 1}`, cDescricao: `Prod ${i + 1}`, codigo_local_estoque: 1,
      fisico: 10, nCodProd: i + 1, nSaldo: 8, reservado: 2, nPendente: 0, nCMC: 5,
    }));
    const client = new FakeHttpClient([], posicoes);

    const total = await collectEstoque(db, client, 0); // sem espera no teste

    expect(total).toBe(150);
    db.close();
  });
});
