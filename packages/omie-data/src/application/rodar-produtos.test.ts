import { describe, expect, it } from "vitest";
import { abrirBanco } from "../infrastructure/database.js";
import { FakeOmieHttpClient } from "../infrastructure/fake-omie-http-client.js";
import { rodarProdutos } from "./rodar-produtos.js";

describe("rodarProdutos", () => {
  it("sem atualizar e sem dado prévio, retorna sem_dado", async () => {
    const db = abrirBanco(":memory:");
    const client = new FakeOmieHttpClient([]);

    const resultado = await rodarProdutos(db, client, false);

    expect(resultado.status).toBe("sem_dado");

    db.close();
  });

  it("com atualizar=true, coleta e traduz antes de consultar", async () => {
    const db = abrirBanco(":memory:");
    const client = new FakeOmieHttpClient([
      { codigo_produto: 1, codigo: "A", descricao: "Produto A", unidade: "UN", valor_unitario: 10, inativo: "N", codigo_familia: 1, descricao_familia: "Fam 1" },
    ]);

    const resultado = await rodarProdutos(db, client, true);

    expect(resultado.status).toBe("dado_disponivel");
    expect(resultado.produtos).toHaveLength(1);
    expect(resultado.produtos[0].nome).toBe("Produto A");

    db.close();
  });
});
