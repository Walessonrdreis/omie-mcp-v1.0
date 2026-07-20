import { describe, expect, it } from "vitest";
import { EstoqueFakeGateway } from "../../../estoque/infrastructure/gateways/estoque-fake-gateway.js";
import { ProdutosFakeGateway } from "../../infrastructure/gateways/produtos-fake-gateway.js";
import { ListarProdutosComEstoqueUseCase } from "./listar-produtos-com-estoque.js";

describe("ListarProdutosComEstoqueUseCase", () => {
  it("cruza cadastro de produtos com posição de estoque", async () => {
    const useCase = new ListarProdutosComEstoqueUseCase(
      new ProdutosFakeGateway(),
      new EstoqueFakeGateway()
    );

    const resultado = await useCase.execute({});

    expect(resultado.totalRegistros).toBe(2);
    const produto1 = resultado.itens.find((i) => i.codigoProduto === 111);
    expect(produto1?.quantidadeEmEstoque).toBe(150);
    expect(produto1?.valorEmEstoqueVenda).toBe(150 * 25);
  });

  it("filtra produtos com estoque zerado quando apenas_com_estoque=true", async () => {
    const estoqueGateway = new EstoqueFakeGateway([
      {
        cCodigo: "PROD-001",
        cDescricao: "Produto Fake 1",
        codigo_local_estoque: 1,
        fisico: 0,
        nCodProd: 111,
        nSaldo: 0,
        reservado: 0,
        nPendente: 0,
        nCMC: 0,
      },
    ]);
    const useCase = new ListarProdutosComEstoqueUseCase(
      new ProdutosFakeGateway(),
      estoqueGateway
    );

    const resultado = await useCase.execute({ apenas_com_estoque: true });

    expect(resultado.itens.every((i) => i.quantidadeEmEstoque !== 0)).toBe(true);
    expect(resultado.itens.find((i) => i.codigoProduto === 111)).toBeUndefined();
  });
});
