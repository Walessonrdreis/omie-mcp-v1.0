import { INotaEntradaGateway, NotaEntradaOmie, NotaEntradaResumoOmie } from "../../domain/interfaces/nota-entrada-gateway.js";
import { aplicarFiltros } from "../../../../shared/filtro.js";
import {
  ConsultarNotaEntradaParam,
  ListarNotaEntradaParam,
  ListarNotaEntradaResult,
  NotaEntradaDetalhe,
  NotaEntradaResumo,
} from "../dto/nota-entrada.dto.js";

function mapearResumo(nota: NotaEntradaResumoOmie): NotaEntradaResumo {
  return {
    codigoNota: nota.cabec.nCodNotaEnt,
    numero: nota.cabec.cNumeroNotaEnt,
    dataPrevisao: nota.cabec.dPrevisao,
    codigoFornecedor: nota.cabec.nCodCli,
    valorMercadorias: nota.totais.nMercadorias,
    valorTotal: nota.totais.nTotalNotaEnt,
  };
}

function mapearDetalhe(nota: NotaEntradaOmie): NotaEntradaDetalhe {
  return {
    ...mapearResumo(nota),
    itens: nota.produtos.map((p) => ({
      cfop: p.cCFOP,
      ncm: p.cNCM,
      codigoLocalEstoque: p.codigo_local_estoque,
    })),
  };
}

export class ListarNotaEntradaUseCase {
  constructor(private readonly gateway: INotaEntradaGateway) {}

  async execute(param: ListarNotaEntradaParam): Promise<ListarNotaEntradaResult> {
    const pagina = param.pagina ?? 1;
    const registrosPorPagina = param.registros_por_pagina ?? 50;

    const resposta = await this.gateway.listarNotasPagina({
      pagina,
      registrosPorPagina,
      dataAlteracaoDe: param.data_alteracao_de,
      dataAlteracaoAte: param.data_alteracao_ate,
    });

    return {
      pagina: resposta.nPagina,
      totalPaginas: resposta.nTotalPaginas,
      totalRegistros: resposta.nTotalRegistros,
      notas: aplicarFiltros(resposta.notas.map(mapearResumo), param.filtros),
    };
  }
}

export class ConsultarNotaEntradaUseCase {
  constructor(private readonly gateway: INotaEntradaGateway) {}

  async execute(param: ConsultarNotaEntradaParam): Promise<NotaEntradaDetalhe> {
    return mapearDetalhe(await this.gateway.consultarNota(param.codigo_nota));
  }
}
