import {
  ContatoOmie,
  ContatoParaAlterar,
  ContatoParaIncluir,
  IContatoGateway,
  ListarContatosPageParams,
  ListarContatosResponse,
  StatusContato,
} from "../../domain/interfaces/contato-gateway.js";

export class ContatoFakeGateway implements IContatoGateway {
  private proximoCodigo = 4500;
  private readonly contatos = new Map<number, ContatoOmie>();

  async incluirContato(dados: ContatoParaIncluir): Promise<StatusContato> {
    const codigoContato = this.proximoCodigo++;
    this.contatos.set(codigoContato, {
      identificacao: {
        nCod: codigoContato,
        cCodInt: dados.codIntContato,
        cNome: dados.nome,
        cSobrenome: dados.sobrenome,
        nCodConta: dados.codigoConta,
      },
      telefone_email: { cEmail: dados.email ?? "" },
    });

    return {
      codigoContato,
      codIntContato: dados.codIntContato,
      codigoStatus: "0",
      descricaoStatus: "Contato cadastrado com sucesso! (fake)",
    };
  }

  private encontrar(codigoContato: number): ContatoOmie {
    const contato = this.contatos.get(codigoContato);
    if (!contato) throw new Error(`Contato ${codigoContato} não encontrado (fake).`);
    return contato;
  }

  async alterarContato(dados: ContatoParaAlterar): Promise<StatusContato> {
    const contato = this.encontrar(dados.codigoContato);
    if (dados.nome !== undefined) contato.identificacao.cNome = dados.nome;
    if (dados.sobrenome !== undefined) contato.identificacao.cSobrenome = dados.sobrenome;
    if (dados.email !== undefined) contato.telefone_email.cEmail = dados.email;

    return {
      codigoContato: contato.identificacao.nCod,
      codIntContato: contato.identificacao.cCodInt,
      codigoStatus: "0",
      descricaoStatus: "Contato alterado com sucesso! (fake)",
    };
  }

  async excluirContato(codigoContato: number): Promise<StatusContato> {
    const contato = this.encontrar(codigoContato);
    this.contatos.delete(codigoContato);

    return {
      codigoContato: contato.identificacao.nCod,
      codIntContato: contato.identificacao.cCodInt,
      codigoStatus: "0",
      descricaoStatus: "Contato excluído com sucesso! (fake)",
    };
  }

  async consultarContato(codigoContato: number): Promise<ContatoOmie> {
    return this.encontrar(codigoContato);
  }

  async listarContatosPagina(params: ListarContatosPageParams): Promise<ListarContatosResponse> {
    const todos = Array.from(this.contatos.values());
    const inicio = (params.pagina - 1) * params.registrosPorPagina;
    const pagina = todos.slice(inicio, inicio + params.registrosPorPagina);

    return {
      pagina: params.pagina,
      total_de_paginas: Math.max(1, Math.ceil(todos.length / params.registrosPorPagina)),
      registros: pagina.length,
      total_de_registros: todos.length,
      cadastros: pagina,
    };
  }
}
