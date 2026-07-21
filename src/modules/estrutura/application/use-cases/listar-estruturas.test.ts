import { describe, expect, it } from "vitest";
import { EstruturaFakeGateway } from "../../infrastructure/gateways/estrutura-fake-gateway.js";
import { ListarEstruturasUseCase } from "./listar-estruturas.js";

describe("ListarEstruturasUseCase", () => {
  it("lista produtos com estrutura já com nome do produto e dos insumos", async () => {
    const useCase = new ListarEstruturasUseCase(new EstruturaFakeGateway());

    const resultado = await useCase.execute({});

    expect(resultado.totalRegistros).toBe(2);
    const racao = resultado.produtos.find((p) => p.codigoProduto === 111);
    expect(racao?.descricaoProduto).toBe("Ração 100kg");
    expect(racao?.itens).toEqual([
      { codigo: "INS-001", descricao: "Milho", quantidade: 60, unidade: "KG" },
      { codigo: "INS-002", descricao: "Farelo de Soja", quantidade: 40, unidade: "KG" },
    ]);
  });

  it("respeita paginação", async () => {
    const useCase = new ListarEstruturasUseCase(new EstruturaFakeGateway());

    const resultado = await useCase.execute({ pagina: 1, registros_por_pagina: 1 });

    expect(resultado.totalPaginas).toBe(2);
    expect(resultado.produtos).toHaveLength(1);
  });

  it("aplica o filtro genérico sobre o resultado já enriquecido", async () => {
    const useCase = new ListarEstruturasUseCase(new EstruturaFakeGateway());

    const resultado = await useCase.execute({
      filtros: [{ campo: "descricaoProduto", operador: "contem", valor: "ração" }],
    });

    expect(resultado.produtos).toHaveLength(1);
    expect(resultado.produtos[0].codigoProduto).toBe(111);
  });
});
