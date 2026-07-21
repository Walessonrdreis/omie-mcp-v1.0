import {
  IServicoGateway,
  ListarServicosPageParams,
  ListarServicosResponse,
  ServicoOmie,
  ServicoParaAlterar,
  ServicoParaIncluir,
  StatusServico,
} from "../../domain/interfaces/servico-gateway.js";

export class ServicoFakeGateway implements IServicoGateway {
  private proximoCodigo = 5000;
  private readonly servicos = new Map<number, ServicoOmie>();

  async incluirServico(dados: ServicoParaIncluir): Promise<StatusServico> {
    const codigoServico = this.proximoCodigo++;
    this.servicos.set(codigoServico, {
      intListar: { cCodIntServ: dados.codIntServico, nCodServ: codigoServico },
      cabecalho: {
        cCodigo: dados.codigo,
        cDescricao: dados.descricao,
        nPrecoUnit: dados.precoUnitario,
        cCodCateg: dados.codigoCategoria ?? "",
      },
      descricao: { cDescrCompleta: dados.descricaoCompleta ?? dados.descricao },
      info: { inativo: "N" },
    });

    return {
      codigoServico,
      codIntServico: dados.codIntServico,
      codigoStatus: "0",
      descricaoStatus: "Serviço cadastrado com sucesso! (fake)",
    };
  }

  private encontrar(codigoServico: number): ServicoOmie {
    const servico = this.servicos.get(codigoServico);
    if (!servico) throw new Error(`Serviço ${codigoServico} não encontrado (fake).`);
    return servico;
  }

  async alterarServico(dados: ServicoParaAlterar): Promise<StatusServico> {
    const servico = this.encontrar(dados.codigoServico);
    if (dados.descricao !== undefined) servico.cabecalho.cDescricao = dados.descricao;
    if (dados.precoUnitario !== undefined) servico.cabecalho.nPrecoUnit = dados.precoUnitario;
    if (dados.descricaoCompleta !== undefined) servico.descricao.cDescrCompleta = dados.descricaoCompleta;

    return {
      codigoServico: servico.intListar.nCodServ,
      codIntServico: servico.intListar.cCodIntServ,
      codigoStatus: "0",
      descricaoStatus: "Serviço alterado com sucesso! (fake)",
    };
  }

  async excluirServico(codigoServico: number): Promise<StatusServico> {
    const servico = this.encontrar(codigoServico);
    this.servicos.delete(codigoServico);

    return {
      codigoServico: servico.intListar.nCodServ,
      codIntServico: servico.intListar.cCodIntServ,
      codigoStatus: "0",
      descricaoStatus: "Serviço excluído com sucesso! (fake)",
    };
  }

  async consultarServico(codigoServico: number): Promise<ServicoOmie> {
    return this.encontrar(codigoServico);
  }

  async listarServicosPagina(params: ListarServicosPageParams): Promise<ListarServicosResponse> {
    const todos = Array.from(this.servicos.values());
    const inicio = (params.pagina - 1) * params.registrosPorPagina;
    const pagina = todos.slice(inicio, inicio + params.registrosPorPagina);

    return {
      nPagina: params.pagina,
      nTotPaginas: Math.max(1, Math.ceil(todos.length / params.registrosPorPagina)),
      nRegistros: pagina.length,
      nTotRegistros: todos.length,
      cadastros: pagina,
    };
  }
}
