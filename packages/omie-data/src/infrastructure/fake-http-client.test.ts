import { describe, expect, it } from "vitest";
import { FakeHttpClient } from "./fake-http-client.js";
import { PosicaoEstoqueOmieBruta } from "../modules/estoque/domain/estoque.js";

describe("FakeHttpClient", () => {
  it("devolve os produtos configurados, paginados", async () => {
    const client = new FakeHttpClient([
      { codigo_produto: 1, codigo: "A", descricao: "Produto A", unidade: "UN", valor_unitario: 10, inativo: "N", codigo_familia: 1, descricao_familia: "Fam 1" },
      { codigo_produto: 2, codigo: "B", descricao: "Produto B", unidade: "UN", valor_unitario: 20, inativo: "N", codigo_familia: 1, descricao_familia: "Fam 1" },
    ]);

    const pagina1 = await client.listarProdutosPagina(1, 1);

    expect(pagina1.pagina).toBe(1);
    expect(pagina1.total_de_paginas).toBe(2);
    expect(pagina1.produto_servico_cadastro).toHaveLength(1);
    expect(pagina1.produto_servico_cadastro[0].codigo).toBe("A");
  });

  it("pagina posições de estoque", async () => {
    const posicoes: PosicaoEstoqueOmieBruta[] = [
      { cCodigo: "P1", cDescricao: "Prod 1", codigo_local_estoque: 1, fisico: 10, nCodProd: 100, nSaldo: 8, reservado: 2, nPendente: 0, nCMC: 5.5 },
      { cCodigo: "P2", cDescricao: "Prod 2", codigo_local_estoque: 1, fisico: 20, nCodProd: 200, nSaldo: 18, reservado: 2, nPendente: 0, nCMC: 3.0 },
    ];
    const client = new FakeHttpClient([], posicoes);

    const pagina1 = await client.listarPosicoesEstoquePagina(1, 1);

    expect(pagina1.nPagina).toBe(1);
    expect(pagina1.nTotPaginas).toBe(2);
    expect(pagina1.produtos).toHaveLength(1);
    expect(pagina1.produtos[0].cCodigo).toBe("P1");
  });
});
