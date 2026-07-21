import { IClientesGateway, StatusClienteOmie } from "../../domain/interfaces/clientes-gateway.js";
import { IncluirClienteParam } from "../dto/cliente-crud.dto.js";

export class IncluirClienteUseCase {
  constructor(private readonly clientesGateway: IClientesGateway) {}

  async execute(param: IncluirClienteParam): Promise<StatusClienteOmie> {
    return this.clientesGateway.incluirCliente(param);
  }
}
