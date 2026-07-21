import { IRequisicaoCompraGateway } from "../../domain/interfaces/requisicao-compra-gateway.js";
import { aplicarFiltros } from "../../../../shared/filtro.js";
import {
  AlterarRequisicaoCompraParam,
  ConsultarRequisicaoCompraParam,
  ExcluirRequisicaoCompraParam,
  IncluirRequisicaoCompraParam,
  ListarRequisicoesCompraParam,
  ListarRequisicoesCompraResult,
  RequisicaoCompraResult,
} from "../dto/requisicao-compra.dto.js";
import { mapearRequisicaoCompra } from "./mapear-requisicao-compra.js";

function mapearItensParam(itens: IncluirRequisicaoCompraParam["itens"]) {
  return itens.map((item) => ({
    codIntItem: item.cod_int_item,
    codProduto: item.codigo_produto,
    quantidade: item.quantidade,
    precoUnitario: item.preco_unitario,
  }));
}

export class IncluirRequisicaoCompraUseCase {
  constructor(private readonly gateway: IRequisicaoCompraGateway) {}

  async execute(param: IncluirRequisicaoCompraParam) {
    return this.gateway.incluirRequisicao({
      codIntReqCompra: param.cod_int_requisicao,
      codigoCategoria: param.codigo_categoria,
      dataSugestao: param.data_sugestao,
      itens: mapearItensParam(param.itens),
    });
  }
}

export class AlterarRequisicaoCompraUseCase {
  constructor(private readonly gateway: IRequisicaoCompraGateway) {}

  async execute(param: AlterarRequisicaoCompraParam) {
    return this.gateway.alterarRequisicao({
      codigoRequisicao: param.codigo_requisicao,
      codigoCategoria: param.codigo_categoria,
      dataSugestao: param.data_sugestao,
      itens: param.itens ? mapearItensParam(param.itens) : undefined,
    });
  }
}

export class ExcluirRequisicaoCompraUseCase {
  constructor(private readonly gateway: IRequisicaoCompraGateway) {}

  async execute(param: ExcluirRequisicaoCompraParam) {
    return this.gateway.excluirRequisicao(param.codigo_requisicao);
  }
}

export class ConsultarRequisicaoCompraUseCase {
  constructor(private readonly gateway: IRequisicaoCompraGateway) {}

  async execute(param: ConsultarRequisicaoCompraParam): Promise<RequisicaoCompraResult> {
    const requisicao = await this.gateway.consultarRequisicao(param.codigo_requisicao);
    return mapearRequisicaoCompra(requisicao);
  }
}

export class ListarRequisicoesCompraUseCase {
  constructor(private readonly gateway: IRequisicaoCompraGateway) {}

  async execute(param: ListarRequisicoesCompraParam): Promise<ListarRequisicoesCompraResult> {
    const pagina = param.pagina ?? 1;
    const registrosPorPagina = param.registros_por_pagina ?? 50;

    const resposta = await this.gateway.listarRequisicoesPagina({ pagina, registrosPorPagina });

    const requisicoes = aplicarFiltros(
      resposta.requisicaoCadastro.map(mapearRequisicaoCompra),
      param.filtros
    );

    return {
      totalPaginas: resposta.total_de_paginas,
      totalRegistros: resposta.total_de_registros,
      requisicoes,
    };
  }
}
