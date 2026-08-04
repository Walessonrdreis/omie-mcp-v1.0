import { describe, expect, it } from "vitest";
import { parseArgv } from "./cli.js";

describe("parseArgv", () => {
  it("reconhece 'configurar --app-key X --app-secret Y'", () => {
    const comando = parseArgv(["configurar", "--app-key", "minha-key", "--app-secret", "meu-secret"]);
    expect(comando).toEqual({ tipo: "configurar", appKey: "minha-key", appSecret: "meu-secret" });
  });

  it("reconhece 'produtos' sem --atualizar", () => {
    const comando = parseArgv(["produtos"]);
    expect(comando).toEqual({ tipo: "produtos", atualizar: false });
  });

  it("reconhece 'produtos --atualizar'", () => {
    const comando = parseArgv(["produtos", "--atualizar"]);
    expect(comando).toEqual({ tipo: "produtos", atualizar: true });
  });

  it("retorna 'desconhecido' pra qualquer outra entrada", () => {
    expect(parseArgv([])).toEqual({ tipo: "desconhecido" });
    expect(parseArgv(["outra-coisa"])).toEqual({ tipo: "desconhecido" });
  });
});
