import { IOrdemProducaoGateway, StatusOPOmie } from "../../domain/interfaces/op-gateway.js";
import { AlterarOPParam } from "../dto/op-crud.dto.js";

export class AlterarOPUseCase {
  constructor(private readonly opGateway: IOrdemProducaoGateway) {}

  async execute(param: AlterarOPParam): Promise<StatusOPOmie> {
    return this.opGateway.alterarOP({ ...param, codigo_local_estoque: param.codigo_local_estoque ?? 0 });
  }
}
