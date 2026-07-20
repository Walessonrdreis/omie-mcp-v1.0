import { ExcluirEstruturaStatus, IEstruturaGateway } from "../../domain/interfaces/estrutura-gateway.js";
import { ExcluirEstruturaParam } from "../dto/estrutura-crud.dto.js";

export class ExcluirEstruturaUseCase {
  constructor(private readonly estruturaGateway: IEstruturaGateway) {}

  async execute(param: ExcluirEstruturaParam): Promise<ExcluirEstruturaStatus> {
    return this.estruturaGateway.excluirItemEstrutura(param.idProduto, param.idMalha);
  }
}
