import { describe, expect, it } from "vitest";
import { CaracteristicaFakeGateway } from "../../infrastructure/gateways/caracteristica-fake-gateway.js";
import {
  AlterarCaracteristicaUseCase,
  ConsultarCaracteristicaUseCase,
  ExcluirCaracteristicaUseCase,
  IncluirCaracteristicaUseCase,
  ListarCaracteristicasUseCase,
} from "./caracteristica-crud.js";

describe("Característica de Produto CRUD", () => {
  it("inclui, consulta, altera, lista e exclui uma característica", async () => {
    const gateway = new CaracteristicaFakeGateway();

    const incluir = await new IncluirCaracteristicaUseCase(gateway).execute({
      cod_int_caracteristica: "TESTE-CARACT-001",
      nome: "Cor",
      valor_definido: "S",
      conteudos_permitidos: ["Azul", "Verde"],
    });
    expect(incluir.codigoStatus).toBe("0");
    const codigo = incluir.codigoCaracteristica;

    const consulta = await new ConsultarCaracteristicaUseCase(gateway).execute({ codigo_caracteristica: codigo });
    expect(consulta.nome).toBe("Cor");
    expect(consulta.conteudosPermitidos).toEqual(["Azul", "Verde"]);

    const listagem = await new ListarCaracteristicasUseCase(gateway).execute({});
    expect(listagem.totalRegistros).toBe(1);

    const alterar = await new AlterarCaracteristicaUseCase(gateway).execute({ codigo_caracteristica: codigo, nome: "Cor Alterada" });
    expect(alterar.codigoStatus).toBe("0");

    const excluir = await new ExcluirCaracteristicaUseCase(gateway).execute({ codigo_caracteristica: codigo });
    expect(excluir.codigoStatus).toBe("0");

    await expect(new ConsultarCaracteristicaUseCase(gateway).execute({ codigo_caracteristica: codigo })).rejects.toThrow();
  });
});
