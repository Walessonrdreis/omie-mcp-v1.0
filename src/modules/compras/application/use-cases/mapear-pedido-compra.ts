import { PedidoCompraOmie } from "../../domain/interfaces/pedido-compra-gateway.js";
import { PedidoCompraDetalhe, PedidoCompraResumo } from "../dto/pedido-compra.dto.js";

export function mapearPedidoCompraResumo(pedido: PedidoCompraOmie): PedidoCompraResumo {
  const valorTotal = pedido.produtos_consulta.reduce((soma, item) => soma + item.nValTot, 0);

  return {
    codigoPedido: pedido.cabecalho_consulta.nCodPed,
    codIntPedido: pedido.cabecalho_consulta.cCodIntPed,
    numero: pedido.cabecalho_consulta.cNumero,
    dataPrevisao: pedido.cabecalho_consulta.dDtPrevisao,
    codigoFornecedor: pedido.cabecalho_consulta.nCodFor,
    codigoContaCorrente: pedido.cabecalho_consulta.nCodCC,
    quantidadeItens: pedido.produtos_consulta.length,
    valorTotal,
  };
}

export function mapearPedidoCompraDetalhe(pedido: PedidoCompraOmie): PedidoCompraDetalhe {
  return {
    ...mapearPedidoCompraResumo(pedido),
    itens: pedido.produtos_consulta.map((item) => ({
      codigo: item.cCodIntItem,
      codigoProduto: item.nCodProd,
      descricao: item.cDescricao,
      quantidade: item.nQtde,
      quantidadeRecebida: item.nQtdeRec,
      valorUnitario: item.nValUnit,
      valorTotal: item.nValTot,
    })),
  };
}
