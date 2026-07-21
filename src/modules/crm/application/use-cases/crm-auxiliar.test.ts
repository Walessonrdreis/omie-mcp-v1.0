import { describe, expect, it } from "vitest";
import { CrmAuxiliarFakeGateway } from "../../infrastructure/gateways/crm-auxiliar-fake-gateway.js";
import { ListarFasesUseCase, ListarOrigensUseCase, ListarSolucoesUseCase } from "./crm-auxiliar.js";

describe("Cadastros auxiliares do CRM", () => {
  it("lista fases", async () => {
    const resultado = await new ListarFasesUseCase(new CrmAuxiliarFakeGateway()).execute({});
    expect(resultado.fases).toHaveLength(1);
  });

  it("lista soluções", async () => {
    const resultado = await new ListarSolucoesUseCase(new CrmAuxiliarFakeGateway()).execute({});
    expect(resultado.solucoes[0].codigo).toBe(1);
  });

  it("lista origens", async () => {
    const resultado = await new ListarOrigensUseCase(new CrmAuxiliarFakeGateway()).execute({});
    expect(resultado.origens[0].descricao).toBe("Ativo (fake)");
  });
});
