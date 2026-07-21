import {
  CaracteristicaOmie,
  CaracteristicaParaAlterar,
  CaracteristicaParaIncluir,
  ICaracteristicaGateway,
  ListarCaracteristicasPageParams,
  ListarCaracteristicasResponse,
  StatusCaracteristica,
} from "../../domain/interfaces/caracteristica-gateway.js";

export class CaracteristicaFakeGateway implements ICaracteristicaGateway {
  private proximoCodigo = 2000;
  private readonly caracteristicas = new Map<number, CaracteristicaOmie>();

  async incluirCaracteristica(dados: CaracteristicaParaIncluir): Promise<StatusCaracteristica> {
    const codigo = this.proximoCodigo++;
    this.caracteristicas.set(codigo, {
      nCodCaract: codigo,
      cCodIntCaract: dados.codIntCaracteristica,
      cNomeCaract: dados.nome,
      conteudosPermitidos: (dados.conteudosPermitidos ?? []).map((c) => ({ cConteudo: c })),
    });

    return {
      codigoCaracteristica: codigo,
      codIntCaracteristica: dados.codIntCaracteristica,
      codigoStatus: "0",
      descricaoStatus: "Característica adicionada com sucesso! (fake)",
    };
  }

  private encontrar(codigo: number): CaracteristicaOmie {
    const caracteristica = this.caracteristicas.get(codigo);
    if (!caracteristica) throw new Error(`Característica ${codigo} não encontrada (fake).`);
    return caracteristica;
  }

  async alterarCaracteristica(dados: CaracteristicaParaAlterar): Promise<StatusCaracteristica> {
    const caracteristica = this.encontrar(dados.codigoCaracteristica);
    if (dados.nome !== undefined) caracteristica.cNomeCaract = dados.nome;

    return {
      codigoCaracteristica: caracteristica.nCodCaract,
      codIntCaracteristica: caracteristica.cCodIntCaract,
      codigoStatus: "0",
      descricaoStatus: "Característica alterada com sucesso! (fake)",
    };
  }

  async excluirCaracteristica(codigo: number): Promise<StatusCaracteristica> {
    const caracteristica = this.encontrar(codigo);
    this.caracteristicas.delete(codigo);

    return {
      codigoCaracteristica: caracteristica.nCodCaract,
      codIntCaracteristica: caracteristica.cCodIntCaract,
      codigoStatus: "0",
      descricaoStatus: "Característica excluída com sucesso! (fake)",
    };
  }

  async consultarCaracteristica(codigo: number): Promise<CaracteristicaOmie> {
    return this.encontrar(codigo);
  }

  async listarCaracteristicasPagina(
    params: ListarCaracteristicasPageParams
  ): Promise<ListarCaracteristicasResponse> {
    const todas = Array.from(this.caracteristicas.values());
    const inicio = (params.pagina - 1) * params.registrosPorPagina;
    const pagina = todas.slice(inicio, inicio + params.registrosPorPagina);

    return {
      nPagina: params.pagina,
      nTotPaginas: Math.max(1, Math.ceil(todas.length / params.registrosPorPagina)),
      nRegistros: pagina.length,
      nTotRegistros: todas.length,
      listaCaracteristicas: pagina,
    };
  }
}
