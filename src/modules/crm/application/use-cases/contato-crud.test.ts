import { describe, expect, it } from "vitest";
import { ContatoFakeGateway } from "../../infrastructure/gateways/contato-fake-gateway.js";
import {
  AlterarContatoUseCase,
  ConsultarContatoUseCase,
  ExcluirContatoUseCase,
  IncluirContatoUseCase,
  ListarContatosUseCase,
} from "./contato-crud.js";

describe("Contato CRM CRUD", () => {
  it("inclui, consulta, altera, lista e exclui um contato", async () => {
    const gateway = new ContatoFakeGateway();

    const incluir = await new IncluirContatoUseCase(gateway).execute({
      cod_int_contato: "TESTE-CONTATO-001",
      nome: "Fulano",
      sobrenome: "Teste",
      codigo_conta: 100,
    });
    expect(incluir.codigoStatus).toBe("0");
    const codigoContato = incluir.codigoContato;

    const consulta = await new ConsultarContatoUseCase(gateway).execute({ codigo_contato: codigoContato });
    expect(consulta.nome).toBe("Fulano");
    expect(consulta.codigoConta).toBe(100);

    const listagem = await new ListarContatosUseCase(gateway).execute({});
    expect(listagem.totalRegistros).toBe(1);

    const alterar = await new AlterarContatoUseCase(gateway).execute({ codigo_contato: codigoContato, sobrenome: "Alterado" });
    expect(alterar.codigoStatus).toBe("0");

    const excluir = await new ExcluirContatoUseCase(gateway).execute({ codigo_contato: codigoContato });
    expect(excluir.codigoStatus).toBe("0");

    await expect(new ConsultarContatoUseCase(gateway).execute({ codigo_contato: codigoContato })).rejects.toThrow();
  });
});
