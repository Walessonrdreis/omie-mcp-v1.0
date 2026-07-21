import { describe, expect, it } from "vitest";
import { CadastrosAuxiliaresFakeGateway } from "../../infrastructure/gateways/cadastros-auxiliares-fake-gateway.js";
import {
  ConsultarUnidadeUseCase,
  ListarBancosUseCase,
  ListarCidadesUseCase,
  ListarNCMUseCase,
  ListarPaisesUseCase,
} from "./cadastros-auxiliares.js";

describe("Cadastros auxiliares", () => {
  it("lista bancos", async () => {
    const resultado = await new ListarBancosUseCase(new CadastrosAuxiliaresFakeGateway()).execute({});
    expect(resultado.bancos[0].codigo).toBe("001");
  });

  it("lista cidades", async () => {
    const resultado = await new ListarCidadesUseCase(new CadastrosAuxiliaresFakeGateway()).execute({});
    expect(resultado.cidades[0].uf).toBe("DF");
  });

  it("lista países", async () => {
    const resultado = await new ListarPaisesUseCase(new CadastrosAuxiliaresFakeGateway()).execute({});
    expect(resultado.paises[0].codigoIso).toBe("BR");
  });

  it("lista NCM", async () => {
    const resultado = await new ListarNCMUseCase(new CadastrosAuxiliaresFakeGateway()).execute({});
    expect(resultado.codigos[0].codigo).toBe("0000.00.00");
  });

  it("consulta unidade", async () => {
    const resultado = await new ConsultarUnidadeUseCase(new CadastrosAuxiliaresFakeGateway()).execute({ codigo: "UN" });
    expect(resultado.codigo).toBe("UN");
  });
});
