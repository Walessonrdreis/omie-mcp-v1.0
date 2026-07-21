import { IPixGateway, PixOmie } from "../../domain/interfaces/pix-gateway.js";
import { aplicarFiltros } from "../../../../shared/filtro.js";
import {
  CancelarPixParam,
  CodigoTituloPixParam,
  GerarPixParam,
  ListarPixParam,
  ListarPixResult,
  PixDetalhe,
  PixResumo,
} from "../dto/pix.dto.js";

function mapearResumo(pix: PixOmie): PixResumo {
  return {
    idPix: pix.nIdPix,
    codigoTitulo: pix.nCodTitulo,
    valor: pix.vValor,
    dataEmissao: pix.dEmissao,
    dataVencimento: pix.dVencimento,
    status: pix.cStatus,
  };
}

function mapearDetalhe(pix: PixOmie): PixDetalhe {
  return { ...mapearResumo(pix), urlPix: pix.cUrlPix, copiaCola: pix.cCopiaCola };
}

export class ListarPixUseCase {
  constructor(private readonly gateway: IPixGateway) {}

  async execute(param: ListarPixParam): Promise<ListarPixResult> {
    const pagina = param.pagina ?? 1;
    const registrosPorPagina = param.registros_por_pagina ?? 50;

    const resposta = await this.gateway.listarPixPagina({
      pagina,
      registrosPorPagina,
      emissaoDe: param.emissao_de,
      emissaoAte: param.emissao_ate,
      status: param.status,
    });

    return {
      pagina: resposta.nPagina,
      totalPaginas: resposta.nTotPaginas,
      totalRegistros: resposta.nTotRegistros,
      registros: aplicarFiltros(resposta.ListaPix.map(mapearResumo), param.filtros),
    };
  }
}

export class ObterPixUseCase {
  constructor(private readonly gateway: IPixGateway) {}

  async execute(param: CodigoTituloPixParam): Promise<PixDetalhe> {
    return mapearDetalhe(await this.gateway.obterPix(param.codigo_titulo));
  }
}

export class ObterStatusPixUseCase {
  constructor(private readonly gateway: IPixGateway) {}

  async execute(param: CodigoTituloPixParam) {
    const status = await this.gateway.obterStatusPix(param.codigo_titulo);
    return {
      idPix: status.nIdPix,
      codigoTitulo: status.nCodTitulo,
      valor: status.vValor,
      status: status.cStatus,
    };
  }
}

export class GerarPixUseCase {
  constructor(private readonly gateway: IPixGateway) {}

  async execute(param: GerarPixParam): Promise<PixDetalhe> {
    return mapearDetalhe(
      await this.gateway.gerarPix({
        codigoTitulo: param.codigo_titulo,
        valor: param.valor,
        codigoContaCorrente: param.codigo_conta_corrente,
      })
    );
  }
}

export class CancelarPixUseCase {
  constructor(private readonly gateway: IPixGateway) {}

  async execute(param: CancelarPixParam) {
    const status = await this.gateway.cancelarPix(param.id_pix);
    return { codigoStatus: status.cCodStatus, descricaoStatus: status.cDescStatus };
  }
}
