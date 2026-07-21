import { describe, expect, it } from "vitest";
import { ContaFakeGateway } from "../../infrastructure/gateways/conta-fake-gateway.js";
import {
  AlterarContaUseCase,
  ConsultarContaUseCase,
  ExcluirContaUseCase,
  IncluirContaUseCase,
  ListarContasUseCase,
} from "./conta-crud.js";

describe("Conta CRM CRUD", () => {
  it("inclui, consulta, altera, lista e exclui uma conta", async () => {
    const gateway = new ContaFakeGateway();

    const incluir = await new IncluirContaUseCase(gateway).execute({
      cod_int_conta: "TESTE-CONTA-001",
      nome: "Conta Teste",
      uf: "DF",
      cidade: "Brasília",
      email: "teste@teste.com",
    });
    expect(incluir.codigoStatus).toBe("0");
    const codigoConta = incluir.codigoConta;

    const consulta = await new ConsultarContaUseCase(gateway).execute({ codigo_conta: codigoConta });
    expect(consulta.nome).toBe("Conta Teste");

    const listagem = await new ListarContasUseCase(gateway).execute({});
    expect(listagem.totalRegistros).toBe(1);

    const alterar = await new AlterarContaUseCase(gateway).execute({ codigo_conta: codigoConta, nome: "Conta Alterada" });
    expect(alterar.codigoStatus).toBe("0");

    const consultaAlterada = await new ConsultarContaUseCase(gateway).execute({ codigo_conta: codigoConta });
    expect(consultaAlterada.nome).toBe("Conta Alterada");

    const excluir = await new ExcluirContaUseCase(gateway).execute({ codigo_conta: codigoConta });
    expect(excluir.codigoStatus).toBe("0");

    await expect(new ConsultarContaUseCase(gateway).execute({ codigo_conta: codigoConta })).rejects.toThrow();
  });
});
