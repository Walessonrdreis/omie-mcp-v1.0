import { IProdutosGateway, StatusProdutoOmie } from "../../domain/interfaces/produtos-gateway.js";
import { ExcluirProdutoParam } from "../dto/produto-crud.dto.js";

export class ExcluirProdutoUseCase {
  constructor(private readonly produtosGateway: IProdutosGateway) {}

  async execute(param: ExcluirProdutoParam): Promise<StatusProdutoOmie> {
    return this.produtosGateway.excluirProduto(param);
  }
}
