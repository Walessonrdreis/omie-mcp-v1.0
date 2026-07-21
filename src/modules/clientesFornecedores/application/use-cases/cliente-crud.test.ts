import { describe, expect, it } from "vitest";
import { ClientesFakeGateway } from "../../infrastructure/gateways/clientes-fake-gateway.js";
import { IncluirClienteUseCase } from "./incluir-cliente.js";
import { AlterarClienteUseCase } from "./alterar-cliente.js";
import { ExcluirClienteUseCase } from "./excluir-cliente.js";

describe("CRUD de cliente/fornecedor (via fake gateway, sem tocar na Omie real)", () => {
  it("inclui um cliente novo", async () => {
    const gateway = new ClientesFakeGateway();
    const useCase = new IncluirClienteUseCase(gateway);

    const status = await useCase.execute({
      codigo_cliente_integracao: "NOVO-001",
      razao_social: "Cliente Novo Ltda",
      cnpj_cpf: "22.222.222/0001-22",
    });

    expect(status.codigo_status).toBe("0");
    const consultado = await gateway.consultarCliente(status.codigo_cliente_omie);
    expect(consultado.razao_social).toBe("Cliente Novo Ltda");
  });

  it("recusa incluir cliente com CNPJ/CPF já existente", async () => {
    const gateway = new ClientesFakeGateway();
    const useCase = new IncluirClienteUseCase(gateway);

    await expect(
      useCase.execute({
        codigo_cliente_integracao: "DUP-001",
        razao_social: "Duplicado",
        cnpj_cpf: "00.000.000/0001-00",
      })
    ).rejects.toThrow();
  });

  it("altera um cliente existente", async () => {
    const gateway = new ClientesFakeGateway();
    const useCase = new AlterarClienteUseCase(gateway);

    const status = await useCase.execute({ codigo_cliente_omie: 5001, nome_fantasia: "Renomeado" });

    expect(status.codigo_status).toBe("0");
    const consultado = await gateway.consultarCliente(5001);
    expect(consultado.nome_fantasia).toBe("Renomeado");
  });

  it("falha ao alterar cliente inexistente", async () => {
    const gateway = new ClientesFakeGateway();
    const useCase = new AlterarClienteUseCase(gateway);

    await expect(useCase.execute({ codigo_cliente_omie: 9999, nome_fantasia: "X" })).rejects.toThrow();
  });

  it("exclui um cliente existente", async () => {
    const gateway = new ClientesFakeGateway();
    const useCase = new ExcluirClienteUseCase(gateway);

    const status = await useCase.execute({ codigo_cliente_omie: 5002 });

    expect(status.codigo_status).toBe("0");
    await expect(gateway.consultarCliente(5002)).rejects.toThrow();
  });

  it("uma instância do fake gateway não vaza estado pra outra", async () => {
    const gatewayA = new ClientesFakeGateway();
    await new IncluirClienteUseCase(gatewayA).execute({
      codigo_cliente_integracao: "ISOLADO-001",
      razao_social: "Só existe em A",
      cnpj_cpf: "33.333.333/0001-33",
    });

    const gatewayB = new ClientesFakeGateway();
    const mapa = await gatewayB.consultarClientesPorCodigo([5001, 5002]);
    expect(mapa.size).toBe(2);
  });
});
