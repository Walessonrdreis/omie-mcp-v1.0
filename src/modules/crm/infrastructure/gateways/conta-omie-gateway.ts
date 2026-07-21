import { OmieApiError, OmieClient } from "../../../../integrations/omie/omieClient.js";
import {
  ContaOmie,
  ContaParaAlterar,
  ContaParaIncluir,
  IContaGateway,
  ListarContasPageParams,
  ListarContasResponse,
  StatusConta,
} from "../../domain/interfaces/conta-gateway.js";

export class ContaOmieGateway implements IContaGateway {
  constructor(private readonly client: OmieClient) {}

  async incluirConta(dados: ContaParaIncluir): Promise<StatusConta> {
    const resposta = await this.client.call<{
      nCod: number;
      cCodInt: string;
      cCodStatus: string;
      cDesStatus: string;
    }>({
      resource: "crm/contas",
      call: "IncluirConta",
      param: {
        identificacao: { cCodInt: dados.codIntConta, cNome: dados.nome },
        endereco: { cUF: dados.uf, cCidade: dados.cidade },
        telefone_email: { cEmail: dados.email },
      },
    });

    return {
      codigoConta: resposta.nCod,
      codIntConta: resposta.cCodInt,
      codigoStatus: resposta.cCodStatus,
      descricaoStatus: resposta.cDesStatus,
    };
  }

  async alterarConta(dados: ContaParaAlterar): Promise<StatusConta> {
    const resposta = await this.client.call<{
      nCod: number;
      cCodInt: string;
      cCodStatus: string;
      cDesStatus: string;
    }>({
      resource: "crm/contas",
      call: "AlterarConta",
      param: {
        identificacao: {
          nCod: dados.codigoConta,
          ...(dados.nome !== undefined ? { cNome: dados.nome } : {}),
        },
        endereco: {
          ...(dados.uf !== undefined ? { cUF: dados.uf } : {}),
          ...(dados.cidade !== undefined ? { cCidade: dados.cidade } : {}),
        },
        telefone_email: {
          ...(dados.email !== undefined ? { cEmail: dados.email } : {}),
        },
      },
    });

    return {
      codigoConta: resposta.nCod,
      codIntConta: resposta.cCodInt,
      codigoStatus: resposta.cCodStatus,
      descricaoStatus: resposta.cDesStatus,
    };
  }

  async excluirConta(codigoConta: number): Promise<StatusConta> {
    const resposta = await this.client.call<{
      nCod: number;
      cCodInt: string;
      cCodStatus: string;
      cDesStatus: string;
    }>({
      resource: "crm/contas",
      call: "ExcluirConta",
      param: { nCod: codigoConta },
    });

    return {
      codigoConta: resposta.nCod,
      codIntConta: resposta.cCodInt,
      codigoStatus: resposta.cCodStatus,
      descricaoStatus: resposta.cDesStatus,
    };
  }

  async consultarConta(codigoConta: number): Promise<ContaOmie> {
    return this.client.call<ContaOmie>({
      resource: "crm/contas",
      call: "ConsultarConta",
      param: { nCod: codigoConta },
    });
  }

  async listarContasPagina(params: ListarContasPageParams): Promise<ListarContasResponse> {
    try {
      return await this.client.call<ListarContasResponse>({
        resource: "crm/contas",
        call: "ListarContas",
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
