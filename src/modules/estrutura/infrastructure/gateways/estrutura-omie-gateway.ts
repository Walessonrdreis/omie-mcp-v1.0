import { OmieClient } from "../../../../omieClient.js";
import {
  IEstruturaGateway,
  ListarEstruturasResponse,
} from "../../domain/interfaces/estrutura-gateway.js";

/**
 * Encapsula o acesso à API de estrutura de produtos (BOM/ficha técnica) da
 * Omie. Recurso 'geral/malha', método ListarEstruturas — já devolve nome do
 * produto e nome de cada insumo prontos, sem precisar cruzar com o cadastro
 * de produtos.
 */
export class EstruturaOmieGateway implements IEstruturaGateway {
  constructor(private readonly client: OmieClient) {}

  async listarEstruturasPagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarEstruturasResponse> {
    return this.client.call<ListarEstruturasResponse>({
      resource: "geral/malha",
      call: "ListarEstruturas",
      param: {
        nPagina: pagina,
        nRegPorPagina: registrosPorPagina,
      },
    });
  }
}
