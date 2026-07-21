import { OmieApiError, OmieClient } from "../../../../omieClient.js";
import {
  IServicoGateway,
  ListarServicosPageParams,
  ListarServicosResponse,
  ServicoOmie,
  ServicoParaAlterar,
  ServicoParaIncluir,
  StatusServico,
} from "../../domain/interfaces/servico-gateway.js";

export class ServicoOmieGateway implements IServicoGateway {
  constructor(private readonly client: OmieClient) {}

  async incluirServico(dados: ServicoParaIncluir): Promise<StatusServico> {
    const resposta = await this.client.call<{
      cCodIntServ: string;
      nCodServ: number;
      cCodStatus: string;
      cDescStatus: string;
    }>({
      resource: "servicos/servico",
      call: "IncluirCadastroServico",
      param: {
        intIncluir: { cCodIntServ: dados.codIntServico },
        cabecalho: {
          cDescricao: dados.descricao,
          cCodigo: dados.codigo,
          nPrecoUnit: dados.precoUnitario,
          ...(dados.codigoCategoria ? { cCodCateg: dados.codigoCategoria } : {}),
        },
        descricao: { cDescrCompleta: dados.descricaoCompleta ?? dados.descricao },
      },
    });

    return {
      codigoServico: resposta.nCodServ,
      codIntServico: resposta.cCodIntServ,
      codigoStatus: resposta.cCodStatus,
      descricaoStatus: resposta.cDescStatus,
    };
  }

  async alterarServico(dados: ServicoParaAlterar): Promise<StatusServico> {
    const resposta = await this.client.call<{
      cCodIntServ: string;
      nCodServ: number;
      cCodStatus: string;
      cDescStatus: string;
    }>({
      resource: "servicos/servico",
      call: "AlterarCadastroServico",
      param: {
        intEditar: { nCodServ: dados.codigoServico },
        cabecalho: {
          ...(dados.descricao !== undefined ? { cDescricao: dados.descricao } : {}),
          ...(dados.precoUnitario !== undefined ? { nPrecoUnit: dados.precoUnitario } : {}),
        },
        ...(dados.descricaoCompleta !== undefined
          ? { descricao: { cDescrCompleta: dados.descricaoCompleta } }
          : {}),
      },
    });

    return {
      codigoServico: resposta.nCodServ,
      codIntServico: resposta.cCodIntServ,
      codigoStatus: resposta.cCodStatus,
      descricaoStatus: resposta.cDescStatus,
    };
  }

  async excluirServico(codigoServico: number): Promise<StatusServico> {
    const resposta = await this.client.call<{
      cCodIntServ: string;
      nCodServ: number;
      cCodStatus: string;
      cDescStatus: string;
    }>({
      resource: "servicos/servico",
      call: "ExcluirCadastroServico",
      param: { nCodServ: codigoServico },
    });

    return {
      codigoServico: resposta.nCodServ,
      codIntServico: resposta.cCodIntServ,
      codigoStatus: resposta.cCodStatus,
      descricaoStatus: resposta.cDescStatus,
    };
  }

  async consultarServico(codigoServico: number): Promise<ServicoOmie> {
    return this.client.call<ServicoOmie>({
      resource: "servicos/servico",
      call: "ConsultarCadastroServico",
      param: { nCodServ: codigoServico },
    });
  }

  async listarServicosPagina(params: ListarServicosPageParams): Promise<ListarServicosResponse> {
    try {
      return await this.client.call<ListarServicosResponse>({
        resource: "servicos/servico",
        call: "ListarCadastroServico",
        param: { nPagina: params.pagina, nRegPorPagina: params.registrosPorPagina },
      });
    } catch (err) {
      if (err instanceof OmieApiError && err.faultCode === "SOAP-ENV:Client-5113") {
        return { nPagina: params.pagina, nTotPaginas: 1, nRegistros: 0, nTotRegistros: 0, cadastros: [] };
      }
      throw err;
    }
  }
}
