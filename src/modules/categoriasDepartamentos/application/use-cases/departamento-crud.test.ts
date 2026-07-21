import { describe, expect, it } from "vitest";
import { DepartamentoFakeGateway } from "../../infrastructure/gateways/departamento-fake-gateway.js";
import {
  AlterarDepartamentoUseCase,
  ConsultarDepartamentoUseCase,
  ExcluirDepartamentoUseCase,
  IncluirDepartamentoUseCase,
  ListarDepartamentosUseCase,
} from "./departamento-crud.js";

describe("Departamento CRUD", () => {
  it("inclui, consulta, altera, lista e exclui um departamento", async () => {
    const gateway = new DepartamentoFakeGateway();

    const incluir = await new IncluirDepartamentoUseCase(gateway).execute({
      codigo_pai: "100",
      descricao: "Departamento Teste",
    });
    expect(incluir.codigoStatus).toBe("0");
    const codigo = incluir.codigo;

    const consulta = await new ConsultarDepartamentoUseCase(gateway).execute({ codigo });
    expect(consulta.descricao).toBe("Departamento Teste");

    const listagem = await new ListarDepartamentosUseCase(gateway).execute({});
    expect(listagem.totalRegistros).toBe(1);

    const alterar = await new AlterarDepartamentoUseCase(gateway).execute({ codigo, descricao: "Departamento Alterado" });
    expect(alterar.codigoStatus).toBe("0");

    const excluir = await new ExcluirDepartamentoUseCase(gateway).execute({ codigo });
    expect(excluir.codigoStatus).toBe("0");

    await expect(new ConsultarDepartamentoUseCase(gateway).execute({ codigo })).rejects.toThrow();
  });
});
