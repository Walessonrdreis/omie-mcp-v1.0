import {
  ICadastrosAuxiliaresGateway,
  ListarBancosParams,
  ListarBancosResponse,
  ListarCidadesParams,
  ListarCidadesResponse,
  ListarNCMParams,
  ListarNCMResponse,
  ListarPaisesParams,
  ListarPaisesResponse,
  UnidadeOmie,
} from "../../domain/interfaces/cadastros-auxiliares-gateway.js";

export class CadastrosAuxiliaresFakeGateway implements ICadastrosAuxiliaresGateway {
  async listarBancos(params: ListarBancosParams): Promise<ListarBancosResponse> {
    return {
      pagina: params.pagina,
      total_de_paginas: 1,
      registros: 1,
      total_de_registros: 1,
      fin_banco_cadastro: [{ codigo: "001", nome: "Banco do Brasil (fake)", tipo: "CB" }],
    };
  }

  async listarCidades(params: ListarCidadesParams): Promise<ListarCidadesResponse> {
    return {
      pagina: params.pagina,
      total_de_paginas: 1,
      registros: 1,
      total_de_registros: 1,
      lista_cidades: [{ cCod: "BRASILIA (DF)", cNome: "Brasília (fake)", cUF: "DF", nCodIBGE: "5300108" }],
    };
  }

  async listarPaises(): Promise<ListarPaisesResponse> {
    return { lista_paises: [{ cCodigo: "1058", cCodigoISO: "BR", cDescricao: "Brasil (fake)" }] };
  }

  async listarNCM(params: ListarNCMParams): Promise<ListarNCMResponse> {
    return {
      nPagina: params.pagina,
      nTotPaginas: 1,
      nRegistros: 1,
      nTotRegistros: 1,
      listaNCM: [{ cCodigo: "0000.00.00", cDescricao: "Produto não catalogado (fake)" }],
    };
  }

  async consultarUnidade(codigo: string): Promise<UnidadeOmie> {
    return { codigo, descricao: `Unidade ${codigo} (fake)` };
  }
}
