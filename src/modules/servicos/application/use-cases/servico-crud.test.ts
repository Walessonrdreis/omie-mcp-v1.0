import { describe, expect, it } from "vitest";
import { ServicoFakeGateway } from "../../infrastructure/gateways/servico-fake-gateway.js";
import {
  AlterarServicoUseCase,
  ConsultarServicoUseCase,
  ExcluirServicoUseCase,
  IncluirServicoUseCase,
  ListarServicosUseCase,
} from "./servico-crud.js";

describe("Serviço CRUD", () => {
  it("inclui, consulta, altera, lista e exclui um serviço", async () => {
    const gateway = new ServicoFakeGateway();

    const incluir = await new IncluirServicoUseCase(gateway).execute({
      cod_int_servico: "TESTE-SERV-001",
      descricao: "Consultoria",
      codigo: "SERV-001",
      preco_unitario: 500,
    });
    expect(incluir.codigoStatus).toBe("0");
    const codigoServico = incluir.codigoServico;

    const consulta = await new ConsultarServicoUseCase(gateway).execute({ codigo_servico: codigoServico });
    expect(consulta.descricao).toBe("Consultoria");
    expect(consulta.precoUnitario).toBe(500);

    const listagem = await new ListarServicosUseCase(gateway).execute({});
    expect(listagem.totalRegistros).toBe(1);

    const alterar = await new AlterarServicoUseCase(gateway).execute({
      codigo_servico: codigoServico,
      preco_unitario: 600,
    });
    expect(alterar.codigoStatus).toBe("0");

    const consultaAlterada = await new ConsultarServicoUseCase(gateway).execute({ codigo_servico: codigoServico });
    expect(consultaAlterada.precoUnitario).toBe(600);

    const excluir = await new ExcluirServicoUseCase(gateway).execute({ codigo_servico: codigoServico });
    expect(excluir.codigoStatus).toBe("0");

    await expect(
      new ConsultarServicoUseCase(gateway).execute({ codigo_servico: codigoServico })
    ).rejects.toThrow();
  });
});
