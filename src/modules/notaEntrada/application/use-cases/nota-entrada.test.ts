import { describe, expect, it } from "vitest";
import { NotaEntradaFakeGateway } from "../../infrastructure/gateways/nota-entrada-fake-gateway.js";
import { ConsultarNotaEntradaUseCase, ListarNotaEntradaUseCase } from "./nota-entrada.js";

describe("Nota de Entrada (somente leitura)", () => {
  it("lista notas de entrada", async () => {
    const resultado = await new ListarNotaEntradaUseCase(new NotaEntradaFakeGateway()).execute({});
    expect(resultado.totalRegistros).toBe(1);
    expect(resultado.notas[0].valorTotal).toBe(500);
  });

  it("consulta uma nota com itens", async () => {
    const resultado = await new ConsultarNotaEntradaUseCase(new NotaEntradaFakeGateway()).execute({ codigo_nota: 1001 });
    expect(resultado.itens).toHaveLength(1);
    expect(resultado.itens[0].cfop).toBe("1.102");
  });

  it("lança erro para nota inexistente", async () => {
    await expect(
      new ConsultarNotaEntradaUseCase(new NotaEntradaFakeGateway()).execute({ codigo_nota: 9999 })
    ).rejects.toThrow();
  });
});
