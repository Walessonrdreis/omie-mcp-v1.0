import { RequisicaoCompraOmie } from "../../domain/interfaces/requisicao-compra-gateway.js";
import { RequisicaoCompraResult } from "../dto/requisicao-compra.dto.js";

export function mapearRequisicaoCompra(requisicao: RequisicaoCompraOmie): RequisicaoCompraResult {
  return {
    codigoRequisicao: requisicao.codReqCompra,
    codIntRequisicao: requisicao.codIntReqCompra,
    codigoCategoria: requisicao.codCateg.trim(),
    dataSugestao: requisicao.dtSugestao,
    itens: requisicao.ItensReqCompra.map((item) => ({
      codigoProduto: item.codProd,
      quantidade: item.qtde,
      precoUnitario: item.precoUnit,
    })),
  };
}
