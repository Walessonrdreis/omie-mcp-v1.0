import { describe, expect, it } from "vitest";
import { ProdutosFakeGateway } from "../../infrastructure/gateways/produtos-fake-gateway.js";
import { IncluirProdutoUseCase } from "./incluir-produto.js";
import { AlterarProdutoUseCase } from "./alterar-produto.js";
import { ExcluirProdutoUseCase } from "./excluir-produto.js";

describe("CRUD de produto (via fake gateway, sem tocar na Omie real)", () => {
  it("inclui um produto novo", async () => {
    const gateway = new ProdutosFakeGateway();
    const useCase = new IncluirProdutoUseCase(gateway);

    const status = await useCase.execute({
      codigo: "NOVO-001",
      descricao: "Produto Novo",
      unidade: "UN",
      valor_unitario: 10,
    });

    expect(status.codigo_status).toBe("0");
    const consultado = await gateway.consultarProduto(status.codigo_produto);
    expect(consultado.descricao).toBe("Produto Novo");
  });

  it("recusa incluir produto com código já existente", async () => {
    const gateway = new ProdutosFakeGateway();
    const useCase = new IncluirProdutoUseCase(gateway);

    await expect(
      useCase.execute({ codigo: "PROD-001", descricao: "Duplicado", unidade: "UN" })
    ).rejects.toThrow();
  });

  it("altera um produto existente por codigo_produto", async () => {
    const gateway = new ProdutosFakeGateway();
    const useCase = new AlterarProdutoUseCase(gateway);

    const status = await useCase.execute({ codigo_produto: 111, descricao: "Produto Renomeado" });

    expect(status.codigo_status).toBe("0");
    const consultado = await gateway.consultarProduto(111);
    expect(consultado.descricao).toBe("Produto Renomeado");
  });

  it("falha ao alterar produto inexistente", async () => {
    const gateway = new ProdutosFakeGateway();
    const useCase = new AlterarProdutoUseCase(gateway);

    await expect(useCase.execute({ codigo_produto: 9999, descricao: "X" })).rejects.toThrow();
  });

  it("exclui um produto existente", async () => {
    const gateway = new ProdutosFakeGateway();
    const useCase = new ExcluirProdutoUseCase(gateway);

    const status = await useCase.execute({ codigo_produto: 222 });

    expect(status.codigo_status).toBe("0");
    await expect(gateway.consultarProduto(222)).rejects.toThrow();
  });

  it("uma instância do fake gateway não vaza estado pra outra", async () => {
    const gatewayA = new ProdutosFakeGateway();
    await new IncluirProdutoUseCase(gatewayA).execute({
      codigo: "ISOLADO-001",
      descricao: "Só existe em A",
      unidade: "UN",
    });

    const gatewayB = new ProdutosFakeGateway();
    const resultado = await gatewayB.listarProdutosPagina(1, 50);
    expect(resultado.produto_servico_cadastro.some((p) => p.codigo === "ISOLADO-001")).toBe(false);
  });
});
