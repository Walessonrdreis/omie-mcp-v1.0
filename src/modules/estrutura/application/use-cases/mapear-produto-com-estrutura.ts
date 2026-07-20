import { EstruturaProdutoOmie } from "../../domain/interfaces/estrutura-gateway.js";
import { ProdutoComEstrutura } from "../dto/estrutura.dto.js";

/** Converte o formato cru da Omie (`ident`/`itens`) pro formato de saída do MCP. */
export function mapearProdutoComEstrutura(produto: EstruturaProdutoOmie): ProdutoComEstrutura {
  return {
    codigoProduto: produto.ident.idProduto,
    codigoSku: produto.ident.codProduto,
    descricaoProduto: produto.ident.descrProduto,
    itens: produto.itens.map((item) => ({
      codigo: item.codProdMalha,
      descricao: item.descrProdMalha,
      quantidade: item.quantProdMalha,
      unidade: item.unidProdMalha,
    })),
  };
}
