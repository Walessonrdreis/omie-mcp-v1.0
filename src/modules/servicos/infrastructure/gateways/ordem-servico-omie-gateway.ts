import { OmieApiError, OmieClient } from "../../../../omieClient.js";
import {
  IOrdemServicoGateway,
  ItemOrdemServico,
  ListarOSPageParams,
  ListarOSResponse,
  OrdemServicoOmie,
  OrdemServicoParaAlterar,
  OrdemServicoParaIncluir,
  StatusOrdemServico,
} from "../../domain/interfaces/ordem-servico-gateway.js";

function mapearItem(item: ItemOrdemServico) {
  return {
    nQtde: item.quantidade,
    nValUnit: item.valorUnitario,
    cDescServ: item.descricao,
    cTribServ: item.tributacaoServico,
    cCodServMun: item.codigoServicoMunicipal,
    cCodServLC116: item.codigoServicoLC116,
    cRetemISS: item.retemISS,
  };
}

export class OrdemServicoOmieGateway implements IOrdemServicoGateway {
  constructor(private readonly client: OmieClient) {}

  async incluirOS(dados: OrdemServicoParaIncluir): Promise<StatusOrdemServico> {
    const resposta = await this.client.call<{
      cCodIntOS: string;
      nCodOS: number;
      cNumOS: string;
      cCodStatus: string;
      cDescStatus: string;
    }>({
      resource: "servicos/os",
      call: "IncluirOS",
      param: {
        Cabecalho: {
          cCodIntOS: dados.codIntOS,
          nCodCli: dados.codigoCliente,
          cCodParc: dados.codigoCondicaoPagamento,
          dDtPrevisao: dados.dataPrevisao,
          cEtapa: dados.etapa,
          nQtdeParc: dados.quantidadeParcelas,
        },
        ServicosPrestados: dados.itens.map(mapearItem),
        InformacoesAdicionais: {
          cCodCateg: dados.codigoCategoria,
          nCodCC: dados.codigoContaCorrente,
        },
      },
    });

    return {
      codigoOS: resposta.nCodOS,
      codIntOS: resposta.cCodIntOS,
      numero: resposta.cNumOS,
      codigoStatus: resposta.cCodStatus,
      descricaoStatus: resposta.cDescStatus,
    };
  }

  async alterarOS(dados: OrdemServicoParaAlterar): Promise<StatusOrdemServico> {
    const resposta = await this.client.call<{
      cCodIntOS: string;
      nCodOS: number;
      cNumOS: string;
      cCodStatus: string;
      cDescStatus: string;
    }>({
      resource: "servicos/os",
      call: "AlterarOS",
      param: {
        Cabecalho: {
          nCodOS: dados.codigoOS,
          ...(dados.dataPrevisao !== undefined ? { dDtPrevisao: dados.dataPrevisao } : {}),
          ...(dados.etapa !== undefined ? { cEtapa: dados.etapa } : {}),
        },
      },
    });

    return {
      codigoOS: resposta.nCodOS,
      codIntOS: resposta.cCodIntOS,
      numero: resposta.cNumOS,
      codigoStatus: resposta.cCodStatus,
      descricaoStatus: resposta.cDescStatus,
    };
  }

  async excluirOS(codigoOS: number): Promise<StatusOrdemServico> {
    const resposta = await this.client.call<{
      cCodIntOS: string;
      nCodOS: number;
      cNumOS: string;
      cCodStatus: string;
      cDescStatus: string;
    }>({
      resource: "servicos/os",
      call: "ExcluirOS",
      param: { nCodOS: codigoOS },
    });

    return {
      codigoOS: resposta.nCodOS,
      codIntOS: resposta.cCodIntOS,
      numero: resposta.cNumOS,
      codigoStatus: resposta.cCodStatus,
      descricaoStatus: resposta.cDescStatus,
    };
  }

  async consultarOS(codigoOS: number): Promise<OrdemServicoOmie> {
    return this.client.call<OrdemServicoOmie>({
      resource: "servicos/os",
      call: "ConsultarOS",
      param: { nCodOS: codigoOS },
    });
  }

  async listarOSPagina(params: ListarOSPageParams): Promise<ListarOSResponse> {
    try {
      return await this.client.call<ListarOSResponse>({
        resource: "servicos/os",
        call: "ListarOS",
        param: { pagina: params.pagina, registros_por_pagina: params.registrosPorPagina },
      });
    } catch (err) {
      if (err instanceof OmieApiError && err.faultCode === "SOAP-ENV:Client-5113") {
        return { pagina: params.pagina, total_de_paginas: 1, registros: 0, total_de_registros: 0, osCadastro: [] };
      }
      throw err;
    }
  }
}
