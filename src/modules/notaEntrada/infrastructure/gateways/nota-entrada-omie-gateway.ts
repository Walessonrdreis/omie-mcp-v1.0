import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import {
  INotaEntradaGateway,
  ListarNotaEntradaPageParams,
  ListarNotaEntradaResponse,
  NotaEntradaOmie,
} from "../../domain/interfaces/nota-entrada-gateway.js";

export class NotaEntradaOmieGateway implements INotaEntradaGateway {
  constructor(private readonly client: OmieClient) {}

  async listarNotasPagina(params: ListarNotaEntradaPageParams): Promise<ListarNotaEntradaResponse> {
    return this.client.call<ListarNotaEntradaResponse>({
      resource: "produtos/notaentrada",
      call: "ListarNotaEnt",
      param: {
        nPagina: params.pagina,
        nRegistrosPorPagina: params.registrosPorPagina,
        ...(params.dataAlteracaoDe ? { dtAltDe: params.dataAlteracaoDe } : {}),
        ...(params.dataAlteracaoAte ? { dtAltAte: params.dataAlteracaoAte } : {}),
      },
    });
  }

  async consultarNota(codigoNota: number): Promise<NotaEntradaOmie> {
    return this.client.call<NotaEntradaOmie>({
      resource: "produtos/notaentrada",
      call: "ConsultarNotaEnt",
      param: { nCodNotaEnt: codigoNota },
    });
  }
}
