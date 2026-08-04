import { describe, expect, it } from "vitest";
import { FakeOmieHttpClient } from "./fake-omie-http-client.js";

describe("FakeOmieHttpClient", () => {
  it("devolve os produtos configurados, paginados", async () => {
    const client = new FakeOmieHttpClient([
      { codigo_produto: 1, codigo: "A", descricao: "Produto A", unidade: "UN", valor_unitario: 10, inativo: "N", codigo_familia: 1, descricao_familia: "Fam 1" },
      { codigo_produto: 2, codigo: "B", descricao: "Produto B", unidade: "UN", valor_unitario: 20, inativo: "N", codigo_familia: 1, descricao_familia: "Fam 1" },
    ]);

    const pagina1 = await client.listarProdutosPagina(1, 1);

    expect(pagina1.pagina).toBe(1);
    expect(pagina1.total_de_paginas).toBe(2);
    expect(pagina1.produto_servico_cadastro).toHaveLength(1);
    expect(pagina1.produto_servico_cadastro[0].codigo).toBe("A");
  });
});
