import { describe, expect, it } from "vitest";
import { abrirBanco } from "../infrastructure/database.js";
import { FakeOmieHttpClient } from "../infrastructure/fake-omie-http-client.js";
import { rodarAjudaInterativa, IPromptsInterativos } from "./rodar-ajuda-interativo.js";

function fakePrompts(overrides: Partial<IPromptsInterativos>): IPromptsInterativos {
  return {
    selecionarFiltro: async () => "nenhum",
    buscarTermo: async () => "",
    selecionarAtivo: async () => "Sim",
    ...overrides,
  };
}

describe("rodarAjudaInterativa", () => {
  it("filtro 'nenhum' retorna todos os produtos", async () => {
    const db = abrirBanco(":memory:");
    const client = new FakeOmieHttpClient([
      { codigo_produto: 1, codigo: "A", descricao: "Produto A", unidade: "UN", valor_unitario: 10, inativo: "N", codigo_familia: 1, descricao_familia: "Cat" },
    ]);

    const resultado = await rodarAjudaInterativa(db, client, true, fakePrompts({}));

    expect(resultado.status).toBe("dado_disponivel");
    expect(resultado.produtos).toHaveLength(1);

    db.close();
  });

  it("filtro 'busca' usa o termo escolhido no prompt e filtra o resultado", async () => {
    const db = abrirBanco(":memory:");
    const client = new FakeOmieHttpClient([
      { codigo_produto: 1, codigo: "A", descricao: "Arroz Branco", unidade: "UN", valor_unitario: 10, inativo: "N", codigo_familia: 1, descricao_familia: "Grãos" },
      { codigo_produto: 2, codigo: "B", descricao: "Feijão Preto", unidade: "UN", valor_unitario: 8, inativo: "N", codigo_familia: 1, descricao_familia: "Grãos" },
    ]);

    const resultado = await rodarAjudaInterativa(
      db,
      client,
      true,
      fakePrompts({ selecionarFiltro: async () => "busca", buscarTermo: async () => "Arroz Branco" })
    );

    expect(resultado.status).toBe("dado_disponivel");
    expect(resultado.produtos).toHaveLength(1);
    expect(resultado.produtos[0].nome).toBe("Arroz Branco");

    db.close();
  });

  it("filtro 'ativo' usa o valor escolhido no prompt", async () => {
    const db = abrirBanco(":memory:");
    const client = new FakeOmieHttpClient([
      { codigo_produto: 1, codigo: "A", descricao: "Produto A", unidade: "UN", valor_unitario: 10, inativo: "N", codigo_familia: 1, descricao_familia: "Cat" },
      { codigo_produto: 2, codigo: "B", descricao: "Produto B", unidade: "UN", valor_unitario: 8, inativo: "S", codigo_familia: 1, descricao_familia: "Cat" },
    ]);

    const resultado = await rodarAjudaInterativa(
      db,
      client,
      true,
      fakePrompts({ selecionarFiltro: async () => "ativo", selecionarAtivo: async () => "Não" })
    );

    expect(resultado.status).toBe("dado_disponivel");
    expect(resultado.produtos).toHaveLength(1);
    expect(resultado.produtos[0].nome).toBe("Produto B");

    db.close();
  });
});
