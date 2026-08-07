import { describe, expect, it } from "vitest";
import { FakeHttpClient } from "./fake-http-client.js";
import { PosicaoEstoqueOmieBruta } from "../modules/estoque/domain/estoque.js";
import { OrdemProducaoOmieBruta } from "../modules/ordemProducao/domain/ordem-producao.js";

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

  it("pagina ordens de produção", async () => {
    const ordens: OrdemProducaoOmieBruta[] = [
      {
        identificacao: {
          cCodIntOP: "", cNumOP: "2024/00001", codigo_local_estoque: 1,
          dDtPrevisao: "01/01/2024", nCodOP: 100, nCodProduto: 1, nQtde: 10,
        },
        infAdicionais: { cEtapa: "80", dDtConclusao: "01/01/2024", dDtInicio: "01/01/2024", nCodProjeto: 0 },
        outrasInf: { cConcluida: "S", dConclusao: "01/01/2024", dInclusao: "01/01/2024" },
      },
      {
        identificacao: {
          cCodIntOP: "", cNumOP: "2024/00002", codigo_local_estoque: 1,
          dDtPrevisao: "02/01/2024", nCodOP: 200, nCodProduto: 2, nQtde: 20,
        },
        infAdicionais: { cEtapa: "80", dDtConclusao: "", dDtInicio: "02/01/2024", nCodProjeto: 0 },
        outrasInf: { cConcluida: "N", dConclusao: "", dInclusao: "02/01/2024" },
      },
    ];
    const client = new FakeHttpClient([], [], ordens);

    const pagina1 = await client.listarOrdensProducaoPagina(1, 1);

    expect(pagina1.pagina).toBe(1);
    expect(pagina1.total_de_paginas).toBe(2);
    expect(pagina1.total_de_registros).toBe(2);
    expect(pagina1.cadastros).toHaveLength(1);
    expect(pagina1.cadastros[0].identificacao.nCodOP).toBe(100);

    const pagina2 = await client.listarOrdensProducaoPagina(2, 1);
    expect(pagina2.cadastros).toHaveLength(1);
    expect(pagina2.cadastros[0].identificacao.nCodOP).toBe(200);
  });

  it("devolve página vazia coerente quando não há ordens de produção", async () => {
    const client = new FakeHttpClient();

    const pagina1 = await client.listarOrdensProducaoPagina(1, 50);

    expect(pagina1.pagina).toBe(1);
    expect(pagina1.total_de_paginas).toBe(1);
    expect(pagina1.registros).toBe(0);
    expect(pagina1.total_de_registros).toBe(0);
    expect(pagina1.cadastros).toEqual([]);
  });
});
