/** Payload bruto de um produto, como a API Omie devolve em ListarProdutos/ConsultarProduto. */
export interface ProdutoOmieBruto {
  codigo_produto: number;
  codigo: string;
  descricao: string;
  unidade: string;
  valor_unitario: number;
  inativo: string; // "S" | "N"
  codigo_familia: number;
  descricao_familia?: string;
}

/** Produto já traduzido/legível, pronto pra apresentar ao usuário. */
export interface ProdutoView {
  codigoProduto: number;
  codigo: string;
  nome: string;
  categoria: string;
  unidade: string;
  valorFormatado: string;
  ativo: "Sim" | "Não";
}
