import { OmieApiError, OmieClient } from "../../../../omieClient.js";
import {
  ContatoOmie,
  ContatoParaAlterar,
  ContatoParaIncluir,
  IContatoGateway,
  ListarContatosPageParams,
  ListarContatosResponse,
  StatusContato,
} from "../../domain/interfaces/contato-gateway.js";

export class ContatoOmieGateway implements IContatoGateway {
  constructor(private readonly client: OmieClient) {}

  async incluirContato(dados: ContatoParaIncluir): Promise<StatusContato> {
    const resposta = await this.client.call<{
      nCod: number;
      cCodInt: string;
      cCodStatus: string;
      cDesStatus: string;
    }>({
      resource: "crm/contatos",
      call: "IncluirContato",
      param: {
        identificacao: {
          cCodInt: dados.codIntContato,
          cNome: dados.nome,
          cSobrenome: dados.sobrenome,
          nCodConta: dados.codigoConta,
        },
        ...(dados.email ? { telefone_email: { cEmail: dados.email } } : {}),
      },
    });

    return {
      codigoContato: resposta.nCod,
      codIntContato: resposta.cCodInt,
      codigoStatus: resposta.cCodStatus,
      descricaoStatus: resposta.cDesStatus,
    };
  }

  async alterarContato(dados: ContatoParaAlterar): Promise<StatusContato> {
    const resposta = await this.client.call<{
      nCod: number;
      cCodInt: string;
      cCodStatus: string;
      cDesStatus: string;
    }>({
      resource: "crm/contatos",
      call: "AlterarContato",
      param: {
        identificacao: {
          nCod: dados.codigoContato,
          ...(dados.nome !== undefined ? { cNome: dados.nome } : {}),
          ...(dados.sobrenome !== undefined ? { cSobrenome: dados.sobrenome } : {}),
        },
        ...(dados.email !== undefined ? { telefone_email: { cEmail: dados.email } } : {}),
      },
    });

    return {
      codigoContato: resposta.nCod,
      codIntContato: resposta.cCodInt,
      codigoStatus: resposta.cCodStatus,
      descricaoStatus: resposta.cDesStatus,
    };
  }

  async excluirContato(codigoContato: number): Promise<StatusContato> {
    const resposta = await this.client.call<{
      nCod: number;
      cCodInt: string;
      cCodStatus: string;
      cDesStatus: string;
    }>({
      resource: "crm/contatos",
      call: "ExcluirContato",
      param: { nCod: codigoContato },
    });

    return {
      codigoContato: resposta.nCod,
      codIntContato: resposta.cCodInt,
      codigoStatus: resposta.cCodStatus,
      descricaoStatus: resposta.cDesStatus,
    };
  }

  async consultarContato(codigoContato: number): Promise<ContatoOmie> {
    return this.client.call<ContatoOmie>({
      resource: "crm/contatos",
      call: "ConsultarContato",
      param: { nCod: codigoContato },
    });
  }

  async listarContatosPagina(params: ListarContatosPageParams): Promise<ListarContatosResponse> {
    try {
      return await this.client.call<ListarContatosResponse>({
        resource: "crm/contatos",
        call: "ListarContatos",
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
