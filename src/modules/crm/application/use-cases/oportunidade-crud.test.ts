import { describe, expect, it } from "vitest";
import { OportunidadeFakeGateway } from "../../infrastructure/gateways/oportunidade-fake-gateway.js";
import {
  AlterarOportunidadeUseCase,
  ConsultarOportunidadeUseCase,
  ExcluirOportunidadeUseCase,
  IncluirOportunidadeUseCase,
  ListarOportunidadesUseCase,
} from "./oportunidade-crud.js";

describe("Oportunidade CRM CRUD", () => {
  it("inclui, consulta, altera, lista e exclui uma oportunidade", async () => {
    const gateway = new OportunidadeFakeGateway();

    const incluir = await new IncluirOportunidadeUseCase(gateway).execute({
      cod_int_oportunidade: "TESTE-OPORT-001",
      descricao: "Oportunidade Teste",
      codigo_conta: 100,
      codigo_contato: 200,
      codigo_solucao: 1,
      codigo_origem: 1,
    });
    expect(incluir.codigoStatus).toBe("0");
    const codigoOportunidade = incluir.codigoOportunidade;

    const consulta = await new ConsultarOportunidadeUseCase(gateway).execute({ codigo_oportunidade: codigoOportunidade });
    expect(consulta.descricao).toBe("Oportunidade Teste");

    const listagem = await new ListarOportunidadesUseCase(gateway).execute({});
    expect(listagem.totalRegistros).toBe(1);

    const alterar = await new AlterarOportunidadeUseCase(gateway).execute({
      codigo_oportunidade: codigoOportunidade,
      descricao: "Oportunidade Alterada",
    });
    expect(alterar.codigoStatus).toBe("0");

    const excluir = await new ExcluirOportunidadeUseCase(gateway).execute({ codigo_oportunidade: codigoOportunidade });
    expect(excluir.codigoStatus).toBe("0");

    await expect(
      new ConsultarOportunidadeUseCase(gateway).execute({ codigo_oportunidade: codigoOportunidade })
    ).rejects.toThrow();
  });
});
