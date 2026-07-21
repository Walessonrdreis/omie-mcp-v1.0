import { IPedidoVendaGateway, StatusPedidoOmie } from "../../domain/interfaces/pedido-venda-gateway.js";
import { IncluirPedidoParam } from "../dto/pedido-crud.dto.js";

export class IncluirPedidoUseCase {
  constructor(private readonly pedidoGateway: IPedidoVendaGateway) {}

  async execute(param: IncluirPedidoParam): Promise<StatusPedidoOmie> {
    return this.pedidoGateway.incluirPedido(param);
  }
}
