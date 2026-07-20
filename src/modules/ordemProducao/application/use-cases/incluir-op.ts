import { IOrdemProducaoGateway, StatusOPOmie } from "../../domain/interfaces/op-gateway.js";
import { IncluirOPParam } from "../dto/op-crud.dto.js";

export class IncluirOPUseCase {
  constructor(private readonly opGateway: IOrdemProducaoGateway) {}

  async execute(param: IncluirOPParam): Promise<StatusOPOmie> {
    return this.opGateway.incluirOP({ ...param, codigo_local_estoque: param.codigo_local_estoque ?? 0 });
  }
}
