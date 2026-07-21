import {
  IOrdemServicoGateway,
  ListarOSPageParams,
  ListarOSResponse,
  OrdemServicoOmie,
  OrdemServicoParaAlterar,
  OrdemServicoParaIncluir,
  StatusOrdemServico,
} from "../../domain/interfaces/ordem-servico-gateway.js";

export class OrdemServicoFakeGateway implements IOrdemServicoGateway {
  private proximoCodigo = 6000;
  private readonly ordens = new Map<number, OrdemServicoOmie>();

  async incluirOS(dados: OrdemServicoParaIncluir): Promise<StatusOrdemServico> {
    const codigoOS = this.proximoCodigo++;
    const valorTotal = dados.itens.reduce((soma, item) => soma + item.quantidade * item.valorUnitario, 0);

    this.ordens.set(codigoOS, {
      Cabecalho: {
        nCodOS: codigoOS,
        cCodIntOS: dados.codIntOS,
        cNumOS: String(codigoOS),
        nCodCli: dados.codigoCliente,
        cEtapa: dados.etapa,
        dDtPrevisao: dados.dataPrevisao,
        nValorTotal: valorTotal,
      },
      ServicosPrestados: dados.itens.map((item) => ({
        cDescServ: item.descricao,
        nQtde: item.quantidade,
        nValUnit: item.valorUnitario,
      })),
      InfoCadastro: { cFaturada: "N", cCancelada: "N" },
    });

    return {
      codigoOS,
      codIntOS: dados.codIntOS,
      numero: String(codigoOS),
      codigoStatus: "0",
      descricaoStatus: "Ordem de Serviço adicionada com sucesso! (fake)",
    };
  }

  private encontrar(codigoOS: number): OrdemServicoOmie {
    const os = this.ordens.get(codigoOS);
    if (!os) throw new Error(`Ordem de Serviço ${codigoOS} não encontrada (fake).`);
    return os;
  }

  async alterarOS(dados: OrdemServicoParaAlterar): Promise<StatusOrdemServico> {
    const os = this.encontrar(dados.codigoOS);
    if (dados.dataPrevisao !== undefined) os.Cabecalho.dDtPrevisao = dados.dataPrevisao;
    if (dados.etapa !== undefined) os.Cabecalho.cEtapa = dados.etapa;

    return {
      codigoOS: os.Cabecalho.nCodOS,
      codIntOS: os.Cabecalho.cCodIntOS,
      numero: os.Cabecalho.cNumOS,
      codigoStatus: "0",
      descricaoStatus: "Ordem de Serviço alterada com sucesso! (fake)",
    };
  }

  async excluirOS(codigoOS: number): Promise<StatusOrdemServico> {
    const os = this.encontrar(codigoOS);
    this.ordens.delete(codigoOS);

    return {
      codigoOS: os.Cabecalho.nCodOS,
      codIntOS: os.Cabecalho.cCodIntOS,
      numero: os.Cabecalho.cNumOS,
      codigoStatus: "0",
      descricaoStatus: "Ordem de Serviço excluída com sucesso! (fake)",
    };
  }

  async consultarOS(codigoOS: number): Promise<OrdemServicoOmie> {
    return this.encontrar(codigoOS);
  }

  async listarOSPagina(params: ListarOSPageParams): Promise<ListarOSResponse> {
    const todas = Array.from(this.ordens.values());
    const inicio = (params.pagina - 1) * params.registrosPorPagina;
    const pagina = todas.slice(inicio, inicio + params.registrosPorPagina);

    return {
      pagina: params.pagina,
      total_de_paginas: Math.max(1, Math.ceil(todas.length / params.registrosPorPagina)),
      registros: pagina.length,
      total_de_registros: todas.length,
      osCadastro: pagina,
    };
  }
}
