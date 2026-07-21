import {
  IOportunidadeGateway,
  ListarOportunidadesPageParams,
  ListarOportunidadesResponse,
  OportunidadeOmie,
  OportunidadeParaAlterar,
  OportunidadeParaIncluir,
  StatusOportunidade,
} from "../../domain/interfaces/oportunidade-gateway.js";

export class OportunidadeFakeGateway implements IOportunidadeGateway {
  private proximoCodigo = 4800;
  private readonly oportunidades = new Map<number, OportunidadeOmie>();

  async incluirOportunidade(dados: OportunidadeParaIncluir): Promise<StatusOportunidade> {
    const codigoOportunidade = this.proximoCodigo++;
    this.oportunidades.set(codigoOportunidade, {
      identificacao: {
        nCodOp: codigoOportunidade,
        cCodIntOp: dados.codIntOportunidade,
        cDesOp: dados.descricao,
        cNumOp: String(codigoOportunidade),
        nCodConta: dados.codigoConta,
        nCodContato: dados.codigoContato,
        nCodSolucao: dados.codigoSolucao,
        nCodOrigem: dados.codigoOrigem,
      },
      fasesStatus: { nCodFase: 1, nCodStatus: 1 },
      ticket: { nTicket: 0 },
    });

    return {
      codigoOportunidade,
      codIntOportunidade: dados.codIntOportunidade,
      codigoStatus: "0",
      descricaoStatus: "Oportunidade cadastrada com sucesso! (fake)",
    };
  }

  private encontrar(codigoOportunidade: number): OportunidadeOmie {
    const oportunidade = this.oportunidades.get(codigoOportunidade);
    if (!oportunidade) throw new Error(`Oportunidade ${codigoOportunidade} não encontrada (fake).`);
    return oportunidade;
  }

  async alterarOportunidade(dados: OportunidadeParaAlterar): Promise<StatusOportunidade> {
    const oportunidade = this.encontrar(dados.codigoOportunidade);
    if (dados.descricao !== undefined) oportunidade.identificacao.cDesOp = dados.descricao;

    return {
      codigoOportunidade: oportunidade.identificacao.nCodOp,
      codIntOportunidade: oportunidade.identificacao.cCodIntOp,
      codigoStatus: "0",
      descricaoStatus: "Oportunidade alterada com sucesso! (fake)",
    };
  }

  async excluirOportunidade(codigoOportunidade: number): Promise<StatusOportunidade> {
    const oportunidade = this.encontrar(codigoOportunidade);
    this.oportunidades.delete(codigoOportunidade);

    return {
      codigoOportunidade: oportunidade.identificacao.nCodOp,
      codIntOportunidade: oportunidade.identificacao.cCodIntOp,
      codigoStatus: "0",
      descricaoStatus: "Oportunidade excluída com sucesso! (fake)",
    };
  }

  async consultarOportunidade(codigoOportunidade: number): Promise<OportunidadeOmie> {
    return this.encontrar(codigoOportunidade);
  }

  async listarOportunidadesPagina(
    params: ListarOportunidadesPageParams
  ): Promise<ListarOportunidadesResponse> {
    const todas = Array.from(this.oportunidades.values());
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
