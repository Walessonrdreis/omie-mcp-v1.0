import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import {
  CaracteristicaOmie,
  CaracteristicaParaAlterar,
  CaracteristicaParaIncluir,
  ICaracteristicaGateway,
  ListarCaracteristicasPageParams,
  ListarCaracteristicasResponse,
  StatusCaracteristica,
} from "../../domain/interfaces/caracteristica-gateway.js";

export class CaracteristicaOmieGateway implements ICaracteristicaGateway {
  constructor(private readonly client: OmieClient) {}

  async incluirCaracteristica(dados: CaracteristicaParaIncluir): Promise<StatusCaracteristica> {
    const resposta = await this.client.call<{
      nCodCaract: number;
      cCodIntCaract: string;
      cCodStatus: string;
      cDesStatus: string;
    }>({
      resource: "geral/caracteristicas",
      call: "IncluirCaracteristica",
      param: {
        cCodIntCaract: dados.codIntCaracteristica,
        cNomeCaract: dados.nome,
        cValorDef: dados.valorDefinido,
        ...(dados.conteudosPermitidos
          ? { conteudosPermitidos: dados.conteudosPermitidos.map((c) => ({ cConteudo: c })) }
          : {}),
      },
    });

    return {
      codigoCaracteristica: resposta.nCodCaract,
      codIntCaracteristica: resposta.cCodIntCaract,
      codigoStatus: resposta.cCodStatus,
      descricaoStatus: resposta.cDesStatus,
    };
  }

  async alterarCaracteristica(dados: CaracteristicaParaAlterar): Promise<StatusCaracteristica> {
    const resposta = await this.client.call<{
      nCodCaract: number;
      cCodIntCaract: string;
      cCodStatus: string;
      cDesStatus: string;
    }>({
      resource: "geral/caracteristicas",
      call: "AlterarCaracteristica",
      param: {
        nCodCaract: dados.codigoCaracteristica,
        ...(dados.nome !== undefined ? { cNomeCaract: dados.nome } : {}),
      },
    });

    return {
      codigoCaracteristica: resposta.nCodCaract,
      codIntCaracteristica: resposta.cCodIntCaract,
      codigoStatus: resposta.cCodStatus,
      descricaoStatus: resposta.cDesStatus,
    };
  }

  async excluirCaracteristica(codigoCaracteristica: number): Promise<StatusCaracteristica> {
    const resposta = await this.client.call<{
      nCodCaract: number;
      cCodIntCaract: string;
      cCodStatus: string;
      cDesStatus: string;
    }>({
      resource: "geral/caracteristicas",
      call: "ExcluirCaracteristica",
      param: { nCodCaract: codigoCaracteristica },
    });

    return {
      codigoCaracteristica: resposta.nCodCaract,
      codIntCaracteristica: resposta.cCodIntCaract,
      codigoStatus: resposta.cCodStatus,
      descricaoStatus: resposta.cDesStatus,
    };
  }

  async consultarCaracteristica(codigoCaracteristica: number): Promise<CaracteristicaOmie> {
    return this.client.call<CaracteristicaOmie>({
      resource: "geral/caracteristicas",
      call: "ConsultarCaracteristica",
      param: { nCodCaract: codigoCaracteristica },
    });
  }

  async listarCaracteristicasPagina(
    params: ListarCaracteristicasPageParams
  ): Promise<ListarCaracteristicasResponse> {
    return this.client.call<ListarCaracteristicasResponse>({
      resource: "geral/caracteristicas",
      call: "ListarCaracteristicas",
      param: { nPagina: params.pagina, nRegPorPagina: params.registrosPorPagina },
    });
  }
}
