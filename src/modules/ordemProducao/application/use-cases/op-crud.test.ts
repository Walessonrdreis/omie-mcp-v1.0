import { describe, expect, it } from "vitest";
import { OpFakeGateway } from "../../infrastructure/gateways/op-fake-gateway.js";
import { IncluirOPUseCase } from "./incluir-op.js";
import { AlterarOPUseCase } from "./alterar-op.js";
import { ExcluirOPUseCase } from "./excluir-op.js";
import { ConsultarOPUseCase } from "./consultar-op.js";

describe("CRUD de OP (via fake gateway, sem tocar na Omie real)", () => {
  it("inclui uma OP nova", async () => {
    const gateway = new OpFakeGateway();
    const useCase = new IncluirOPUseCase(gateway);

    const status = await useCase.execute({
      cCodIntOP: "OP-NOVA-001",
      nCodProduto: 333,
      dDtPrevisao: "31/12/2026",
      nQtde: 10,
    });

    expect(status.cCodStatus).toBe("0");
    const consultada = await gateway.consultarOP({ nCodOP: status.nCodOP });
    expect(consultada.identificacao.nCodProduto).toBe(333);
  });

  it("consulta uma OP existente por nCodOP", async () => {
    const gateway = new OpFakeGateway();
    const useCase = new ConsultarOPUseCase(gateway);

    const ordem = await useCase.execute({ nCodOP: 1001 });

    expect(ordem.identificacao.nCodProduto).toBe(111);
  });

  it("falha ao consultar OP inexistente", async () => {
    const gateway = new OpFakeGateway();
    const useCase = new ConsultarOPUseCase(gateway);

    await expect(useCase.execute({ nCodOP: 999999 })).rejects.toThrow();
  });

  it("altera quantidade e data de uma OP existente", async () => {
    const gateway = new OpFakeGateway();
    const useCase = new AlterarOPUseCase(gateway);

    const status = await useCase.execute({
      nCodOP: 1001,
      nCodProduto: 111,
      dDtPrevisao: "01/01/2027",
      nQtde: 50,
    });

    expect(status.cCodStatus).toBe("0");
    const consultada = await gateway.consultarOP({ nCodOP: 1001 });
    expect(consultada.identificacao.nQtde).toBe(50);
    expect(consultada.identificacao.dDtPrevisao).toBe("01/01/2027");
  });

  it("exclui uma OP existente", async () => {
    const gateway = new OpFakeGateway();
    const useCase = new ExcluirOPUseCase(gateway);

    const status = await useCase.execute({ nCodOP: 1002 });

    expect(status.cCodStatus).toBe("1");
    await expect(gateway.consultarOP({ nCodOP: 1002 })).rejects.toThrow();
  });

  it("uma instância do fake gateway não vaza estado pra outra", async () => {
    const gatewayA = new OpFakeGateway();
    await new IncluirOPUseCase(gatewayA).execute({
      cCodIntOP: "ISOLADA-001",
      nCodProduto: 1,
      dDtPrevisao: "31/12/2026",
      nQtde: 1,
    });

    const gatewayB = new OpFakeGateway();
    const resultado = await gatewayB.listarOrdensPagina(1, 50);
    expect(resultado.cadastros.some((o) => o.identificacao.cCodIntOP === "ISOLADA-001")).toBe(false);
  });
});
