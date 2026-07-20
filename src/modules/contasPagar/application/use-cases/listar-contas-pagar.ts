import { IClientesGateway } from "../../../clientesFornecedores/domain/interfaces/clientes-gateway.js";
import { IContasPagarGateway } from "../../domain/interfaces/contas-pagar-gateway.js";
import {
  ListarContasPagarParam,
  ListarContasPagarResult,
  ContaPagar,
} from "../dto/listar-contas-pagar.dto.js";

/**
 * A Omie devolve `codigo_cliente_fornecedor` (número) sem o nome do
 * fornecedor. Este use-case busca a página de contas, resolve o nome do
 * fornecedor (reaproveitando `ClientesOmieGateway`, do módulo `clientes`) e
 * devolve cada conta já pronta pra leitura.
 */
export class ListarContasPagarUseCase {
  constructor(
    private readonly contasGateway: IContasPagarGateway,
    private readonly clientesGateway: IClientesGateway
  ) {}

  async execute(param: ListarContasPagarParam): Promise<ListarContasPagarResult> {
    const pagina = param.pagina ?? 1;
    const registrosPorPagina = param.registros_por_pagina ?? 20;

    const resposta = await this.contasGateway.listarPagina(
      pagina,
      registrosPorPagina,
      param.data_alteracao_de,
      param.data_alteracao_ate
    );

    const codigosFornecedor = resposta.conta_pagar_cadastro.map(
      (c) => c.codigo_cliente_fornecedor
    );
    const fornecedoresPorCodigo = await this.clientesGateway.consultarClientesPorCodigo(
      codigosFornecedor
    );

    const contas: ContaPagar[] = resposta.conta_pagar_cadastro.map((conta) => {
      const fornecedor = fornecedoresPorCodigo.get(conta.codigo_cliente_fornecedor);
      return {
        codigoLancamento: conta.codigo_lancamento_omie,
        fornecedor: {
          codigo: conta.codigo_cliente_fornecedor,
          razaoSocial: fornecedor?.razao_social ?? "(fornecedor não encontrado)",
          nomeFantasia: fornecedor?.nome_fantasia ?? "",
        },
        dataVencimento: conta.data_vencimento,
        valor: conta.valor_documento,
        status: conta.status_titulo,
        documentoFiscal: conta.numero_documento_fiscal,
        categoria: conta.codigo_categoria,
        observacao: conta.observacao,
      };
    });

    return {
      pagina: resposta.pagina,
      totalPaginas: resposta.total_de_paginas,
      totalRegistros: resposta.total_de_registros,
      contas,
    };
  }
}