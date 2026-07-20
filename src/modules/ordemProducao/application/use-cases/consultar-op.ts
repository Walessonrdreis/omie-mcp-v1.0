import { IOrdemProducaoGateway, OrdemProducaoDetalhada } from "../../domain/interfaces/op-gateway.js";
import { ChaveOPParam } from "../dto/op-crud.dto.js";

export class ConsultarOPUseCase {
  constructor(private readonly opGateway: IOrdemProducaoGateway) {}

  async execute(param: ChaveOPParam): Promise<OrdemProducaoDetalhada> {
    return this.opGateway.consultarOP(param);
  }
}
