import { IOrdemServicoGateway } from "../../domain/interfaces/ordem-servico-gateway.js";
import { aplicarFiltros } from "../../../../shared/filtro.js";
import {
  AlterarOSParam,
  ConsultarOSParam,
  ExcluirOSParam,
  IncluirOSParam,
  ListarOSParam,
  ListarOSResult,
  OSDetalhe,
} from "../dto/ordem-servico.dto.js";
import { mapearOSDetalhe, mapearOSResumo } from "./mapear-ordem-servico.js";

function mapearItensParam(itens: IncluirOSParam["itens"]) {
  return itens.map((item) => ({
    quantidade: item.quantidade,
    valorUnitario: item.valor_unitario,
    descricao: item.descricao,
    tributacaoServico: item.tributacao_servico,
    codigoServicoMunicipal: item.codigo_servico_municipal,
    codigoServicoLC116: item.codigo_servico_lc116,
    retemISS: item.retem_iss,
  }));
}

export class IncluirOSUseCase {
  constructor(private readonly gateway: IOrdemServicoGateway) {}

  async execute(param: IncluirOSParam) {
    return this.gateway.incluirOS({
      codIntOS: param.cod_int_os,
      codigoCliente: param.codigo_cliente,
      codigoCondicaoPagamento: param.codigo_condicao_pagamento,
      dataPrevisao: param.data_previsao,
      etapa: param.etapa,
      quantidadeParcelas: param.quantidade_parcelas,
      codigoCategoria: param.codigo_categoria,
      codigoContaCorrente: param.codigo_conta_corrente,
      itens: mapearItensParam(param.itens),
    });
  }
}

export class AlterarOSUseCase {
  constructor(private readonly gateway: IOrdemServicoGateway) {}

  async execute(param: AlterarOSParam) {
    return this.gateway.alterarOS({
      codigoOS: param.codigo_os,
      dataPrevisao: param.data_previsao,
      etapa: param.etapa,
    });
  }
}

export class ExcluirOSUseCase {
  constructor(private readonly gateway: IOrdemServicoGateway) {}

  async execute(param: ExcluirOSParam) {
    return this.gateway.excluirOS(param.codigo_os);
  }
}

export class ConsultarOSUseCase {
  constructor(private readonly gateway: IOrdemServicoGateway) {}

  async execute(param: ConsultarOSParam): Promise<OSDetalhe> {
    return mapearOSDetalhe(await this.gateway.consultarOS(param.codigo_os));
  }
}

export class ListarOSUseCase {
  constructor(private readonly gateway: IOrdemServicoGateway) {}

  async execute(param: ListarOSParam): Promise<ListarOSResult> {
    const pagina = param.pagina ?? 1;
    const registrosPorPagina = param.registros_por_pagina ?? 50;

    const resposta = await this.gateway.listarOSPagina({ pagina, registrosPorPagina });

    return {
      pagina: resposta.pagina,
      totalPaginas: resposta.total_de_paginas,
      totalRegistros: resposta.total_de_registros,
      ordens: aplicarFiltros(resposta.osCadastro.map(mapearOSResumo), param.filtros),
    };
  }
}
