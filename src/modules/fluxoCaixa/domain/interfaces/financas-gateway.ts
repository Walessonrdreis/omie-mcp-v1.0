/**
 * Um lançamento financeiro (conta a pagar ou a receber) conforme devolvido
 * pela Omie em `financas/mf` / `ListarMovimentos`. Nem todo campo aparece em
 * todo lançamento (varia por tipo de origem: venda, compra, boleto, etc.),
 * por isso os campos menos essenciais ficam opcionais.
 */
export interface MovimentoFinanceiro {
  detalhes: {
    cCodCateg: string;
    cGrupo: string;
    /** "P" = Contas a Pagar, "R" = Contas a Receber. */
    cNatureza: "P" | "R";
    cStatus: string;
    cTipo: string;
    dDtEmissao: string;
    dDtPagamento: string;
    dDtPrevisao: string;
    dDtVenc: string;
    nCodCC: number;
    nCodTitulo: number;
    nValorTitulo: number;
  };
  resumo: {
    cLiquidado: "S" | "N";
    nValAberto: number;
    nValLiquido: number;
    nValPago: number;
  };
}

export interface FiltroMovimentos {
  /** "pagamento" filtra por dDtPagamento (realizado); "vencimento" filtra por dDtVenc (previsto). */
  campoData: "pagamento" | "vencimento";
  dataDe: string;
  dataAte: string;
}

/**
 * Contrato de acesso aos lançamentos financeiros da Omie (contas a pagar e a
 * receber), independente de vir da Omie real ou de um fake em memória
 * (`OMIE_MOCK=true`). A Omie não tem endpoint de "fluxo de caixa" pronto — só
 * devolve lançamento por lançamento; a agregação por dia/mês/conta fica no
 * use-case (`fluxoCaixa`).
 */
export interface IFinancasGateway {
  /** Varre todas as páginas de lançamentos que casam com o filtro (pode ser lento em períodos longos). */
  listarTodosMovimentos(filtro: FiltroMovimentos): Promise<MovimentoFinanceiro[]>;
}
