import { IPedidoVendaGateway, StatusPedidoOmie } from "../../domain/interfaces/pedido-venda-gateway.js";
import { ChavePedidoParam } from "../dto/pedido-crud.dto.js";

export class ExcluirPedidoUseCase {
  constructor(private readonly pedidoGateway: IPedidoVendaGateway) {}

  async execute(param: ChavePedidoParam): Promise<StatusPedidoOmie> {
    return this.pedidoGateway.excluirPedido(param);
  }
}
