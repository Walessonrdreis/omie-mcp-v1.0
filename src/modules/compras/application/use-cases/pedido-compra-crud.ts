import { IPedidoCompraGateway } from "../../domain/interfaces/pedido-compra-gateway.js";
import { aplicarFiltros } from "../../../../shared/filtro.js";
import {
  AlterarPedidoCompraParam,
  ConsultarPedidoCompraParam,
  ExcluirPedidoCompraParam,
  IncluirPedidoCompraParam,
  ListarPedidosCompraParam,
  ListarPedidosCompraResult,
  PedidoCompraDetalhe,
} from "../dto/pedido-compra.dto.js";
import { mapearPedidoCompraDetalhe, mapearPedidoCompraResumo } from "./mapear-pedido-compra.js";

function mapearItensParam(itens: IncluirPedidoCompraParam["itens"]) {
  return itens.map((item) => ({
    codIntItem: item.cod_int_item,
    codProduto: item.codigo_produto,
    quantidade: item.quantidade,
    valorUnitario: item.valor_unitario,
  }));
}

export class IncluirPedidoCompraUseCase {
  constructor(private readonly gateway: IPedidoCompraGateway) {}

  async execute(param: IncluirPedidoCompraParam) {
    return this.gateway.incluirPedido({
      codIntPed: param.cod_int_pedido,
      dataPrevisao: param.data_previsao,
      quantidadeParcelas: param.quantidade_parcelas,
      codigoFornecedor: param.codigo_fornecedor,
      codigoContaCorrente: param.codigo_conta_corrente,
      codigoCategoria: param.codigo_categoria,
      itens: mapearItensParam(param.itens),
    });
  }
}

export class AlterarPedidoCompraUseCase {
  constructor(private readonly gateway: IPedidoCompraGateway) {}

  async execute(param: AlterarPedidoCompraParam) {
    return this.gateway.alterarPedido({
      codigoPedido: param.codigo_pedido,
      quantidadeParcelas: param.quantidade_parcelas,
      itens: param.itens ? mapearItensParam(param.itens) : undefined,
    });
  }
}

export class ExcluirPedidoCompraUseCase {
  constructor(private readonly gateway: IPedidoCompraGateway) {}

  async execute(param: ExcluirPedidoCompraParam) {
    return this.gateway.excluirPedido(param.codigo_pedido);
  }
}

export class ConsultarPedidoCompraUseCase {
  constructor(private readonly gateway: IPedidoCompraGateway) {}

  async execute(param: ConsultarPedidoCompraParam): Promise<PedidoCompraDetalhe> {
    const pedido = await this.gateway.consultarPedido(param.codigo_pedido);
    return mapearPedidoCompraDetalhe(pedido);
  }
}

export class ListarPedidosCompraUseCase {
  constructor(private readonly gateway: IPedidoCompraGateway) {}

  async execute(param: ListarPedidosCompraParam): Promise<ListarPedidosCompraResult> {
    const pagina = param.pagina ?? 1;
    const registrosPorPagina = param.registros_por_pagina ?? 50;

    const resposta = await this.gateway.listarPedidosPagina({ pagina, registrosPorPagina });

    const pedidos = aplicarFiltros(
      resposta.pedidos_pesquisa.map((p) =>
        mapearPedidoCompraResumo({ cabecalho_consulta: p.cabecalho_consulta, produtos_consulta: p.produtos_consulta })
      ),
      param.filtros
    );

    return {
      pagina,
      totalPaginas: resposta.nTotalPaginas,
      totalRegistros: resposta.nTotalRegistros,
      pedidos,
    };
  }
}
