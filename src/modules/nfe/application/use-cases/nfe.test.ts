import { describe, expect, it } from "vitest";
import { NfeFakeGateway } from "../../infrastructure/gateways/nfe-fake-gateway.js";
import { ListarNfeUseCase } from "./listar-nfe.js";
import { ConsultarNfeUseCase } from "./consultar-nfe.js";

describe("ListarNfeUseCase", () => {
  it("lista notas com resumo enriquecido", async () => {
    const useCase = new ListarNfeUseCase(new NfeFakeGateway());

    const resultado = await useCase.execute({});

    expect(resultado.totalRegistros).toBe(2);
    const nota1 = resultado.notas.find((n) => n.codigoNota === 1001);
    expect(nota1?.cliente).toBe("Cliente Fake Ltda");
    expect(nota1?.cancelada).toBe(false);
    expect(nota1?.valorTotal).toBe(500);
  });

  it("respeita paginação", async () => {
    const useCase = new ListarNfeUseCase(new NfeFakeGateway());

    const resultado = await useCase.execute({ pagina: 1, registros_por_pagina: 1 });

    expect(resultado.totalPaginas).toBe(2);
    expect(resultado.notas).toHaveLength(1);
  });

  it("filtra por apenas_canceladas", async () => {
    const useCase = new ListarNfeUseCase(new NfeFakeGateway());

    const resultado = await useCase.execute({ apenas_canceladas: true });

    expect(resultado.notas).toHaveLength(1);
    expect(resultado.notas[0].codigoNota).toBe(1002);
    expect(resultado.notas[0].cancelada).toBe(true);
  });

  it("aplica o filtro genérico sobre o resultado já enriquecido", async () => {
    const useCase = new ListarNfeUseCase(new NfeFakeGateway());

    const resultado = await useCase.execute({
      filtros: [{ campo: "cliente", operador: "contem", valor: "Outro" }],
    });

    expect(resultado.notas).toHaveLength(1);
    expect(resultado.notas[0].codigoNota).toBe(1002);
  });
});

describe("ConsultarNfeUseCase", () => {
  it("consulta por código com itens e títulos", async () => {
    const useCase = new ConsultarNfeUseCase(new NfeFakeGateway());

    const resultado = await useCase.execute({ codigo: 1001 });

    expect(resultado.numero).toBe("000000001");
    expect(resultado.itens).toHaveLength(1);
    expect(resultado.itens[0].descricao).toBe("Ração 100kg");
    expect(resultado.titulos).toHaveLength(1);
    expect(resultado.titulos[0].valor).toBe(500);
  });

  it("consulta por chave", async () => {
    const useCase = new ConsultarNfeUseCase(new NfeFakeGateway());

    const resultado = await useCase.execute({
      chave: "35240100000000000100550010000000022000000021",
    });

    expect(resultado.codigoNota).toBe(1002);
    expect(resultado.cancelada).toBe(true);
  });

  it("lança erro quando a nota não existe", async () => {
    const useCase = new ConsultarNfeUseCase(new NfeFakeGateway());

    await expect(useCase.execute({ codigo: 9999 })).rejects.toThrow();
  });
});
