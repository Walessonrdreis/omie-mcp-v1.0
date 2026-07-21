import { describe, expect, it } from "vitest";
import { ContasReceberFakeGateway } from "../../infrastructure/gateways/contas-receber-fake-gateway.js";
import {
  CancelarBoletoUseCase,
  GerarBoletoUseCase,
  ObterBoletoUseCase,
  ProrrogarBoletoUseCase,
} from "./boleto-crud.js";

describe("Boleto de Contas a Receber", () => {
  it("obtém 'nenhum boleto gerado' antes de gerar", async () => {
    const gateway = new ContasReceberFakeGateway();
    const resultado = await new ObterBoletoUseCase(gateway).execute({ codigo_titulo: 8001 });
    expect(resultado.codigoStatus).toBe("1998");
    expect(resultado.linkBoleto).toBe("");
  });

  it("gera, obtém, prorroga e cancela um boleto", async () => {
    const gateway = new ContasReceberFakeGateway();

    const gerado = await new GerarBoletoUseCase(gateway).execute({ codigo_titulo: 8001 });
    expect(gerado.codigoStatus).toBe("0");
    expect(gerado.linkBoleto).not.toBe("");

    const obtido = await new ObterBoletoUseCase(gateway).execute({ codigo_titulo: 8001 });
    expect(obtido.codigoStatus).toBe("0");

    const prorrogado = await new ProrrogarBoletoUseCase(gateway).execute({
      codigo_titulo: 8001,
      nova_data_vencimento: "31/12/2026",
    });
    expect(prorrogado.codigoStatus).toBe("0");

    const cancelado = await new CancelarBoletoUseCase(gateway).execute({ codigo_titulo: 8001 });
    expect(cancelado.codigoStatus).toBe("0");

    const obtidoDepois = await new ObterBoletoUseCase(gateway).execute({ codigo_titulo: 8001 });
    expect(obtidoDepois.codigoStatus).toBe("1998");
  });

  it("prorrogar falha se nenhum boleto foi gerado", async () => {
    const gateway = new ContasReceberFakeGateway();
    await expect(
      new ProrrogarBoletoUseCase(gateway).execute({ codigo_titulo: 8002, nova_data_vencimento: "31/12/2026" })
    ).rejects.toThrow();
  });
});
