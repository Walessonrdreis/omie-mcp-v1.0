import { OmieApiError, OmieClient } from "../../../../integrations/omie/omieClient.js";
import {
  GerarPixParams,
  IPixGateway,
  ListarPixPageParams,
  ListarPixResponse,
  PixOmie,
  StatusCancelamentoPixOmie,
  StatusPixOmie,
} from "../../domain/interfaces/pix-gateway.js";

/**
 * Encapsula o acesso a PIX de títulos a receber da Omie (`financas/pix`).
 */
export class PixOmieGateway implements IPixGateway {
  constructor(private readonly client: OmieClient) {}

  async listarPixPagina(params: ListarPixPageParams): Promise<ListarPixResponse> {
    try {
      return await this.client.call<ListarPixResponse>({
        resource: "financas/pix",
        call: "ListarPix",
        param: {
          nPagina: params.pagina,
          nRegPorPagina: params.registrosPorPagina,
          ...(params.emissaoDe ? { dEmissaoDe: params.emissaoDe } : {}),
          ...(params.emissaoAte ? { dEmissaoAte: params.emissaoAte } : {}),
          ...(params.status ? { cStatus: params.status } : {}),
        },
      });
    } catch (err) {
      if (err instanceof OmieApiError && err.faultCode === "SOAP-ENV:Client-5113") {
        return { nPagina: params.pagina, nTotPaginas: 1, nRegistros: 0, nTotRegistros: 0, ListaPix: [] };
      }
      throw err;
    }
  }

  async obterPix(codigoTitulo: number): Promise<PixOmie> {
    return this.client.call<PixOmie>({
      resource: "financas/pix",
      call: "ObterPix",
      param: { nCodTitulo: codigoTitulo },
    });
  }

  async obterStatusPix(codigoTitulo: number): Promise<StatusPixOmie> {
    return this.client.call<StatusPixOmie>({
      resource: "financas/pix",
      call: "ObterStatusPix",
      param: { nCodTitulo: codigoTitulo },
    });
  }

  async gerarPix(params: GerarPixParams): Promise<PixOmie> {
    return this.client.call<PixOmie>({
      resource: "financas/pix",
      call: "GerarPix",
      param: {
        nCodTitulo: params.codigoTitulo,
        vValor: params.valor,
        nIdConta: params.codigoContaCorrente,
      },
    });
  }

  async cancelarPix(idPix: number): Promise<StatusCancelamentoPixOmie> {
    return this.client.call<StatusCancelamentoPixOmie>({
      resource: "financas/pix",
      call: "CancelarPix",
      param: { nIdPix: idPix },
    });
  }
}
