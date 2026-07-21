import { IEstoqueGateway, StatusAjusteEstoqueOmie } from "../../domain/interfaces/estoque-gateway.js";
import { ExcluirAjusteEstoqueParam } from "../dto/ajuste-estoque.dto.js";

export class ExcluirAjusteEstoqueUseCase {
  constructor(private readonly estoqueGateway: IEstoqueGateway) {}

  async execute(param: ExcluirAjusteEstoqueParam): Promise<StatusAjusteEstoqueOmie> {
    return this.estoqueGateway.excluirAjuste(param.id_ajuste);
  }
}
