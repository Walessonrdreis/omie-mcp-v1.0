import {
  GerarPixParams,
  IPixGateway,
  ListarPixPageParams,
  ListarPixResponse,
  PixOmie,
  StatusCancelamentoPixOmie,
  StatusPixOmie,
} from "../../domain/interfaces/pix-gateway.js";

const PIX_FAKE: PixOmie[] = [
  {
    nIdPix: 6001,
    cCodIntPix: "",
    nCodTitulo: 8001,
    vValor: 750,
    dEmissao: "10/07/2026",
    dVencimento: "12/07/2026",
    cUrlPix: "https://fake.omie/pix/6001.pdf",
    cCopiaCola: "00020101FAKE",
    cStatus: "LIQUIDADO",
  },
];

/**
 * Implementação em memória de `IPixGateway`, sem chamar a Omie real — usada
 * quando `OMIE_MOCK=true`, pra desenvolvimento/testes offline.
 */
export class PixFakeGateway implements IPixGateway {
  private proximoId = 7000;

  constructor(private readonly registros: PixOmie[] = PIX_FAKE.map((p) => ({ ...p }))) {}

  async listarPixPagina(params: ListarPixPageParams): Promise<ListarPixResponse> {
    let registros = this.registros;
    if (params.status) registros = registros.filter((r) => r.cStatus === params.status);

    const inicio = (params.pagina - 1) * params.registrosPorPagina;
    const pagina = registros.slice(inicio, inicio + params.registrosPorPagina);

    return {
      nPagina: params.pagina,
      nTotPaginas: Math.max(1, Math.ceil(registros.length / params.registrosPorPagina)),
      nRegistros: pagina.length,
      nTotRegistros: registros.length,
      ListaPix: pagina,
    };
  }

  private encontrarPorTitulo(codigoTitulo: number): PixOmie {
    const pix = this.registros.find((r) => r.nCodTitulo === codigoTitulo);
    if (!pix) throw new Error(`PIX do título ${codigoTitulo} não encontrado (fake).`);
    return pix;
  }

  async obterPix(codigoTitulo: number): Promise<PixOmie> {
    return this.encontrarPorTitulo(codigoTitulo);
  }

  async obterStatusPix(codigoTitulo: number): Promise<StatusPixOmie> {
    const pix = this.encontrarPorTitulo(codigoTitulo);
    return { nIdPix: pix.nIdPix, nCodTitulo: pix.nCodTitulo, vValor: pix.vValor, cStatus: pix.cStatus };
  }

  async gerarPix(params: GerarPixParams): Promise<PixOmie> {
    const nIdPix = this.proximoId++;
    const pix: PixOmie = {
      nIdPix,
      cCodIntPix: "",
      nCodTitulo: params.codigoTitulo,
      vValor: params.valor,
      dEmissao: "20/07/2026",
      dVencimento: "20/07/2026",
      cUrlPix: `https://fake.omie/pix/${nIdPix}.pdf`,
      cCopiaCola: "00020101FAKE",
      cStatus: "AGUARDANDO",
    };
    this.registros.push(pix);
    return pix;
  }

  async cancelarPix(idPix: number): Promise<StatusCancelamentoPixOmie> {
    const indice = this.registros.findIndex((r) => r.nIdPix === idPix);
    if (indice === -1) throw new Error(`PIX ${idPix} não encontrado (fake).`);
    this.registros.splice(indice, 1);
    return { cCodStatus: "0", cDescStatus: "PIX cancelado com sucesso! (fake)" };
  }
}
