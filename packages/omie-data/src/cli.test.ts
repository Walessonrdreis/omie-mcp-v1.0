import { describe, expect, it } from "vitest";
import { parseArgv, textoAjudaProdutos, formatarResultadoProdutos } from "./cli.js";

describe("parseArgv", () => {
  it("reconhece 'configurar --app-key X --app-secret Y'", () => {
    const comando = parseArgv(["configurar", "--app-key", "minha-key", "--app-secret", "meu-secret"]);
    expect(comando).toEqual({ tipo: "configurar", appKey: "minha-key", appSecret: "meu-secret" });
  });

  it("reconhece 'produtos' sem flags", () => {
    const comando = parseArgv(["produtos"]);
    expect(comando).toEqual({ tipo: "produtos", atualizar: false, ajuda: false, filtros: {} });
  });

  it("reconhece 'produtos --atualizar'", () => {
    const comando = parseArgv(["produtos", "--atualizar"]);
    expect(comando).toEqual({ tipo: "produtos", atualizar: true, ajuda: false, filtros: {} });
  });

  it("reconhece 'produtos --busca arroz'", () => {
    const comando = parseArgv(["produtos", "--busca", "arroz"]);
    expect(comando).toEqual({ tipo: "produtos", atualizar: false, ajuda: false, filtros: { busca: "arroz" } });
  });

  it("reconhece 'produtos --categoria bebida'", () => {
    const comando = parseArgv(["produtos", "--categoria", "bebida"]);
    expect(comando).toEqual({ tipo: "produtos", atualizar: false, ajuda: false, filtros: { categoria: "bebida" } });
  });

  it("reconhece 'produtos --ativo sim' e 'produtos --ativo nao' (com ou sem acento)", () => {
    expect(parseArgv(["produtos", "--ativo", "sim"])).toEqual({
      tipo: "produtos", atualizar: false, ajuda: false, filtros: { ativo: "Sim" },
    });
    expect(parseArgv(["produtos", "--ativo", "nao"])).toEqual({
      tipo: "produtos", atualizar: false, ajuda: false, filtros: { ativo: "Não" },
    });
    expect(parseArgv(["produtos", "--ativo", "não"])).toEqual({
      tipo: "produtos", atualizar: false, ajuda: false, filtros: { ativo: "Não" },
    });
  });

  it("retorna 'desconhecido' quando --ativo vem com valor inválido", () => {
    expect(parseArgv(["produtos", "--ativo", "talvez"])).toEqual({ tipo: "desconhecido" });
  });

  it("combina múltiplas flags de filtro", () => {
    const comando = parseArgv(["produtos", "--busca", "arroz", "--categoria", "grãos", "--ativo", "sim", "--atualizar"]);
    expect(comando).toEqual({
      tipo: "produtos",
      atualizar: true,
      ajuda: false,
      filtros: { busca: "arroz", categoria: "grãos", ativo: "Sim" },
    });
  });

  it("reconhece 'produtos --ajuda'", () => {
    const comando = parseArgv(["produtos", "--ajuda"]);
    expect(comando).toEqual({ tipo: "produtos", atualizar: false, ajuda: true, filtros: {} });
  });

  it("retorna 'desconhecido' pra qualquer outra entrada", () => {
    expect(parseArgv([])).toEqual({ tipo: "desconhecido" });
    expect(parseArgv(["outra-coisa"])).toEqual({ tipo: "desconhecido" });
  });

  it("retorna 'desconhecido' quando --app-key ou --app-secret vêm vazios ou faltando", () => {
    expect(parseArgv(["configurar", "--app-key", "--app-secret", "meu-secret"])).toEqual({ tipo: "desconhecido" });
    expect(parseArgv(["configurar", "--app-key", "minha-key"])).toEqual({ tipo: "desconhecido" });
    expect(parseArgv(["configurar", "--app-key", "", "--app-secret", "meu-secret"])).toEqual({ tipo: "desconhecido" });
    expect(parseArgv(["configurar", "--app-key", "minha-key", "--app-secret"])).toEqual({ tipo: "desconhecido" });
  });
});

describe("textoAjudaProdutos", () => {
  it("lista cada filtro disponível com um exemplo de uso", () => {
    const texto = textoAjudaProdutos();
    expect(texto).toContain("--busca <texto>");
    expect(texto).toContain("produtos --busca arroz");
    expect(texto).toContain("--categoria <texto>");
    expect(texto).toContain("produtos --categoria bebida");
    expect(texto).toContain("--ativo <sim|nao>");
    expect(texto).toContain("produtos --ativo sim");
  });
});

describe("formatarResultadoProdutos", () => {
  it("retorna mensagem amigável quando não há produtos", () => {
    const texto = formatarResultadoProdutos({ status: "sem_dado", produtos: [], geradoEm: null, idadeMs: null });
    expect(texto).toBe("Nenhum produto encontrado.");
  });

  it("formata os produtos como tabela legível, sem JSON cru", () => {
    const texto = formatarResultadoProdutos({
      status: "dado_disponivel",
      geradoEm: "2026-08-04T18:27:19.191Z",
      idadeMs: 1000,
      produtos: [
        {
          codigoProduto: 9116172034,
          codigo: "42bm",
          nome: "42% cacau - Ao Leite 80g",
          categoria: "Barra Media",
          unidade: "UND",
          valorFormatado: "R$ 38,00",
          ativo: "Sim",
        },
      ],
    });

    expect(texto).not.toContain("{");
    expect(texto).toContain("42% cacau - Ao Leite 80g");
    expect(texto).toContain("42bm");
    expect(texto).toContain("Barra Media");
    expect(texto).toContain("R$ 38,00");
    expect(texto).toContain("Sim");
  });

  it("formata geradoEm em horário de Brasília e idadeMs como HH:MM:SS", () => {
    const texto = formatarResultadoProdutos({
      status: "dado_disponivel",
      geradoEm: "2026-08-04T18:27:19.191Z",
      idadeMs: 17462390,
      produtos: [
        {
          codigoProduto: 1,
          codigo: "A",
          nome: "Produto A",
          categoria: "Cat",
          unidade: "UN",
          valorFormatado: "R$ 1,00",
          ativo: "Sim",
        },
      ],
    });

    expect(texto).not.toContain("geradoEm");
    expect(texto).not.toContain("idadeMs");
    expect(texto).toContain("04/08/2026, 15:27:19");
    expect(texto).toContain("04:51:02");
  });

  it("alinha as colunas da tabela com largura fixa por coluna", () => {
    const texto = formatarResultadoProdutos({
      status: "dado_disponivel",
      geradoEm: "2026-08-04T18:27:19.191Z",
      idadeMs: 1000,
      produtos: [
        { codigoProduto: 1, codigo: "A", nome: "Curto", categoria: "Cat", unidade: "UN", valorFormatado: "R$ 1,00", ativo: "Sim" },
        {
          codigoProduto: 2,
          codigo: "BBBBBB",
          nome: "Nome bem mais comprido",
          categoria: "Categoria Grande",
          unidade: "UN",
          valorFormatado: "R$ 100,00",
          ativo: "Não",
        },
      ],
    });

    const linhasTabela = texto.split("\n").filter((linha) => linha.includes(" | "));
    const largurasCabecalho = linhasTabela[0].split(" | ").map((celula) => celula.length);
    for (const linha of linhasTabela) {
      const celulas = linha.split(" | ");
      celulas.forEach((celula, indice) => {
        expect(celula.length).toBe(largurasCabecalho[indice]);
      });
    }
  });
});
