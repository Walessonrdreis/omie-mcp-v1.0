import { describe, expect, it } from "vitest";
import { PedidoVendaFakeGateway } from "../../infrastructure/gateways/pedido-venda-fake-gateway.js";
import { ListarProdutosParaSepararUseCase } from "./listar-produtos-para-separar.js";

describe("ListarProdutosParaSepararUseCase", () => {
  it("remove pedidos cancelados e resume por produto", async () => {
    const useCase = new ListarProdutosParaSepararUseCase(new PedidoVendaFakeGateway());

    const resultado = await useCase.execute({});

    expect(resultado.itens).toHaveLength(1);
    expect(resultado.itens[0].codigoProduto).toBe(111);
    expect(resultado.resumoPorProduto).toEqual([
      {
        codigoProduto: 111,
        codigoSku: "PROD-001",
        descricaoProduto: "Produto Fake 1",
        quantidadeTotalASeparar: 3,
        emQuantosPedidos: 1,
      },
    ]);
    expect(resultado.etapaDescricao).toBe("Separar Estoque");
  });

  it("aplica o filtro genérico sobre os itens antes de resumir por produto", async () => {
    const useCase = new ListarProdutosParaSepararUseCase(new PedidoVendaFakeGateway());

    const resultado = await useCase.execute({
      filtros: [{ campo: "quantidade", operador: "maior_que", valor: 10 }],
    });

    expect(resultado.itens).toHaveLength(0);
    expect(resultado.resumoPorProduto).toHaveLength(0);
  });
});
