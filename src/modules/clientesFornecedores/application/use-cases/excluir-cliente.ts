import { IClientesGateway, StatusClienteOmie } from "../../domain/interfaces/clientes-gateway.js";
import { ExcluirClienteParam } from "../dto/cliente-crud.dto.js";

export class ExcluirClienteUseCase {
  constructor(private readonly clientesGateway: IClientesGateway) {}

  async execute(param: ExcluirClienteParam): Promise<StatusClienteOmie> {
    return this.clientesGateway.excluirCliente(param);
  }
}
