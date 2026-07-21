import { OmieApiError, OmieClient } from "../../../../integrations/omie/omieClient.js";
import {
  IOportunidadeGateway,
  ListarOportunidadesPageParams,
  ListarOportunidadesResponse,
  OportunidadeOmie,
  OportunidadeParaAlterar,
  OportunidadeParaIncluir,
  StatusOportunidade,
} from "../../domain/interfaces/oportunidade-gateway.js";

export class OportunidadeOmieGateway implements IOportunidadeGateway {
  constructor(private readonly client: OmieClient) {}

  async incluirOportunidade(dados: OportunidadeParaIncluir): Promise<StatusOportunidade> {
    const resposta = await this.client.call<{
      nCodOp: number;
      cCodIntOp: string;
      cCodStatus: string;
      cDesStatus: string;
    }>({
      resource: "crm/oportunidades",
      call: "IncluirOportunidade",
      param: {
        identificacao: {
          cCodIntOp: dados.codIntOportunidade,
          cDesOp: dados.descricao,
          nCodConta: dados.codigoConta,
          nCodContato: dados.codigoContato,
          nCodSolucao: dados.codigoSolucao,
          nCodOrigem: dados.codigoOrigem,
        },
      },
    });

    return {
      codigoOportunidade: resposta.nCodOp,
      codIntOportunidade: resposta.cCodIntOp,
      codigoStatus: resposta.cCodStatus,
      descricaoStatus: resposta.cDesStatus,
    };
  }

  async alterarOportunidade(dados: OportunidadeParaAlterar): Promise<StatusOportunidade> {
    const resposta = await this.client.call<{
      nCodOp: number;
      cCodIntOp: string;
      cCodStatus: string;
      cDesStatus: string;
    }>({
      resource: "crm/oportunidades",
      call: "AlterarOportunidade",
      param: {
        identificacao: {
          nCodOp: dados.codigoOportunidade,
          ...(dados.descricao !== undefined ? { cDesOp: dados.descricao } : {}),
        },
      },
    });

    return {
      codigoOportunidade: resposta.nCodOp,
      codIntOportunidade: resposta.cCodIntOp,
      codigoStatus: resposta.cCodStatus,
      descricaoStatus: resposta.cDesStatus,
    };
  }

  async excluirOportunidade(codigoOportunidade: number): Promise<StatusOportunidade> {
    const resposta = await this.client.call<{
      nCodOp: number;
      cCodIntOp: string;
      cCodStatus: string;
      cDesStatus: string;
    }>({
      resource: "crm/oportunidades",
      call: "ExcluirOportunidade",
      param: { nCodOp: codigoOportunidade },
    });

    return {
      codigoOportunidade: resposta.nCodOp,
      codIntOportunidade: resposta.cCodIntOp,
      codigoStatus: resposta.cCodStatus,
      descricaoStatus: resposta.cDesStatus,
    };
  }

  async consultarOportunidade(codigoOportunidade: number): Promise<OportunidadeOmie> {
    return this.client.call<OportunidadeOmie>({
      resource: "crm/oportunidades",
      call: "ConsultarOportunidade",
      param: { nCodOp: codigoOportunidade },
    });
  }

  async listarOportunidadesPagina(
    params: ListarOportunidadesPageParams
  ): Promise<ListarOportunidadesResponse> {
    try {
      return await this.client.call<ListarOportunidadesResponse>({
        resource: "crm/oportunidades",
        call: "ListarOportunidades",
        param: { pagina: params.pagina, registros_por_pagina: params.registrosPorPagina },
      });
    } catch (err) {
      if (err instanceof OmieApiError && (err.faultCode === "SOAP-ENV:Client-5113" || err.faultCode === "SOAP-ENV:Client-5094")) {
        return { pagina: params.pagina, total_de_paginas: 1, registros: 0, total_de_registros: 0, cadastros: [] };
      }
      throw err;
    }
  }
}
