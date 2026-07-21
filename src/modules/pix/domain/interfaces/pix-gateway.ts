export interface PixOmie {
  nIdPix: number;
  cCodIntPix: string;
  nCodTitulo: number;
  vValor: number;
  dEmissao: string;
  dVencimento: string;
  cUrlPix: string;
  cCopiaCola: string;
  cStatus: string;
}

export interface ListarPixResponse {
  nPagina: number;
  nTotPaginas: number;
  nRegistros: number;
  nTotRegistros: number;
  ListaPix: PixOmie[];
}

export interface ListarPixPageParams {
  pagina: number;
  registrosPorPagina: number;
  emissaoDe?: string;
  emissaoAte?: string;
  status?: string;
}

export interface GerarPixParams {
  codigoTitulo: number;
  valor: number;
  codigoContaCorrente: number;
}

export interface StatusPixOmie {
  nIdPix: number;
  nCodTitulo: number;
  vValor: number;
  cStatus: string;
}

export interface StatusCancelamentoPixOmie {
  cCodStatus: string;
  cDescStatus: string;
}

/**
 * Contrato de acesso a PIX de títulos a receber (`financas/pix`). Diferente
 * de Boleto, esta conta Omie TEM PIX configurado e ativo (379 registros
 * reais na base testada) — testado ao vivo `ListarPix`/`ObterPix`/
 * `ObterStatusPix`/`ListarStatusPix`. `GerarPix`/`CancelarPix` não foram
 * testados ao vivo contra título real por prudência (geraria/cancelaria uma
 * cobrança PIX de fato, sem round-trip seguro garantido).
 */
export interface IPixGateway {
  listarPixPagina(params: ListarPixPageParams): Promise<ListarPixResponse>;
  obterPix(codigoTitulo: number): Promise<PixOmie>;
  obterStatusPix(codigoTitulo: number): Promise<StatusPixOmie>;
  gerarPix(params: GerarPixParams): Promise<PixOmie>;
  cancelarPix(idPix: number): Promise<StatusCancelamentoPixOmie>;
}
