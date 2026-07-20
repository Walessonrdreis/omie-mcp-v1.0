import { IProdutosGateway, StatusProdutoOmie } from "../../domain/interfaces/produtos-gateway.js";
import { AlterarProdutoParam } from "../dto/produto-crud.dto.js";

export class AlterarProdutoUseCase {
  constructor(private readonly produtosGateway: IProdutosGateway) {}

  async execute(param: AlterarProdutoParam): Promise<StatusProdutoOmie> {
    const { codigo_produto, codigo, codigo_produto_integracao, ...dados } = param;
    return this.produtosGateway.alterarProduto(
      { codigo_produto, codigo, codigo_produto_integracao },
      dados
    );
  }
}
