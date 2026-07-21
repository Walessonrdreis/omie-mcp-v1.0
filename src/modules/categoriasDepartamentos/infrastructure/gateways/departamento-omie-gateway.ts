import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import { comCache, chaveCache, limparCache } from "../../../../shared/cache.js";
import {
  DepartamentoOmie,
  DepartamentoParaAlterar,
  DepartamentoParaIncluir,
  IDepartamentoGateway,
  ListarDepartamentosPageParams,
  ListarDepartamentosResponse,
  StatusDepartamento,
} from "../../domain/interfaces/departamento-gateway.js";

export class DepartamentoOmieGateway implements IDepartamentoGateway {
  constructor(private readonly client: OmieClient) {}

  async incluirDepartamento(dados: DepartamentoParaIncluir): Promise<StatusDepartamento> {
    const resposta = await this.client.call<{
      codigo: string;
      descricao: string;
      cCodStatus: string;
      cDesStatus: string;
    }>({
      resource: "geral/departamentos",
      call: "IncluirDepartamento",
      // Testado ao vivo: `codigo` aqui é o código do departamento PAI — a
      // Omie gera e devolve o código do novo departamento na resposta.
      param: { codigo: dados.codigoPai, descricao: dados.descricao },
    });
    limparCache("geral/departamentos");

    return {
      codigo: resposta.codigo,
      descricao: dados.descricao,
      codigoStatus: resposta.cCodStatus,
      descricaoStatus: resposta.cDesStatus,
    };
  }

  async alterarDepartamento(dados: DepartamentoParaAlterar): Promise<StatusDepartamento> {
    const resposta = await this.client.call<{
      codigo: string;
      descricao: string;
      cCodStatus: string;
      cDesStatus: string;
    }>({
      resource: "geral/departamentos",
      call: "AlterarDepartamento",
      param: {
        codigo: dados.codigo,
        ...(dados.descricao !== undefined ? { descricao: dados.descricao } : {}),
      },
    });
    limparCache("geral/departamentos");

    return {
      codigo: resposta.codigo,
      descricao: resposta.descricao,
      codigoStatus: resposta.cCodStatus,
      descricaoStatus: resposta.cDesStatus,
    };
  }

  async excluirDepartamento(codigo: string): Promise<StatusDepartamento> {
    const resposta = await this.client.call<{
      codigo: string;
      descricao: string;
      cCodStatus: string;
      cDesStatus: string;
    }>({
      resource: "geral/departamentos",
      call: "ExcluirDepartamento",
      param: { codigo },
    });
    limparCache("geral/departamentos");

    return {
      codigo: resposta.codigo,
      descricao: resposta.descricao,
      codigoStatus: resposta.cCodStatus,
      descricaoStatus: resposta.cDesStatus,
    };
  }

  async consultarDepartamento(codigo: string): Promise<DepartamentoOmie> {
    return this.client.call<DepartamentoOmie>({
      resource: "geral/departamentos",
      call: "ConsultarDepartamento",
      param: { codigo },
    });
  }

  async listarDepartamentosPagina(
    params: ListarDepartamentosPageParams
  ): Promise<ListarDepartamentosResponse> {
    const resource = "geral/departamentos";
    const call = "ListarDepartamentos";
    const param = { pagina: params.pagina, registros_por_pagina: params.registrosPorPagina };
    return comCache(chaveCache(resource, call, param), () =>
      this.client.call<ListarDepartamentosResponse>({ resource, call, param })
    );
  }
}
