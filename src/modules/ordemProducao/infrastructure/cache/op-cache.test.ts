import { afterEach, describe, expect, it, vi } from "vitest";
import { caminhoBancoAtivo, credenciaisOmieOuFalha } from "./op-cache.js";

describe("caminhoBancoAtivo", () => {
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
  });

  it("lança erro claro quando OMIE_APP_SECRET está ausente", () => {
    vi.stubEnv("OMIE_APP_KEY", "chave-teste");
    vi.stubEnv("OMIE_APP_SECRET", "");

    expect(() => credenciaisOmieOuFalha()).toThrow(/Credenciais da Omie não configuradas/);
  });
});
