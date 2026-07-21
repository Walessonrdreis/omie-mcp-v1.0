import { IEstoqueGateway, StatusAjusteEstoqueOmie } from "../../domain/interfaces/estoque-gateway.js";
import { IncluirAjusteEstoqueParam } from "../dto/ajuste-estoque.dto.js";

export class IncluirAjusteEstoqueUseCase {
  constructor(private readonly estoqueGateway: IEstoqueGateway) {}

  async execute(param: IncluirAjusteEstoqueParam): Promise<StatusAjusteEstoqueOmie> {
    return this.estoqueGateway.incluirAjuste(param);
  }
}
