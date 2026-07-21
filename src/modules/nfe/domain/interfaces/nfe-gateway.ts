/**
 * Formato bruto de uma nota fiscal devolvido pela Omie (`nfCadastro`), tanto
 * em `ConsultarNF` quanto dentro do array de `ListarNF`. A Omie devolve uma
 * estrutura fiscal completa (NF-e) — aqui só tipamos os campos que o módulo
 * de fato usa hoje; o restante (impostos detalhados, retenções etc.) não é
 * necessário pro caso de uso de consulta/listagem.
 */
export interface NotaFiscalItemOmie {
  prod: {
    cProd: string;
    xProd: string;
    NCM: string;
    CFOP: string;
    uCom: string;
    qCom: number;
    vUnCom: number;
    vProd: number;
  };
}

export interface NotaFiscalTituloOmie {
  cNumTitulo: string;
  dDtVenc: string;
  nValorTitulo: number;
}

export interface NotaFiscalOmie {
  compl: {
    cChaveNFe: string;
    nIdNF: number;
    nIdPedido: number;
  };
  ide: {
    nNF: string;
    serie: string;
    dEmi: string;
    dCan: string;
    tpNF: string;
    tpAmb: string;
  };
  nfDestInt: {
    cRazao: string;
    cnpj_cpf: string;
    nCodCli: number;
  };
  det: NotaFiscalItemOmie[];
  titulos?: NotaFiscalTituloOmie[];
  total: {
    ICMSTot: {
      vNF: number;
    };
  };
}

export interface ListarNFResponse {
  pagina: number;
  total_de_paginas: number;
  registros: number;
  total_de_registros: number;
  nfCadastro: NotaFiscalOmie[];
}

export interface ListarNFPageParams {
  pagina: number;
  registrosPorPagina: number;
  filtrarPorDataDe?: string;
  filtrarPorDataAte?: string;
  filtrarPorStatus?: "N" | "C";
  tpNF?: "0" | "1";
}

/**
 * Contrato de acesso à consulta de notas fiscais (NF-e) já emitidas na Omie.
 * Somente leitura por decisão do usuário: emissão de NF-e é documento fiscal
 * com efeito legal e não tem "round-trip seguro" como os demais módulos
 * (criar → testar → excluir sem deixar rastro) — não é coberta aqui.
 */
export interface INfeGateway {
  listarNotasPagina(params: ListarNFPageParams): Promise<ListarNFResponse>;
  consultarNotaPorChave(chave: string): Promise<NotaFiscalOmie>;
  consultarNotaPorCodigo(nCodNF: number): Promise<NotaFiscalOmie>;
}
