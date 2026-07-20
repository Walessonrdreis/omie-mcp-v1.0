import { IProdutosGateway, StatusProdutoOmie } from "../../domain/interfaces/produtos-gateway.js";
import { IncluirProdutoParam } from "../dto/produto-crud.dto.js";

export class IncluirProdutoUseCase {
  constructor(private readonly produtosGateway: IProdutosGateway) {}

  async execute(param: IncluirProdutoParam): Promise<StatusProdutoOmie> {
    return this.produtosGateway.incluirProduto(param);
  }
}
