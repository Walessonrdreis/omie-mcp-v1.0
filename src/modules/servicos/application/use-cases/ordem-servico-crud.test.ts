import { describe, expect, it } from "vitest";
import { OrdemServicoFakeGateway } from "../../infrastructure/gateways/ordem-servico-fake-gateway.js";
import {
  AlterarOSUseCase,
  ConsultarOSUseCase,
  ExcluirOSUseCase,
  IncluirOSUseCase,
  ListarOSUseCase,
} from "./ordem-servico-crud.js";

describe("Ordem de Serviço CRUD", () => {
  it("inclui, consulta, altera, lista e exclui uma OS", async () => {
    const gateway = new OrdemServicoFakeGateway();

    const incluir = await new IncluirOSUseCase(gateway).execute({
      cod_int_os: "TESTE-OS-001",
      codigo_cliente: 100,
      codigo_condicao_pagamento: "999",
      data_previsao: "25/07/2026",
      etapa: "10",
      quantidade_parcelas: 1,
      codigo_categoria: "1.01.02",
      codigo_conta_corrente: 200,
      itens: [
        {
          quantidade: 1,
          valor_unitario: 500,
          descricao: "Consultoria",
          tributacao_servico: "1",
          codigo_servico_municipal: "1.01",
          codigo_servico_lc116: "1.01",
          retem_iss: "N",
        },
      ],
    });
    expect(incluir.codigoStatus).toBe("0");
    const codigoOS = incluir.codigoOS;

    const consulta = await new ConsultarOSUseCase(gateway).execute({ codigo_os: codigoOS });
    expect(consulta.valorTotal).toBe(500);
    expect(consulta.itens).toHaveLength(1);

    const listagem = await new ListarOSUseCase(gateway).execute({});
    expect(listagem.totalRegistros).toBe(1);

    const alterar = await new AlterarOSUseCase(gateway).execute({ codigo_os: codigoOS, etapa: "20" });
    expect(alterar.codigoStatus).toBe("0");

    const consultaAlterada = await new ConsultarOSUseCase(gateway).execute({ codigo_os: codigoOS });
    expect(consultaAlterada.etapa).toBe("20");

    const excluir = await new ExcluirOSUseCase(gateway).execute({ codigo_os: codigoOS });
    expect(excluir.codigoStatus).toBe("0");

    await expect(new ConsultarOSUseCase(gateway).execute({ codigo_os: codigoOS })).rejects.toThrow();
  });

  it("aplica o filtro genérico na listagem", async () => {
    const gateway = new OrdemServicoFakeGateway();
    await new IncluirOSUseCase(gateway).execute({
      cod_int_os: "TESTE-OS-002",
      codigo_cliente: 999,
      codigo_condicao_pagamento: "999",
      data_previsao: "25/07/2026",
      etapa: "10",
      quantidade_parcelas: 1,
      codigo_categoria: "1.01.02",
      codigo_conta_corrente: 200,
      itens: [
        {
          quantidade: 1,
          valor_unitario: 1,
          descricao: "X",
          tributacao_servico: "1",
          codigo_servico_municipal: "1.01",
          codigo_servico_lc116: "1.01",
          retem_iss: "N",
        },
      ],
    });

    const resultado = await new ListarOSUseCase(gateway).execute({
      filtros: [{ campo: "codigoCliente", operador: "igual", valor: 999 }],
    });
    expect(resultado.ordens).toHaveLength(1);
  });
});
