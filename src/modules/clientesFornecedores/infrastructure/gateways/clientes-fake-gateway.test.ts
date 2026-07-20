import { describe, expect, it } from "vitest";
import { ClientesFakeGateway } from "./clientes-fake-gateway.js";

describe("ClientesFakeGateway", () => {
  it("consulta um cliente por código", async () => {
    const gateway = new ClientesFakeGateway();

    const cliente = await gateway.consultarCliente(5001);

    expect(cliente.razao_social).toBe("Cliente Fake Ltda");
  });

  it("lança erro pra código não cadastrado", async () => {
    const gateway = new ClientesFakeGateway();

    await expect(gateway.consultarCliente(9999)).rejects.toThrow(
      "Cliente de código 9999 não cadastrado (fake)."
    );
  });

  it("consulta em lote, deduplicando e omitindo não encontrados", async () => {
    const gateway = new ClientesFakeGateway();

    const mapa = await gateway.consultarClientesPorCodigo([5001, 5001, 9999]);

    expect(mapa.size).toBe(1);
    expect(mapa.get(5001)?.razao_social).toBe("Cliente Fake Ltda");
  });
});
