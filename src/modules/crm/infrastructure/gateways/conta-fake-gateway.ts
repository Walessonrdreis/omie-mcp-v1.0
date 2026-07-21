import {
  ContaOmie,
  ContaParaAlterar,
  ContaParaIncluir,
  IContaGateway,
  ListarContasPageParams,
  ListarContasResponse,
  StatusConta,
} from "../../domain/interfaces/conta-gateway.js";

export class ContaFakeGateway implements IContaGateway {
  private proximoCodigo = 4000;
  private readonly contas = new Map<number, ContaOmie>();

  async incluirConta(dados: ContaParaIncluir): Promise<StatusConta> {
    const codigoConta = this.proximoCodigo++;
    this.contas.set(codigoConta, {
      identificacao: { nCod: codigoConta, cCodInt: dados.codIntConta, cNome: dados.nome, cNomeFantasia: "", cDoc: "" },
      endereco: { cUF: dados.uf, cCidade: dados.cidade },
      telefone_email: { cEmail: dados.email },
    });

    return {
      codigoConta,
      codIntConta: dados.codIntConta,
      codigoStatus: "0",
      descricaoStatus: "Conta cadastrada com sucesso! (fake)",
    };
  }

  private encontrar(codigoConta: number): ContaOmie {
    const conta = this.contas.get(codigoConta);
    if (!conta) throw new Error(`Conta ${codigoConta} não encontrada (fake).`);
    return conta;
  }

  async alterarConta(dados: ContaParaAlterar): Promise<StatusConta> {
    const conta = this.encontrar(dados.codigoConta);
    if (dados.nome !== undefined) conta.identificacao.cNome = dados.nome;
    if (dados.uf !== undefined) conta.endereco.cUF = dados.uf;
    if (dados.cidade !== undefined) conta.endereco.cCidade = dados.cidade;
    if (dados.email !== undefined) conta.telefone_email.cEmail = dados.email;

    return {
      codigoConta: conta.identificacao.nCod,
      codIntConta: conta.identificacao.cCodInt,
      codigoStatus: "0",
      descricaoStatus: "Conta alterada com sucesso! (fake)",
    };
  }

  async excluirConta(codigoConta: number): Promise<StatusConta> {
    const conta = this.encontrar(codigoConta);
    this.contas.delete(codigoConta);

    return {
      codigoConta: conta.identificacao.nCod,
      codIntConta: conta.identificacao.cCodInt,
      codigoStatus: "0",
      descricaoStatus: "Conta excluída com sucesso! (fake)",
    };
  }

  async consultarConta(codigoConta: number): Promise<ContaOmie> {
    return this.encontrar(codigoConta);
  }

  async listarContasPagina(params: ListarContasPageParams): Promise<ListarContasResponse> {
    const todas = Array.from(this.contas.values());
    const inicio = (params.pagina - 1) * params.registrosPorPagina;
    const pagina = todas.slice(inicio, inicio + params.registrosPorPagina);

    return {
      pagina: params.pagina,
      total_de_paginas: Math.max(1, Math.ceil(todas.length / params.registrosPorPagina)),
      registros: pagina.length,
      total_de_registros: todas.length,
      cadastros: pagina,
    };
  }
}
