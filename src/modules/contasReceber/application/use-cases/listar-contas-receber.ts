import { ClientesOmieGateway } from "../../../clientesFornecedores/infrastructure/gateways/clientes-omie-gateway.js";
import { ContasReceberOmieGateway } from "../../infrastructure/gateways/contas-receber-omie-gateway.js";
import {
  ListarContasReceberParam,
  ListarContasReceberResult,
  ContaReceber,
} from "../dto/listar-contas-receber.dto.js";

/**
 * A Omie devolve `codigo_cliente_fornecedor` (número) sem o nome do
 * cliente. Este use-case busca a página de contas a receber, resolve o
 * nome do cliente (reaproveitando `ClientesOmieGateway`, do módulo
 * `clientes`) e devolve cada conta já pronta pra leitura.
 */
export class ListarContasReceberUseCase {
  constructor(
    private readonly contasGateway: ContasReceberOmieGateway,
    private readonly clientesGateway: ClientesOmieGateway
  ) {}

  async execute(param: ListarContasReceberParam): Promise<ListarContasReceberResult> {
    const pagina = param.pagina ?? 1;
    const registrosPorPagina = param.registros_por_pagina ?? 20;

    const resposta = await this.contasGateway.listarPagina(
      pagina,
      registrosPorPagina,
      param.data_alteracao_de,
      param.data_alteracao_ate
    );

    const codigosCliente = resposta.conta_receber_cadastro.map(
      (c) => c.codigo_cliente_fornecedor
    );
    const clientesPorCodigo = await this.clientesGateway.consultarClientesPorCodigo(
      codigosCliente
    );

    const contas: ContaReceber[] = resposta.conta_receber_cadastro.map((conta) => {
      const cliente = clientesPorCodigo.get(conta.codigo_cliente_fornecedor);
      return {
        codigoLancamento: conta.codigo_lancamento_omie,
        cliente: {
          codigo: conta.codigo_cliente_fornecedor,
          razaoSocial: cliente?.razao_social ?? "(cliente não encontrado)",
          nomeFantasia: cliente?.nome_fantasia ?? "",
        },
        dataVencimento: conta.data_vencimento,
        valor: conta.valor_documento,
        status: conta.status_titulo,
        documentoFiscal: conta.numero_documento_fiscal,
        numeroPedido: conta.numero_pedido,
        categoria: conta.codigo_categoria,
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