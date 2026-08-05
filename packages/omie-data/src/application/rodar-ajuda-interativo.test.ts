import { describe, expect, it } from "vitest";
import { abrirBanco } from "../infrastructure/database.js";
import { FakeOmieHttpClient } from "../infrastructure/fake-omie-http-client.js";
import {
  rodarAjudaInterativa,
  rodarAjudaInterativaEmLoop,
  IPromptsInterativos,
  valoresBusca,
} from "./rodar-ajuda-interativo.js";

function fakePrompts(overrides: Partial<IPromptsInterativos>): IPromptsInterativos {
  return {
    selecionarFiltro: async () => "nenhum",
    buscarTermo: async () => "",
    selecionarAtivo: async () => "Sim",
    perguntarProximaAcao: async () => "sair",
    perguntarAtualizar: async () => false,
    ...overrides,
  };
}

describe("rodarAjudaInterativa", () => {
  it("filtro 'nenhum' retorna todos os produtos", async () => {
    const db = abrirBanco(":memory:");
    const client = new FakeOmieHttpClient([
      { codigo_produto: 1, codigo: "A", descricao: "Produto A", unidade: "UN", valor_unitario: 10, inativo: "N", codigo_familia: 1, descricao_familia: "Cat" },
    ]);

    const resultado = await rodarAjudaInterativa(db, client, true, {}, fakePrompts({}));

    expect(resultado.tipo).toBe("resultado");
    if (resultado.tipo === "resultado") {
      expect(resultado.resultado.status).toBe("dado_disponivel");
      expect(resultado.resultado.produtos).toHaveLength(1);
    }

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
      {},
      fakePrompts({ selecionarFiltro: async () => "busca", buscarTermo: async () => "Arroz Branco" })
    );

    expect(resultado.tipo).toBe("resultado");
    if (resultado.tipo === "resultado") {
      expect(resultado.resultado.status).toBe("dado_disponivel");
      expect(resultado.resultado.produtos).toHaveLength(1);
      expect(resultado.resultado.produtos[0].nome).toBe("Arroz Branco");
    }

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
      {},
      fakePrompts({ selecionarFiltro: async () => "ativo", selecionarAtivo: async () => "Não" })
    );

    expect(resultado.tipo).toBe("resultado");
    if (resultado.tipo === "resultado") {
      expect(resultado.resultado.status).toBe("dado_disponivel");
      expect(resultado.resultado.produtos).toHaveLength(1);
      expect(resultado.resultado.produtos[0].nome).toBe("Produto B");
    }

    db.close();
  });

  it("filtrosBase com busca já setada + prompt escolhe 'nenhum' → usa só o filtro da base", async () => {
    const db = abrirBanco(":memory:");
    const client = new FakeOmieHttpClient([
      { codigo_produto: 1, codigo: "A", descricao: "Arroz Branco", unidade: "UN", valor_unitario: 10, inativo: "N", codigo_familia: 1, descricao_familia: "Grãos" },
      { codigo_produto: 2, codigo: "B", descricao: "Feijão Preto", unidade: "UN", valor_unitario: 8, inativo: "N", codigo_familia: 1, descricao_familia: "Grãos" },
    ]);

    const resultado = await rodarAjudaInterativa(db, client, true, { busca: "Arroz Branco" }, fakePrompts({}));

    expect(resultado.tipo).toBe("resultado");
    if (resultado.tipo === "resultado") {
      expect(resultado.resultado.status).toBe("dado_disponivel");
      expect(resultado.resultado.produtos).toHaveLength(1);
      expect(resultado.resultado.produtos[0].nome).toBe("Arroz Branco");
    }

    db.close();
  });

  it("filtrosBase com um filtro + prompt escolhe outro filtro diferente → combinam com AND", async () => {
    const db = abrirBanco(":memory:");
    const client = new FakeOmieHttpClient([
      { codigo_produto: 1, codigo: "A", descricao: "Arroz Branco", unidade: "UN", valor_unitario: 10, inativo: "N", codigo_familia: 1, descricao_familia: "Grãos" },
      { codigo_produto: 2, codigo: "B", descricao: "Arroz Integral", unidade: "UN", valor_unitario: 12, inativo: "S", codigo_familia: 1, descricao_familia: "Grãos" },
    ]);

    const resultado = await rodarAjudaInterativa(
      db,
      client,
      true,
      { busca: "Arroz" },
      fakePrompts({ selecionarFiltro: async () => "ativo", selecionarAtivo: async () => "Sim" })
    );

    expect(resultado.tipo).toBe("resultado");
    if (resultado.tipo === "resultado") {
      expect(resultado.resultado.status).toBe("dado_disponivel");
      expect(resultado.resultado.produtos).toHaveLength(1);
      expect(resultado.resultado.produtos[0].nome).toBe("Arroz Branco");
    }

    db.close();
  });

  it("'voltar' não roda consulta nenhuma e retorna tipo 'voltar'", async () => {
    const db = abrirBanco(":memory:");
    const client = new FakeOmieHttpClient([
      { codigo_produto: 1, codigo: "A", descricao: "Produto A", unidade: "UN", valor_unitario: 10, inativo: "N", codigo_familia: 1, descricao_familia: "Cat" },
    ]);

    const resultado = await rodarAjudaInterativa(
      db,
      client,
      false,
      {},
      fakePrompts({
        selecionarFiltro: async () => "voltar",
        buscarTermo: async () => {
          throw new Error("não deveria pedir termo ao voltar");
        },
      })
    );

    expect(resultado).toEqual({ tipo: "voltar" });

    db.close();
  });

  it("'sair' não roda consulta nenhuma e retorna tipo 'sair'", async () => {
    const db = abrirBanco(":memory:");
    const client = new FakeOmieHttpClient([
      { codigo_produto: 1, codigo: "A", descricao: "Produto A", unidade: "UN", valor_unitario: 10, inativo: "N", codigo_familia: 1, descricao_familia: "Cat" },
    ]);

    const resultado = await rodarAjudaInterativa(
      db,
      client,
      false,
      {},
      fakePrompts({ selecionarFiltro: async () => "sair" })
    );

    expect(resultado).toEqual({ tipo: "sair" });

    db.close();
  });
});

describe("valoresBusca", () => {
  it("retorna valores distintos casando por nome OU por código", () => {
    const db = abrirBanco(":memory:");
    const gerado = new Date().toISOString();
    db.prepare(`
      INSERT INTO view_produtos (codigo_produto, codigo, nome, categoria, unidade, valor_formatado, ativo, gerado_em)
      VALUES (1, '42bm', 'Arroz Branco', 'Grãos', 'UN', 'R$ 10,00', 'Sim', ?),
             (2, 'B99', 'Feijão Preto', 'Grãos', 'UN', 'R$ 8,00', 'Sim', ?)
    `).run(gerado, gerado);

    expect(valoresBusca(db, "arroz")).toEqual([{ rotulo: "Arroz Branco", valor: "Arroz Branco" }]);
    expect(valoresBusca(db, "42bm")).toEqual([{ rotulo: "42bm - Arroz Branco", valor: "42bm" }]);
    expect(valoresBusca(db, "")).toEqual([]);

    db.close();
  });

  it("não duplica quando o mesmo valor bate em nome e código", () => {
    const db = abrirBanco(":memory:");
    const gerado = new Date().toISOString();
    db.prepare(`
      INSERT INTO view_produtos (codigo_produto, codigo, nome, categoria, unidade, valor_formatado, ativo, gerado_em)
      VALUES (1, 'abc', 'ABC Produto', 'Cat', 'UN', 'R$ 10,00', 'Sim', ?)
    `).run(gerado);

    expect(valoresBusca(db, "abc")).toEqual([
      { rotulo: "ABC Produto", valor: "ABC Produto" },
      { rotulo: "abc - ABC Produto", valor: "abc" },
    ]);

    db.close();
  });
});

describe("rodarAjudaInterativaEmLoop", () => {
  it("'sair' na seleção de filtro encerra o loop sem mostrar nada", async () => {
    const db = abrirBanco(":memory:");
    const client = new FakeOmieHttpClient([]);
    const mostrados: unknown[] = [];

    const saida = await rodarAjudaInterativaEmLoop(
      db,
      client,
      false,
      {},
      (r) => mostrados.push(r),
      fakePrompts({ selecionarFiltro: async () => "sair" })
    );

    expect(saida).toBe("sair");
    expect(mostrados).toHaveLength(0);

    db.close();
  });

  it("'voltar' na seleção de filtro retorna 'voltar' sem mostrar nada", async () => {
    const db = abrirBanco(":memory:");
    const client = new FakeOmieHttpClient([]);
    const mostrados: unknown[] = [];

    const saida = await rodarAjudaInterativaEmLoop(
      db,
      client,
      false,
      {},
      (r) => mostrados.push(r),
      fakePrompts({ selecionarFiltro: async () => "voltar" })
    );

    expect(saida).toBe("voltar");
    expect(mostrados).toHaveLength(0);

    db.close();
  });

  it("mostra resultado e, ao escolher 'menu', retorna 'voltar'", async () => {
    const db = abrirBanco(":memory:");
    const client = new FakeOmieHttpClient([
      { codigo_produto: 1, codigo: "A", descricao: "Produto A", unidade: "UN", valor_unitario: 10, inativo: "N", codigo_familia: 1, descricao_familia: "Cat" },
    ]);
    const mostrados: unknown[] = [];

    const saida = await rodarAjudaInterativaEmLoop(
      db,
      client,
      true,
      {},
      (r) => mostrados.push(r),
      fakePrompts({ selecionarFiltro: async () => "nenhum", perguntarProximaAcao: async () => "menu" })
    );

    expect(saida).toBe("voltar");
    expect(mostrados).toHaveLength(1);

    db.close();
  });

  it("'continuar' repete o loop e mostra resultado de novo", async () => {
    const db = abrirBanco(":memory:");
    const client = new FakeOmieHttpClient([
      { codigo_produto: 1, codigo: "A", descricao: "Produto A", unidade: "UN", valor_unitario: 10, inativo: "N", codigo_familia: 1, descricao_familia: "Cat" },
    ]);
    const mostrados: unknown[] = [];
    let chamadas = 0;

    const saida = await rodarAjudaInterativaEmLoop(
      db,
      client,
      true,
      {},
      (r) => mostrados.push(r),
      fakePrompts({
        selecionarFiltro: async () => "nenhum",
        perguntarProximaAcao: async () => {
          chamadas++;
          return chamadas === 1 ? "continuar" : "sair";
        },
      })
    );

    expect(saida).toBe("sair");
    expect(mostrados).toHaveLength(2);

    db.close();
  });

  it("só atualiza (coleta) na primeira iteração do loop, não nas seguintes", async () => {
    const db = abrirBanco(":memory:");
    let chamadasListar = 0;
    const client = new FakeOmieHttpClient([
      { codigo_produto: 1, codigo: "A", descricao: "Produto A", unidade: "UN", valor_unitario: 10, inativo: "N", codigo_familia: 1, descricao_familia: "Cat" },
    ]);
    const listarOriginal = client.listarProdutosPagina.bind(client);
    client.listarProdutosPagina = async (...args) => {
      chamadasListar++;
      return listarOriginal(...args);
    };

    let chamadasProxima = 0;
    await rodarAjudaInterativaEmLoop(
      db,
      client,
      true,
      {},
      () => {},
      fakePrompts({
        selecionarFiltro: async () => "nenhum",
        perguntarProximaAcao: async () => {
          chamadasProxima++;
          return chamadasProxima === 1 ? "continuar" : "sair";
        },
      })
    );

    expect(chamadasListar).toBe(1);

    db.close();
  });

  it("atualizar: 'perguntar' pergunta uma vez e coleta se a resposta for sim", async () => {
    const db = abrirBanco(":memory:");
    let chamadasListar = 0;
    const client = new FakeOmieHttpClient([
      { codigo_produto: 1, codigo: "A", descricao: "Produto A", unidade: "UN", valor_unitario: 10, inativo: "N", codigo_familia: 1, descricao_familia: "Cat" },
    ]);
    const listarOriginal = client.listarProdutosPagina.bind(client);
    client.listarProdutosPagina = async (...args) => {
      chamadasListar++;
      return listarOriginal(...args);
    };

    let chamadasPergunta = 0;
    const saida = await rodarAjudaInterativaEmLoop(
      db,
      client,
      "perguntar",
      {},
      () => {},
      fakePrompts({
        selecionarFiltro: async () => "nenhum",
        perguntarAtualizar: async () => {
          chamadasPergunta++;
          return true;
        },
      })
    );

    expect(saida).toBe("sair");
    expect(chamadasPergunta).toBe(1);
    expect(chamadasListar).toBe(1);

    db.close();
  });

  it("atualizar: 'perguntar' não coleta se a resposta for não", async () => {
    const db = abrirBanco(":memory:");
    let chamadasListar = 0;
    const client = new FakeOmieHttpClient([]);
    const listarOriginal = client.listarProdutosPagina.bind(client);
    client.listarProdutosPagina = async (...args) => {
      chamadasListar++;
      return listarOriginal(...args);
    };

    await rodarAjudaInterativaEmLoop(
      db,
      client,
      "perguntar",
      {},
      () => {},
      fakePrompts({ selecionarFiltro: async () => "nenhum", perguntarAtualizar: async () => false })
    );

    expect(chamadasListar).toBe(0);

    db.close();
  });
});
