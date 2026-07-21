import { describe, expect, it } from "vitest";
import { NfseFakeGateway } from "../../infrastructure/gateways/nfse-fake-gateway.js";
import { ListarLC116UseCase, ListarNFSeUseCase } from "./nfse-lc116.js";

describe("NFS-e e LC116", () => {
  it("lista NFS-e emitidas", async () => {
    const resultado = await new ListarNFSeUseCase(new NfseFakeGateway()).execute({});
    expect(resultado.totalRegistros).toBe(1);
    expect(resultado.notas[0].numero).toBe("1");
  });

  it("lista códigos LC116", async () => {
    const resultado = await new ListarLC116UseCase(new NfseFakeGateway()).execute({});
    expect(resultado.codigos).toHaveLength(1);
    expect(resultado.codigos[0].codigo).toBe("1.01");
  });
});
