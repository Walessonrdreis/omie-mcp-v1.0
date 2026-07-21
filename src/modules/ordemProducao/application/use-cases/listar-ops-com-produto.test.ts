import { describe, expect, it } from "vitest";
import { ProdutosFakeGateway } from "../../../produtos/infrastructure/gateways/produtos-fake-gateway.js";
import { OpFakeGateway } from "../../infrastructure/gateways/op-fake-gateway.js";
import { ListarOpsComProdutoUseCase } from "./listar-ops-com-produto.js";

describe("ListarOpsComProdutoUseCase", () => {
  it("enriquece cada OP com a descrição/SKU do produto", async () => {
    const useCase = new ListarOpsComProdutoUseCase(new OpFakeGateway(), new ProdutosFakeGateway());

    const resultado = await useCase.execute({});

    expect(resultado.totalRegistros).toBe(2);
    const op1 = resultado.itens.find((i) => i.codigoOP === 1001);
    expect(op1?.descricaoProduto).toBe("Produto Fake 1");
    expect(op1?.codigoSku).toBe("PROD-001");
    expect(op1?.concluida).toBe(false);
  });

  it("filtra OPs concluídas quando apenas_nao_concluidas=true", async () => {
    const useCase = new ListarOpsComProdutoUseCase(new OpFakeGateway(), new ProdutosFakeGateway());

    const resultado = await useCase.execute({ apenas_nao_concluidas: true });

    expect(resultado.itens.every((i) => !i.concluida)).toBe(true);
    expect(resultado.itens.find((i) => i.codigoOP === 1002)).toBeUndefined();
  });

  it("aplica o filtro genérico sobre o resultado já enriquecido", async () => {
    const useCase = new ListarOpsComProdutoUseCase(new OpFakeGateway(), new ProdutosFakeGateway());

    const resultado = await useCase.execute({
      filtros: [{ campo: "descricaoProduto", operador: "contem", valor: "fake 1" }],
    });

    expect(resultado.itens).toHaveLength(1);
    expect(resultado.itens[0].codigoOP).toBe(1001);
  });
});
