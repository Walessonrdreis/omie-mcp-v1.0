import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { caminhoBancoAtivo, credenciaisOmieOuFalha } from "./op-cache.js";

describe("caminhoBancoAtivo", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // Premissa central do plano: o MCP tem que apontar pro MESMO diretório que o
  // CLI do omie-data usa. Ancorar via OMIE_DATA_DIR prova as duas coisas de uma
  // vez — que o diretório vem de `diretorioDados()` e que o MCP respeita o
  // mesmo override de ambiente que o CLI.
  it("põe o banco dentro do diretório de dados do omie-data (respeita OMIE_DATA_DIR)", () => {
    vi.stubEnv("OMIE_DATA_DIR", path.join("/tmp", "cache-omie-teste"));

    const caminho = caminhoBancoAtivo("minha-app-key");

    expect(path.dirname(caminho)).toBe(path.join("/tmp", "cache-omie-teste"));
  });

  it("gera o mesmo caminho de banco pra uma mesma app key (determinístico)", () => {
    const caminho1 = caminhoBancoAtivo("minha-app-key");
    const caminho2 = caminhoBancoAtivo("minha-app-key");
    expect(caminho1).toBe(caminho2);
  });

  it("gera caminhos diferentes pra app keys diferentes", () => {
    const caminhoA = caminhoBancoAtivo("app-key-a");
    const caminhoB = caminhoBancoAtivo("app-key-b");
    expect(caminhoA).not.toBe(caminhoB);
  });

  it("caminho termina em .db", () => {
    expect(caminhoBancoAtivo("qualquer-key")).toMatch(/\.db$/);
  });
});

describe("credenciaisOmieOuFalha", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("devolve appKey e appSecret quando ambos estão definidos", () => {
    vi.stubEnv("OMIE_APP_KEY", "chave-teste");
    vi.stubEnv("OMIE_APP_SECRET", "segredo-teste");

    const credenciais = credenciaisOmieOuFalha();

    expect(credenciais).toEqual({ appKey: "chave-teste", appSecret: "segredo-teste" });
  });

  it("lança erro claro quando OMIE_APP_KEY está ausente", () => {
    vi.stubEnv("OMIE_APP_KEY", "");
    vi.stubEnv("OMIE_APP_SECRET", "segredo-teste");

    expect(() => credenciaisOmieOuFalha()).toThrow(/Credenciais da Omie não configuradas/);
    // A mensagem tem que nomear a que faltou, e só ela.
    expect(() => credenciaisOmieOuFalha()).toThrow(/OMIE_APP_KEY ausente/);
  });

  it("lança erro claro quando OMIE_APP_SECRET está ausente", () => {
    vi.stubEnv("OMIE_APP_KEY", "chave-teste");
    vi.stubEnv("OMIE_APP_SECRET", "");

    expect(() => credenciaisOmieOuFalha()).toThrow(/Credenciais da Omie não configuradas/);
    expect(() => credenciaisOmieOuFalha()).toThrow(/OMIE_APP_SECRET ausente/);
  });
});
