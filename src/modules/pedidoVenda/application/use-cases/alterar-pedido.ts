import { IPedidoVendaGateway, StatusPedidoOmie } from "../../domain/interfaces/pedido-venda-gateway.js";
import { AlterarPedidoParam } from "../dto/pedido-crud.dto.js";

export class AlterarPedidoUseCase {
  constructor(private readonly pedidoGateway: IPedidoVendaGateway) {}

  async execute(param: AlterarPedidoParam): Promise<StatusPedidoOmie> {
    return this.pedidoGateway.alterarPedido(param);
  }
}
