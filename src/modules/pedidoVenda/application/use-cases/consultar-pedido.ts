import { IPedidoVendaGateway, PedidoVenda } from "../../domain/interfaces/pedido-venda-gateway.js";
import { ChavePedidoParam } from "../dto/pedido-crud.dto.js";

export class ConsultarPedidoUseCase {
  constructor(private readonly pedidoGateway: IPedidoVendaGateway) {}

  async execute(param: ChavePedidoParam): Promise<PedidoVenda> {
    return this.pedidoGateway.consultarPedido(param);
  }
}
