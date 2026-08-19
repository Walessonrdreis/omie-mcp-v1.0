import { afterEach, describe, expect, it, vi } from "vitest";
import { consultarOrdensProducao } from "../../../../data/index.js";
import { modoMock, prepararBancoOpMock } from "./op-cache-mock.js";

describe("modoMock", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("é verdadeiro só com OMIE_MOCK exatamente 'true' (mesma convenção das fábricas de gateway)", () => {
    vi.stubEnv("OMIE_MOCK", "true");
    expect(modoMock()).toBe(true);

    vi.stubEnv("OMIE_MOCK", "TRUE");
    expect(modoMock()).toBe(false);

    vi.stubEnv("OMIE_MOCK", "1");
    expect(modoMock()).toBe(false);

    vi.stubEnv("OMIE_MOCK", "");
    expect(modoMock()).toBe(false);
  });
});

describe("prepararBancoOpMock", () => {
  it("devolve um cache já povoado, sem exigir credencial nem tocar em arquivo", async () => {
    // Sem OMIE_APP_KEY/SECRET de propósito: o modo mock não pode depender de
    // credencial — era exatamente a falha de autenticação do modo mock.
    const { db, totalColetado, geradoEm } = await prepararBancoOpMock();
    try {
      expect(totalColetado).toBeGreaterThan(0);
      expect(geradoEm).toMatch(/^\d{4}-\d{2}-\d{2}T/);

      const resultado = consultarOrdensProducao(db, {});
      expect(resultado.status).toBe("dado_disponivel");
      if (resultado.status !== "dado_disponivel") return;
      expect(resultado.ordens.length).toBe(totalColetado);
    } finally {
      db.close();
    }
  });

  it("enriquece as OPs com SKU e descrição do produto (o valor que a ferramenta promete)", async () => {
    const { db } = await prepararBancoOpMock();
    try {
      const resultado = consultarOrdensProducao(db, {});
      if (resultado.status !== "dado_disponivel")
        throw new Error("esperava cache povoado");

      for (const ordem of resultado.ordens) {
        expect(ordem.codigoSku).not.toBe("");
        expect(ordem.descricaoProduto).not.toBe("(produto não encontrado)");
      }
    } finally {
      db.close();
    }
  });

  it("respeita o filtro apenas_nao_concluidas — logo o mock tem OP concluída e não concluída", async () => {
    const { db } = await prepararBancoOpMock();
    try {
      const todas = consultarOrdensProducao(db, {});
      const abertas = consultarOrdensProducao(db, {
        apenasNaoConcluidas: true,
      });
      if (
        todas.status !== "dado_disponivel" ||
        abertas.status !== "dado_disponivel"
      )
        throw new Error("esperava cache povoado");

      expect(abertas.ordens.length).toBeGreaterThan(0);
      expect(abertas.ordens.length).toBeLessThan(todas.ordens.length);
      expect(abertas.ordens.every((o) => !o.concluida)).toBe(true);
    } finally {
      db.close();
    }
  });

  it("é isolado por chamada: cada banco em memória é independente", async () => {
    const a = await prepararBancoOpMock();
    const b = await prepararBancoOpMock();
    try {
      a.db.prepare("DELETE FROM view_ordens_producao").run();

      const resultadoB = consultarOrdensProducao(b.db, {});
      expect(resultadoB.status).toBe("dado_disponivel");
    } finally {
      a.db.close();
      b.db.close();
    }
  });
});
