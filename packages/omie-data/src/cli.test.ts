import { describe, expect, it } from "vitest";
import { parseArgv } from "./cli.js";

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
