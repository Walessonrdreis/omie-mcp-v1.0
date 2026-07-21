import { INfeGateway } from "../../domain/interfaces/nfe-gateway.js";
import { aplicarFiltros } from "../../../../shared/filtro.js";
import { ListarNfeParam, ListarNfeResult } from "../dto/nfe.dto.js";
import { mapearNotaFiscalResumo } from "./mapear-nota-fiscal.js";

export class ListarNfeUseCase {
  constructor(private readonly nfeGateway: INfeGateway) {}

  async execute(param: ListarNfeParam): Promise<ListarNfeResult> {
    const pagina = param.pagina ?? 1;
    const registrosPorPagina = param.registros_por_pagina ?? 50;

    const resposta = await this.nfeGateway.listarNotasPagina({
      pagina,
      registrosPorPagina,
      filtrarPorDataDe: param.data_de,
      filtrarPorDataAte: param.data_ate,
      filtrarPorStatus:
        param.apenas_canceladas === true ? "C" : param.apenas_canceladas === false ? "N" : undefined,
      tpNF: param.tipo === "saida" ? "1" : param.tipo === "entrada" ? "0" : undefined,
    });

    const notas = aplicarFiltros(resposta.nfCadastro.map(mapearNotaFiscalResumo), param.filtros);

    return {
      pagina: resposta.pagina,
      totalPaginas: resposta.total_de_paginas,
      totalRegistros: resposta.total_de_registros,
      notas,
    };
  }
}
