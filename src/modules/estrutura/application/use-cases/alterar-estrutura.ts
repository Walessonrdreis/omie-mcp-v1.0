import {
  AlterarIncluirEstruturaResponse,
  IEstruturaGateway,
} from "../../domain/interfaces/estrutura-gateway.js";
import { AlterarEstruturaParam } from "../dto/estrutura-crud.dto.js";

export class AlterarEstruturaUseCase {
  constructor(private readonly estruturaGateway: IEstruturaGateway) {}

  async execute(param: AlterarEstruturaParam): Promise<AlterarIncluirEstruturaResponse> {
    return this.estruturaGateway.alterarItensEstrutura(param.idProduto, param.itens);
  }
}
