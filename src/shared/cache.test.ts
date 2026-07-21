import { beforeEach, describe, expect, it, vi } from "vitest";
import { chaveCache, comCache, limparCache } from "./cache.js";

describe("comCache", () => {
  beforeEach(() => {
    limparCache();
  });

  it("na primeira chamada executa fn e guarda o resultado", async () => {
    const fn = vi.fn().mockResolvedValue("valor");
    const resultado = await comCache("chave-1", fn);
    expect(resultado).toBe("valor");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("dentro do TTL, não chama fn de novo — devolve o valor cacheado", async () => {
    const fn = vi.fn().mockResolvedValue("valor");
    await comCache("chave-2", fn, 10_000);
    await comCache("chave-2", fn, 10_000);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("após o TTL expirar, chama fn de novo", async () => {
    vi.useFakeTimers();
    const fn = vi.fn().mockResolvedValue("valor");
    await comCache("chave-3", fn, 1_000);
    vi.advanceTimersByTime(1_001);
    await comCache("chave-3", fn, 1_000);
    expect(fn).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });

  it("chaves diferentes não colidem", async () => {
    const fn = vi.fn().mockResolvedValue("valor");
    await comCache("chave-a", fn);
    await comCache("chave-b", fn);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe("limparCache", () => {
  beforeEach(() => {
    limparCache();
  });

  it("sem prefixo, limpa tudo", async () => {
    const fn = vi.fn().mockResolvedValue("valor");
    await comCache("chave-1", fn);
    limparCache();
    await comCache("chave-1", fn);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("com prefixo, limpa só as chaves correspondentes", async () => {
    const fn = vi.fn().mockResolvedValue("valor");
    await comCache("geral/bancos:ListarBancos:{}", fn);
    await comCache("geral/cidades:PesquisarCidades:{}", fn);
    limparCache("geral/bancos");
    await comCache("geral/bancos:ListarBancos:{}", fn);
    await comCache("geral/cidades:PesquisarCidades:{}", fn);
    expect(fn).toHaveBeenCalledTimes(3);
  });
});

describe("chaveCache", () => {
  it("gera chave estável a partir de resource/call/param", () => {
    expect(chaveCache("geral/bancos", "ListarBancos", { pagina: 1 })).toBe(
      'geral/bancos:ListarBancos:{"pagina":1}'
    );
    expect(chaveCache("geral/paises", "ListarPaises")).toBe("geral/paises:ListarPaises:{}");
  });
});
