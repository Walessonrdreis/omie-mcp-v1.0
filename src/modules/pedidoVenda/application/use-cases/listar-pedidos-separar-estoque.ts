import { ListarPedidosComClienteResult } from "../dto/listar-pedidos-com-cliente.dto.js";
import { ListarPedidosSepararEstoqueParam } from "../dto/listar-pedidos-separar-estoque.dto.js";
import { ListarPedidosComClienteUseCase } from "./listar-pedidos-com-cliente.js";

const ETAPA_SEPARAR_ESTOQUE = "20";

/**
 * Atalho para o relatório que o usuário mais acompanha no dia a dia: pedidos
 * na etapa "Separar Estoque", já com cliente/itens/quantidades resolvidos
 * (reaproveita `ListarPedidosComClienteUseCase`) e os cancelados removidos
 * por padrão — necessário porque a Omie não reseta a etapa de um pedido
 * cancelado (ver `PedidoVendaOmieGateway`).
 */
export class ListarPedidosSepararEstoqueUseCase {
  constructor(private readonly listarPedidosComClienteUseCase: ListarPedidosComClienteUseCase) {}

  async execute(
    param: ListarPedidosSepararEstoqueParam
  ): Promise<ListarPedidosComClienteResult> {
    const resultado = await this.listarPedidosComClienteUseCase.execute({
      pagina: param.pagina,
      registros_por_pagina: param.registros_por_pagina,
      etapa_codigo: ETAPA_SEPARAR_ESTOQUE,
      filtros: param.filtros,
    });

    if (param.incluir_cancelados) {
      return resultado;
    }

    return {
      ...resultado,
      pedidos: resultado.pedidos.filter((pedido) => !pedido.cancelado),
    };
  }
}
