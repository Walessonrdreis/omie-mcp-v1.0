import { ContaOmie, IContaGateway } from "../../domain/interfaces/conta-gateway.js";
import { aplicarFiltros } from "../../../../shared/filtro.js";
import {
  AlterarContaParam,
  ConsultarContaParam,
  ContaResult,
  ExcluirContaParam,
  IncluirContaParam,
  ListarContasParam,
  ListarContasResult,
} from "../dto/conta.dto.js";

function mapearConta(conta: ContaOmie): ContaResult {
  return {
    codigoConta: conta.identificacao.nCod,
    codIntConta: conta.identificacao.cCodInt,
    nome: conta.identificacao.cNome,
    nomeFantasia: conta.identificacao.cNomeFantasia,
    documento: conta.identificacao.cDoc,
    uf: conta.endereco.cUF,
    cidade: conta.endereco.cCidade,
    email: conta.telefone_email.cEmail,
  };
}

export class IncluirContaUseCase {
  constructor(private readonly gateway: IContaGateway) {}

  async execute(param: IncluirContaParam) {
    return this.gateway.incluirConta({
      codIntConta: param.cod_int_conta,
      nome: param.nome,
      uf: param.uf,
      cidade: param.cidade,
      email: param.email,
    });
  }
}

export class AlterarContaUseCase {
  constructor(private readonly gateway: IContaGateway) {}

  async execute(param: AlterarContaParam) {
    return this.gateway.alterarConta({
      codigoConta: param.codigo_conta,
      nome: param.nome,
      uf: param.uf,
      cidade: param.cidade,
      email: param.email,
    });
  }
}

export class ExcluirContaUseCase {
  constructor(private readonly gateway: IContaGateway) {}

  async execute(param: ExcluirContaParam) {
    return this.gateway.excluirConta(param.codigo_conta);
  }
}

export class ConsultarContaUseCase {
  constructor(private readonly gateway: IContaGateway) {}

  async execute(param: ConsultarContaParam): Promise<ContaResult> {
    return mapearConta(await this.gateway.consultarConta(param.codigo_conta));
  }
}

export class ListarContasUseCase {
  constructor(private readonly gateway: IContaGateway) {}

  async execute(param: ListarContasParam): Promise<ListarContasResult> {
    const pagina = param.pagina ?? 1;
    const registrosPorPagina = param.registros_por_pagina ?? 50;

    const resposta = await this.gateway.listarContasPagina({ pagina, registrosPorPagina });

    return {
      pagina: resposta.pagina,
      totalPaginas: resposta.total_de_paginas,
      totalRegistros: resposta.total_de_registros,
      contas: aplicarFiltros(resposta.cadastros.map(mapearConta), param.filtros),
    };
  }
}
