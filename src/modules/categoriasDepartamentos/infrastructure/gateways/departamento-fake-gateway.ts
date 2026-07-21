import {
  DepartamentoOmie,
  DepartamentoParaAlterar,
  DepartamentoParaIncluir,
  IDepartamentoGateway,
  ListarDepartamentosPageParams,
  ListarDepartamentosResponse,
  StatusDepartamento,
} from "../../domain/interfaces/departamento-gateway.js";

export class DepartamentoFakeGateway implements IDepartamentoGateway {
  private proximoCodigo = 3000;
  private readonly departamentos = new Map<string, DepartamentoOmie>();

  async incluirDepartamento(dados: DepartamentoParaIncluir): Promise<StatusDepartamento> {
    const codigo = String(this.proximoCodigo++);
    this.departamentos.set(codigo, {
      codigo,
      descricao: dados.descricao,
      estrutura: `${dados.codigoPai}.001`,
      inativo: "N",
    });

    return { codigo, descricao: dados.descricao, codigoStatus: "0", descricaoStatus: "Departamento adicionado com sucesso! (fake)" };
  }

  private encontrar(codigo: string): DepartamentoOmie {
    const departamento = this.departamentos.get(codigo);
    if (!departamento) throw new Error(`Departamento ${codigo} não encontrado (fake).`);
    return departamento;
  }

  async alterarDepartamento(dados: DepartamentoParaAlterar): Promise<StatusDepartamento> {
    const departamento = this.encontrar(dados.codigo);
    if (dados.descricao !== undefined) departamento.descricao = dados.descricao;

    return { codigo: departamento.codigo, descricao: departamento.descricao, codigoStatus: "0", descricaoStatus: "Departamento alterado com sucesso! (fake)" };
  }

  async excluirDepartamento(codigo: string): Promise<StatusDepartamento> {
    const departamento = this.encontrar(codigo);
    this.departamentos.delete(codigo);

    return { codigo: departamento.codigo, descricao: departamento.descricao, codigoStatus: "0", descricaoStatus: "Departamento excluido com sucesso! (fake)" };
  }

  async consultarDepartamento(codigo: string): Promise<DepartamentoOmie> {
    return this.encontrar(codigo);
  }

  async listarDepartamentosPagina(
    params: ListarDepartamentosPageParams
  ): Promise<ListarDepartamentosResponse> {
    const todos = Array.from(this.departamentos.values());
    const inicio = (params.pagina - 1) * params.registrosPorPagina;
    const pagina = todos.slice(inicio, inicio + params.registrosPorPagina);

    return {
      pagina: params.pagina,
      total_de_paginas: Math.max(1, Math.ceil(todos.length / params.registrosPorPagina)),
      registros: pagina.length,
      total_de_registros: todos.length,
      departamentos: pagina,
    };
  }
}
