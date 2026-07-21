import { ContatoOmie, IContatoGateway } from "../../domain/interfaces/contato-gateway.js";
import { aplicarFiltros } from "../../../../shared/filtro.js";
import {
  AlterarContatoParam,
  ConsultarContatoParam,
  ContatoResult,
  ExcluirContatoParam,
  IncluirContatoParam,
  ListarContatosParam,
  ListarContatosResult,
} from "../dto/contato.dto.js";

function mapearContato(contato: ContatoOmie): ContatoResult {
  return {
    codigoContato: contato.identificacao.nCod,
    codIntContato: contato.identificacao.cCodInt,
    nome: contato.identificacao.cNome,
    sobrenome: contato.identificacao.cSobrenome,
    codigoConta: contato.identificacao.nCodConta,
    email: contato.telefone_email.cEmail,
  };
}

export class IncluirContatoUseCase {
  constructor(private readonly gateway: IContatoGateway) {}

  async execute(param: IncluirContatoParam) {
    return this.gateway.incluirContato({
      codIntContato: param.cod_int_contato,
      nome: param.nome,
      sobrenome: param.sobrenome,
      codigoConta: param.codigo_conta,
      email: param.email,
    });
  }
}

export class AlterarContatoUseCase {
  constructor(private readonly gateway: IContatoGateway) {}

  async execute(param: AlterarContatoParam) {
    return this.gateway.alterarContato({
      codigoContato: param.codigo_contato,
      nome: param.nome,
      sobrenome: param.sobrenome,
      email: param.email,
    });
  }
}

export class ExcluirContatoUseCase {
  constructor(private readonly gateway: IContatoGateway) {}

  async execute(param: ExcluirContatoParam) {
    return this.gateway.excluirContato(param.codigo_contato);
  }
}

export class ConsultarContatoUseCase {
  constructor(private readonly gateway: IContatoGateway) {}

  async execute(param: ConsultarContatoParam): Promise<ContatoResult> {
    return mapearContato(await this.gateway.consultarContato(param.codigo_contato));
  }
}

export class ListarContatosUseCase {
  constructor(private readonly gateway: IContatoGateway) {}

  async execute(param: ListarContatosParam): Promise<ListarContatosResult> {
    const pagina = param.pagina ?? 1;
    const registrosPorPagina = param.registros_por_pagina ?? 50;

    const resposta = await this.gateway.listarContatosPagina({ pagina, registrosPorPagina });

    return {
      pagina: resposta.pagina,
      totalPaginas: resposta.total_de_paginas,
      totalRegistros: resposta.total_de_registros,
      contatos: aplicarFiltros(resposta.cadastros.map(mapearContato), param.filtros),
    };
  }
}
