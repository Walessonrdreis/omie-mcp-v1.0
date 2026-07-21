export interface CategoriaOrcamentoOmie {
  cCodCateg: string;
  cDesCateg: string;
  nValorPrevisto: number;
  nValorRealizado: number;
}

export interface OrcamentoCaixaOmie {
  nAno: number;
  nMes: number;
  ListaOrcamentos: CategoriaOrcamentoOmie[];
}

/**
 * Contrato de acesso ao orçamento de caixa nativo da Omie
 * (`financas/caixa`, `ListarOrcamentos`) — previsto x realizado por
 * categoria financeira, num mês/ano. Endpoint simples, só leitura.
 */
export interface IOrcamentoCaixaGateway {
  consultarOrcamento(ano: number, mes: number): Promise<OrcamentoCaixaOmie>;
}
