import { describe, expect, it } from "vitest";
import { EstruturaFakeGateway } from "../../infrastructure/gateways/estrutura-fake-gateway.js";
import { IncluirEstruturaUseCase } from "./incluir-estrutura.js";
import { AlterarEstruturaUseCase } from "./alterar-estrutura.js";
import { ExcluirEstruturaUseCase } from "./excluir-estrutura.js";

describe("CRUD de estrutura (via fake gateway, sem tocar na Omie real)", () => {
  it("inclui um item novo na estrutura de um produto existente", async () => {
    const gateway = new EstruturaFakeGateway();
    const useCase = new IncluirEstruturaUseCase(gateway);

    const resultado = await useCase.execute({
      idProduto: 111,
      itens: [{ intMalha: "ITEM-NOVO", idProdMalha: 999, quantProdMalha: 3 }],
    });

    expect(resultado.itemMalhaStatus).toHaveLength(1);
    expect(resultado.itemMalhaStatus[0].codStatus).toBe("ADD");

    const listagem = await gateway.listarEstruturasPagina(1, 50);
    const produto = listagem.produtosEncontrados.find((p) => p.ident.idProduto === 111);
    expect(produto?.itens).toHaveLength(3);
  });

  it("falha ao incluir item em produto que não existe na estrutura", async () => {
    const gateway = new EstruturaFakeGateway();
    const useCase = new IncluirEstruturaUseCase(gateway);

    await expect(
      useCase.execute({ idProduto: 999999, itens: [{ intMalha: "X", idProdMalha: 1, quantProdMalha: 1 }] })
    ).rejects.toThrow();
  });

  it("altera a quantidade de um item existente", async () => {
    const gateway = new EstruturaFakeGateway();
    const useCase = new AlterarEstruturaUseCase(gateway);

    const resultado = await useCase.execute({
      idProduto: 111,
      itens: [{ idMalha: 1, idProdMalha: 501, quantProdMalha: 99 }],
    });

    expect(resultado.itemMalhaStatus[0].codStatus).toBe("UPD");
    const listagem = await gateway.listarEstruturasPagina(1, 50);
    const produto = listagem.produtosEncontrados.find((p) => p.ident.idProduto === 111);
    expect(produto?.itens.find((i) => i.idMalha === 1)?.quantProdMalha).toBe(99);
  });

  it("exclui um item existente", async () => {
    const gateway = new EstruturaFakeGateway();
    const useCase = new ExcluirEstruturaUseCase(gateway);

    const status = await useCase.execute({ idProduto: 111, idMalha: 1 });

    expect(status.codStatus).toBe("0");
    const listagem = await gateway.listarEstruturasPagina(1, 50);
    const produto = listagem.produtosEncontrados.find((p) => p.ident.idProduto === 111);
    expect(produto?.itens.some((i) => i.idMalha === 1)).toBe(false);
  });

  it("uma instância do fake gateway não vaza estado pra outra", async () => {
    const gatewayA = new EstruturaFakeGateway();
    await new IncluirEstruturaUseCase(gatewayA).execute({
      idProduto: 111,
      itens: [{ intMalha: "SO-EM-A", idProdMalha: 1, quantProdMalha: 1 }],
    });

    const gatewayB = new EstruturaFakeGateway();
    const listagem = await gatewayB.listarEstruturasPagina(1, 50);
    const produto = listagem.produtosEncontrados.find((p) => p.ident.idProduto === 111);
    expect(produto?.itens).toHaveLength(2);
  });
});
