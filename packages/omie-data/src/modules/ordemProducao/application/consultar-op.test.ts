import { describe, expect, it } from "vitest";
import { abrirBanco } from "../../../infrastructure/database.js";
import { consultarOrdensProducao } from "./consultar-op.js";

function inserirViewOp(db: any, codigoOp: number, concluida: 0 | 1, geradoEm: string) {
  db.prepare(`
    INSERT INTO view_ordens_producao (
      codigo_op, numero_op, codigo_produto, codigo_sku, descricao_produto,
      quantidade, data_previsao, data_inicio, data_conclusao, concluida, etapa_codigo, gerado_em
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(codigoOp, `2024/${codigoOp}`, 1, "SKU-A", "Produto A", 10, "01/01/2024", "01/01/2024", "02/01/2024", concluida, "80", geradoEm);
}

describe("consultarOrdensProducao", () => {
  it("retorna status sem_dado quando view_ordens_producao está vazia", () => {
    const db = abrirBanco(":memory:");

    const resultado = consultarOrdensProducao(db);

    expect(resultado.status).toBe("sem_dado");
    expect(resultado.ordens).toEqual([]);
    expect(resultado.geradoEm).toBeNull();
    expect(resultado.idadeMs).toBeNull();

    db.close();
  });

  it("retorna dado_disponivel com ordens e idade calculada", () => {
    const db = abrirBanco(":memory:");
    const geradoEm = new Date(Date.now() - 60_000).toISOString();
    inserirViewOp(db, 100, 1, geradoEm);

    const resultado = consultarOrdensProducao(db);

    expect(resultado.status).toBe("dado_disponivel");
    expect(resultado.ordens).toHaveLength(1);
    expect(resultado.ordens[0].codigoOp).toBe(100);
    expect(resultado.ordens[0].concluida).toBe(true);
    expect(resultado.geradoEm).toBe(geradoEm);
    expect(resultado.idadeMs).toBeGreaterThanOrEqual(60_000);

    db.close();
  });

  it("filtro apenasNaoConcluidas remove OPs concluídas", () => {
    const db = abrirBanco(":memory:");
    const agora = new Date().toISOString();
    inserirViewOp(db, 100, 1, agora); // concluída
    inserirViewOp(db, 200, 0, agora); // não concluída

    const resultado = consultarOrdensProducao(db, { apenasNaoConcluidas: true });

    expect(resultado.ordens).toHaveLength(1);
    expect(resultado.ordens[0].codigoOp).toBe(200);
    expect(resultado.ordens[0].concluida).toBe(false);

    db.close();
  });

  it("sem filtro devolve OPs concluídas e não concluídas", () => {
    const db = abrirBanco(":memory:");
    const agora = new Date().toISOString();
    inserirViewOp(db, 100, 1, agora);
    inserirViewOp(db, 200, 0, agora);

    const resultado = consultarOrdensProducao(db);

    expect(resultado.ordens.map((o) => o.codigoOp).sort()).toEqual([100, 200]);
    expect(resultado.ordens.find((o) => o.codigoOp === 100)?.concluida).toBe(true);
    expect(resultado.ordens.find((o) => o.codigoOp === 200)?.concluida).toBe(false);

    db.close();
  });

  it("apenasNaoConcluidas: false não filtra nada", () => {
    const db = abrirBanco(":memory:");
    const agora = new Date().toISOString();
    inserirViewOp(db, 100, 1, agora);
    inserirViewOp(db, 200, 0, agora);

    const resultado = consultarOrdensProducao(db, { apenasNaoConcluidas: false });

    expect(resultado.ordens).toHaveLength(2);

    db.close();
  });

  it("com linhas de passadas diferentes, geradoEm é o timestamp mais recente", () => {
    const db = abrirBanco(":memory:");
    const antigo = new Date(Date.now() - 3_600_000).toISOString();
    const recente = new Date(Date.now() - 60_000).toISOString();
    inserirViewOp(db, 100, 0, antigo);
    inserirViewOp(db, 200, 0, recente);

    const resultado = consultarOrdensProducao(db);

    expect(resultado.geradoEm).toBe(recente);
    expect(resultado.idadeMs).toBeGreaterThanOrEqual(60_000);
    expect(resultado.idadeMs).toBeLessThan(3_600_000);
    // ordem determinística: mais recente primeiro
    expect(resultado.ordens.map((o) => o.codigoOp)).toEqual([200, 100]);

    db.close();
  });

  it("empate de gerado_em é desempatado por codigo_op crescente", () => {
    const db = abrirBanco(":memory:");
    const agora = new Date().toISOString();
    inserirViewOp(db, 300, 0, agora);
    inserirViewOp(db, 100, 0, agora);
    inserirViewOp(db, 200, 0, agora);

    const resultado = consultarOrdensProducao(db);

    expect(resultado.ordens.map((o) => o.codigoOp)).toEqual([100, 200, 300]);

    db.close();
  });

  it("mapeia todas as colunas da view para o formato camelCase", () => {
    const db = abrirBanco(":memory:");
    const agora = new Date().toISOString();
    inserirViewOp(db, 100, 0, agora);

    const resultado = consultarOrdensProducao(db);

    expect(resultado.ordens[0]).toEqual({
      codigoOp: 100,
      numeroOp: "2024/100",
      codigoProduto: 1,
      codigoSku: "SKU-A",
      descricaoProduto: "Produto A",
      quantidade: 10,
      dataPrevisao: "01/01/2024",
      dataInicio: "01/01/2024",
      dataConclusao: "02/01/2024",
      concluida: false,
      etapaCodigo: "80",
    });

    db.close();
  });

  it("idadeMs é positivo e cresce com a idade do dado", () => {
    const db = abrirBanco(":memory:");
    inserirViewOp(db, 100, 0, new Date(Date.now() - 10 * 60_000).toISOString());

    const resultado = consultarOrdensProducao(db);

    expect(resultado.idadeMs).toBeGreaterThanOrEqual(10 * 60_000);
    expect(resultado.idadeMs).toBeLessThan(11 * 60_000);

    db.close();
  });
});
