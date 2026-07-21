import { OmieClient } from "../../../../integrations/omie/omieClient.js";
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
    return this.client.call<ListarDepartamentosResponse>({
      resource: "geral/departamentos",
      call: "ListarDepartamentos",
      param: { pagina: params.pagina, registros_por_pagina: params.registrosPorPagina },
    });
  }
}
