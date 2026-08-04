import { describe, expect, it } from "vitest";
import { abrirBanco } from "../infrastructure/database.js";
import { consultarProdutos } from "./consultar-produtos.js";

describe("consultarProdutos", () => {
  it("retorna status sem_dado quando view_produtos está vazia", () => {
    const db = abrirBanco(":memory:");

    const resultado = consultarProdutos(db);

    expect(resultado.status).toBe("sem_dado");
    expect(resultado.produtos).toEqual([]);
    expect(resultado.geradoEm).toBeNull();

    db.close();
  });

  it("retorna dado_disponivel com produtos e idade calculada quando view_produtos tem dado", () => {
    const db = abrirBanco(":memory:");
    const geradoEm = new Date(Date.now() - 60_000).toISOString(); // 1 min atrás

    db.prepare(`
      INSERT INTO view_produtos (codigo_produto, codigo, nome, categoria, unidade, valor_formatado, ativo, gerado_em)
      VALUES (1, 'A', 'Produto A', 'Cat X', 'UN', 'R$ 10,00', 'Sim', ?)
    `).run(geradoEm);

    const resultado = consultarProdutos(db);

    expect(resultado.status).toBe("dado_disponivel");
    expect(resultado.produtos).toHaveLength(1);
    expect(resultado.produtos[0].nome).toBe("Produto A");
    expect(resultado.geradoEm).toBe(geradoEm);
    expect(resultado.idadeMs).toBeGreaterThanOrEqual(60_000);

    db.close();
  });
});
