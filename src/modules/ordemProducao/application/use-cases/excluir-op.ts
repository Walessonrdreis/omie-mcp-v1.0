import { IOrdemProducaoGateway, StatusOPOmie } from "../../domain/interfaces/op-gateway.js";
import { ChaveOPParam } from "../dto/op-crud.dto.js";

export class ExcluirOPUseCase {
  constructor(private readonly opGateway: IOrdemProducaoGateway) {}

  async execute(param: ChaveOPParam): Promise<StatusOPOmie> {
    return this.opGateway.excluirOP(param);
  }
}
