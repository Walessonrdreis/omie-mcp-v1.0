import {
  AlterarIncluirEstruturaResponse,
  IEstruturaGateway,
} from "../../domain/interfaces/estrutura-gateway.js";
import { IncluirEstruturaParam } from "../dto/estrutura-crud.dto.js";

export class IncluirEstruturaUseCase {
  constructor(private readonly estruturaGateway: IEstruturaGateway) {}

  async execute(param: IncluirEstruturaParam): Promise<AlterarIncluirEstruturaResponse> {
    return this.estruturaGateway.incluirItensEstrutura(param.idProduto, param.itens);
  }
}
