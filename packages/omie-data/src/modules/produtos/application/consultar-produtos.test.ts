import { describe, expect, it } from "vitest";
import { abrirBanco } from "../../../infrastructure/database.js";
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

  it("filtra por busca (nome ou código), case-insensitive", () => {
    const db = abrirBanco(":memory:");
    const gerado = new Date().toISOString();
    db.prepare(`
      INSERT INTO view_produtos (codigo_produto, codigo, nome, categoria, unidade, valor_formatado, ativo, gerado_em)
      VALUES (1, 'ABC123', 'Arroz Branco', 'Grãos', 'UN', 'R$ 10,00', 'Sim', ?),
             (2, 'XYZ999', 'Feijão Preto', 'Grãos', 'UN', 'R$ 8,00', 'Sim', ?)
    `).run(gerado, gerado);

    const porNome = consultarProdutos(db, { busca: "arroz" });
    expect(porNome.produtos).toHaveLength(1);
    expect(porNome.produtos[0].nome).toBe("Arroz Branco");

    const porCodigo = consultarProdutos(db, { busca: "xyz999" });
    expect(porCodigo.produtos).toHaveLength(1);
    expect(porCodigo.produtos[0].nome).toBe("Feijão Preto");

    db.close();
  });

  it("filtra por categoria, substring case-insensitive", () => {
    const db = abrirBanco(":memory:");
    const gerado = new Date().toISOString();
    db.prepare(`
      INSERT INTO view_produtos (codigo_produto, codigo, nome, categoria, unidade, valor_formatado, ativo, gerado_em)
      VALUES (1, 'A', 'Produto A', 'Bebidas Alcoólicas', 'UN', 'R$ 10,00', 'Sim', ?),
             (2, 'B', 'Produto B', 'Limpeza', 'UN', 'R$ 8,00', 'Sim', ?)
    `).run(gerado, gerado);

    const resultado = consultarProdutos(db, { categoria: "bebida" });
    expect(resultado.produtos).toHaveLength(1);
    expect(resultado.produtos[0].nome).toBe("Produto A");

    db.close();
  });

  it("filtra por ativo, igualdade exata", () => {
    const db = abrirBanco(":memory:");
    const gerado = new Date().toISOString();
    db.prepare(`
      INSERT INTO view_produtos (codigo_produto, codigo, nome, categoria, unidade, valor_formatado, ativo, gerado_em)
      VALUES (1, 'A', 'Produto A', 'Cat', 'UN', 'R$ 10,00', 'Sim', ?),
             (2, 'B', 'Produto B', 'Cat', 'UN', 'R$ 8,00', 'Não', ?)
    `).run(gerado, gerado);

    const resultado = consultarProdutos(db, { ativo: "Não" });
    expect(resultado.produtos).toHaveLength(1);
    expect(resultado.produtos[0].nome).toBe("Produto B");

    db.close();
  });

  it("combina múltiplos filtros com AND", () => {
    const db = abrirBanco(":memory:");
    const gerado = new Date().toISOString();
    db.prepare(`
      INSERT INTO view_produtos (codigo_produto, codigo, nome, categoria, unidade, valor_formatado, ativo, gerado_em)
      VALUES (1, 'A', 'Arroz Branco', 'Grãos', 'UN', 'R$ 10,00', 'Sim', ?),
             (2, 'B', 'Arroz Integral', 'Grãos', 'UN', 'R$ 12,00', 'Não', ?)
    `).run(gerado, gerado);

    const resultado = consultarProdutos(db, { busca: "arroz", ativo: "Sim" });
    expect(resultado.produtos).toHaveLength(1);
    expect(resultado.produtos[0].nome).toBe("Arroz Branco");

    db.close();
  });
});
