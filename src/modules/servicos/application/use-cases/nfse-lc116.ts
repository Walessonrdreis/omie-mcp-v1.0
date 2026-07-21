import { INfseGateway } from "../../domain/interfaces/nfse-gateway.js";
import { aplicarFiltros } from "../../../../shared/filtro.js";
import {
  ListarLC116Param,
  ListarLC116Result,
  ListarNFSeParam,
  ListarNFSeResult,
} from "../dto/nfse.dto.js";

export class ListarNFSeUseCase {
  constructor(private readonly gateway: INfseGateway) {}

  async execute(param: ListarNFSeParam): Promise<ListarNFSeResult> {
    const pagina = param.pagina ?? 1;
    const registrosPorPagina = param.registros_por_pagina ?? 50;

    const resposta = await this.gateway.listarNFSePagina({
      pagina,
      registrosPorPagina,
      emissaoDe: param.emissao_de,
      emissaoAte: param.emissao_ate,
    });

    const notas = resposta.nfseEncontradas.map((n) => ({
      numero: n.nNumeroNFSe,
      serie: n.cSerieNFSe,
      dataEmissao: n.dDtEmissao,
      codigoCliente: n.nCodigoCliente,
      valorServicos: n.nValorServicos,
      status: n.cStatusNFSe,
    }));

    return {
      pagina: resposta.nPagina,
      totalPaginas: resposta.nTotPaginas,
      totalRegistros: resposta.nTotRegistros,
      notas: aplicarFiltros(notas, param.filtros),
    };
  }
}

export class ListarLC116UseCase {
  constructor(private readonly gateway: INfseGateway) {}

  async execute(param: ListarLC116Param): Promise<ListarLC116Result> {
    const pagina = param.pagina ?? 1;
    const registrosPorPagina = param.registros_por_pagina ?? 50;

    const resposta = await this.gateway.listarCodigosLC116Pagina(pagina, registrosPorPagina);

    const codigos = resposta.cadastros.map((c) => ({
      codigo: c.cCodigo,
      descricao: c.cDescricao,
      descricaoCompleta: c.cDescrCompleta,
    }));

    return {
      totalPaginas: resposta.total_de_paginas,
      totalRegistros: resposta.total_de_registros,
      codigos: aplicarFiltros(codigos, param.filtros),
    };
  }
}
