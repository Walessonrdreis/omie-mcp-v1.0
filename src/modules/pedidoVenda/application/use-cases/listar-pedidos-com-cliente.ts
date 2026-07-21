import { IClientesGateway } from "../../../clientesFornecedores/domain/interfaces/clientes-gateway.js";
import { aplicarFiltros } from "../../../../shared/filtro.js";
import { IPedidoVendaGateway } from "../../domain/interfaces/pedido-venda-gateway.js";
import {
  ListarPedidosComClienteParam,
  ListarPedidosComClienteResult,
  PedidoComCliente,
} from "../dto/listar-pedidos-com-cliente.dto.js";

/**
 * A Omie não entrega a lista de pedidos pronta pra leitura: `ListarPedidos`
 * só devolve `codigo_cliente` (sem nome) e `etapa` como código cru. Esse
 * use-case busca a página de pedidos e resolve nome do cliente (cruzando com
 * `ClientesOmieGateway`, do módulo `clientes`) e descrição da etapa
 * (catálogo fixo, via `PedidoVendaOmieGateway`), devolvendo cada pedido já
 * pronto pra leitura, num único resultado.
 */
export class ListarPedidosComClienteUseCase {
  constructor(
    private readonly pedidoGateway: IPedidoVendaGateway,
    private readonly clientesGateway: IClientesGateway
  ) {}

  async execute(param: ListarPedidosComClienteParam): Promise<ListarPedidosComClienteResult> {
    const pagina = param.pagina ?? 1;
    const registrosPorPagina = param.registros_por_pagina ?? 20;

    const [pedidosResposta, mapaEtapas] = await Promise.all([
      this.pedidoGateway.listarPedidosPagina(pagina, registrosPorPagina, param.etapa_codigo),
      this.pedidoGateway.mapaEtapasVendaProduto(),
    ]);

    const codigosCliente = pedidosResposta.pedido_venda_produto.map(
      (pedido) => pedido.cabecalho.codigo_cliente
    );
    const clientesPorCodigo = await this.clientesGateway.consultarClientesPorCodigo(
      codigosCliente
    );

    let pedidos: PedidoComCliente[] = pedidosResposta.pedido_venda_produto.map((pedido) => {
      const cliente = clientesPorCodigo.get(pedido.cabecalho.codigo_cliente);
      return {
        numeroPedido: pedido.cabecalho.numero_pedido,
        codigoPedido: pedido.cabecalho.codigo_pedido,
        cliente: {
          codigo: pedido.cabecalho.codigo_cliente,
          razaoSocial: cliente?.razao_social ?? "(cliente não encontrado)",
          nomeFantasia: cliente?.nome_fantasia ?? "",
        },
        dataPrevisao: pedido.cabecalho.data_previsao,
        etapaCodigo: pedido.cabecalho.etapa,
        etapaDescricao: mapaEtapas.get(pedido.cabecalho.etapa),
        cancelado: pedido.infoCadastro.cancelado === "S",
        faturado: pedido.infoCadastro.faturado === "S",
        quantidadeItens: pedido.cabecalho.quantidade_itens,
        valorTotalPedido: pedido.total_pedido.valor_total_pedido,
        itens: pedido.det.map((item) => ({
          codigoProduto: item.produto.codigo_produto,
          codigoSku: item.produto.codigo,
          descricaoProduto: item.produto.descricao,
          quantidade: item.produto.quantidade,
          unidade: item.produto.unidade,
        })),
      };
    });

    pedidos = aplicarFiltros(pedidos, param.filtros);

    return {
      pagina: pedidosResposta.pagina,
      totalPaginas: pedidosResposta.total_de_paginas,
      totalRegistros: pedidosResposta.total_de_registros,
      pedidos,
    };
  }
}
