export interface CategoriaParaIncluir {
  categoriaSuperior: string;
  descricao: string;
}

export interface CategoriaParaAlterar {
  codigo: string;
  descricao?: string;
}

export interface StatusCategoria {
  codigo: string;
  codigoStatus: string;
  descricaoStatus: string;
}

export interface CategoriaOmie {
  codigo: string;
  descricao: string;
  categoria_superior: string;
  conta_despesa: "S" | "N";
  conta_receita: "S" | "N";
  conta_inativa: "S" | "N";
  totalizadora: "S" | "N";
}

export interface ListarCategoriasResponse {
  pagina: number;
  total_de_paginas: number;
  registros: number;
  total_de_registros: number;
  categoria_cadastro: CategoriaOmie[];
}

export interface ListarCategoriasPageParams {
  pagina: number;
  registrosPorPagina: number;
}

/**
 * Contrato de acesso a Categorias financeiras (`geral/categorias`). Testado
 * ao vivo, achados que corrigem a doc pública: (1) `IncluirCategoria` NÃO
 * recebe o código da nova categoria — recebe `categoria_superior` (código do
 * grupo pai) e a Omie GERA o código do filho automaticamente (ex: pai
 * "2.09" gera filho "2.09.04"); (2) não existe `ExcluirCategoria` na API, e
 * `AlterarCategoria` com `conta_inativa: 'S'` foi testado e NÃO inativa de
 * fato a categoria (confirmado consultando de novo depois) — categorias
 * criadas via API não têm remoção/desativação confiável.
 */
export interface ICategoriaGateway {
  incluirCategoria(dados: CategoriaParaIncluir): Promise<StatusCategoria>;
  alterarCategoria(dados: CategoriaParaAlterar): Promise<StatusCategoria>;
  consultarCategoria(codigo: string): Promise<CategoriaOmie>;
  listarCategoriasPagina(params: ListarCategoriasPageParams): Promise<ListarCategoriasResponse>;
}
