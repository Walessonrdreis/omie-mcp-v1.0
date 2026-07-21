import { IClientesGateway, StatusClienteOmie } from "../../domain/interfaces/clientes-gateway.js";
import { AlterarClienteParam } from "../dto/cliente-crud.dto.js";

export class AlterarClienteUseCase {
  constructor(private readonly clientesGateway: IClientesGateway) {}

  async execute(param: AlterarClienteParam): Promise<StatusClienteOmie> {
    const { codigo_cliente_omie, codigo_cliente_integracao, ...dados } = param;
    return this.clientesGateway.alterarCliente(
      { codigo_cliente_omie, codigo_cliente_integracao },
      dados
    );
  }
}
