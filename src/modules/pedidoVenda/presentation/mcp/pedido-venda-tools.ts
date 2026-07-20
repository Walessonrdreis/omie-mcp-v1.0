import { ToolDef, paramSchema, defineTool } from "../../../../tools/types.js";
import { OmieClient } from "../../../../omieClient.js";
import { IClientesGateway } from "../../../clientesFornecedores/domain/interfaces/clientes-gateway.js";
import { ClientesFakeGateway } from "../../../clientesFornecedores/infrastructure/gateways/clientes-fake-gateway.js";
import { ClientesOmieGateway } from "../../../clientesFornecedores/infrastructure/gateways/clientes-omie-gateway.js";
import { listarPedidosComClienteParamSchema } from "../../application/dto/listar-pedidos-com-cliente.dto.js";
import { listarPedidosSepararEstoqueParamSchema } from "../../application/dto/listar-pedidos-separar-estoque.dto.js";
import { listarProdutosParaSepararParamSchema } from "../../application/dto/listar-produtos-para-separar.dto.js";
import { ListarPedidosComClienteUseCase } from "../../application/use-cases/listar-pedidos-com-cliente.js";
import { ListarPedidosSepararEstoqueUseCase } from "../../application/use-cases/listar-pedidos-separar-estoque.js";
import { ListarProdutosParaSepararUseCase } from "../../application/use-cases/listar-produtos-para-separar.js";
import { IPedidoVendaGateway } from "../../domain/interfaces/pedido-venda-gateway.js";
import { PedidoVendaFakeGateway } from "../../infrastructure/gateways/pedido-venda-fake-gateway.js";
import { PedidoVendaOmieGateway } from "../../infrastructure/gateways/pedido-venda-omie-gateway.js";

function criarPedidoVendaGateway(client: OmieClient): IPedidoVendaGateway {
  return process.env.OMIE_MOCK === "true"
    ? new PedidoVendaFakeGateway()
    : new PedidoVendaOmieGateway(client);
}

function criarClientesGateway(client: OmieClient): IClientesGateway {
  return process.env.OMIE_MOCK === "true"
    ? new ClientesFakeGateway()
    : new ClientesOmieGateway(client);
}

export const pedidoVendaTools: ToolDef[] = [
  defineTool({
    name: "omie_pedido_venda_consultar",
    description:
      "Consulta um Pedido de Venda específico, com todos os itens/impostos. Método Omie: " +
      "ConsultarPedido.",
    inputSchema: { param: paramSchema },
    resource: "produtos/pedido",
    call: "ConsultarPedido",
  }),
  defineTool({
    name: "omie_pedido_venda_listar",
    description:
      "Lista Pedidos de Venda cadastrados, com paginação e filtros (aceita filtro 'etapa', ex: " +
      "'20' = Separar Estoque). Método Omie: ListarPedidos. Atenção: pedidos CANCELADOS não têm a " +
      "etapa resetada pela Omie — sempre cheque infoCadastro.cancelado antes de considerar um " +
      "pedido como realmente naquela etapa. Para já vir filtrado e resumido por produto, use " +
      "omie_pedido_venda_produtos_para_separar.",
    inputSchema: { param: paramSchema },
    resource: "produtos/pedido",
    call: "ListarPedidos",
  }),
  defineTool({
    name: "omie_pedido_venda_etapas_listar",
    description:
      "Lista o catálogo de etapas de faturamento da Omie (kanban de vendas, OS, compras, etc.), " +
      "com código e descrição de cada etapa por tipo de operação. Método Omie: " +
      "ListarEtapasFaturamento (recurso 'produtos/etapafat'). Diferente da etapa de Ordem de " +
      "Produção (configurável por conta, sem tradução via API), essas etapas são um catálogo fixo " +
      "e documentado pela Omie.",
    inputSchema: { param: paramSchema },
    resource: "produtos/etapafat",
    call: "ListarEtapasFaturamento",
  }),
  defineTool({
    name: "omie_pedido_venda_produtos_para_separar",
    description:
      "Lista os produtos que precisam ser separados do estoque para despacho: busca os Pedidos de " +
      "Venda na etapa 'Separar Estoque' (código '20' por padrão, catálogo fixo da Omie), remove os " +
      "cancelados (a Omie não reseta a etapa de pedidos cancelados) e devolve, por item de pedido, " +
      "o produto (código/SKU/descrição/quantidade — já vem no próprio pedido, sem cruzar outro " +
      "endpoint) e um resumo agregado por produto (quantidade total a separar, em quantos pedidos). " +
      "Use quando o usuário perguntar 'quais produtos preciso separar', 'o que tá pendente de " +
      "expedição', etc. Suporta paginação e o filtro etapa_codigo (para outras etapas do funil de " +
      "vendas, ex: '50' Faturar).",
    inputSchema: { param: listarProdutosParaSepararParamSchema },
    execute: async (client, param) => {
      const parsed = listarProdutosParaSepararParamSchema.parse(param);
      const gateway = criarPedidoVendaGateway(client);
      const useCase = new ListarProdutosParaSepararUseCase(gateway);
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_pedido_venda_listar_com_cliente",
    description:
      "Lista Pedidos de Venda JÁ com o nome do cliente (razão social/nome fantasia), a etapa por " +
      "extenso e os ITENS de cada pedido (produto/SKU/descrição/quantidade/unidade) resolvidos — " +
      "a Omie só devolve o código do cliente e o código cru da etapa na listagem crua. Também " +
      "expõe 'cancelado' e 'faturado' já como booleano, e o valor total do pedido. Suporta " +
      "paginação e o filtro opcional etapa_codigo (ex: '20' Separar Estoque, '50' Faturar); sem " +
      "esse filtro, traz pedidos de todas as etapas.",
    inputSchema: { param: listarPedidosComClienteParamSchema },
    execute: async (client, param) => {
      const parsed = listarPedidosComClienteParamSchema.parse(param);
      const pedidoGateway = criarPedidoVendaGateway(client);
      const clientesGateway = criarClientesGateway(client);
      const useCase = new ListarPedidosComClienteUseCase(pedidoGateway, clientesGateway);
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_pedido_venda_separar_estoque_listar",
    description:
      "Atalho pro relatório que precisa ser acompanhado com mais frequência: pedidos na etapa " +
      "'Separar Estoque' (código '20', fixo), já com cliente, os ITENS de cada pedido " +
      "(produto/SKU/descrição/quantidade/unidade) e valor total resolvidos — mesmo formato de " +
      "omie_pedido_venda_listar_com_cliente, mas sem precisar passar etapa_codigo toda vez. Os " +
      "pedidos cancelados são removidos por padrão (a Omie não reseta a etapa de um pedido " +
      "cancelado); use incluir_cancelados=true pra vê-los também. Suporta paginação.",
    inputSchema: { param: listarPedidosSepararEstoqueParamSchema },
    execute: async (client, param) => {
      const parsed = listarPedidosSepararEstoqueParamSchema.parse(param);
      const pedidoGateway = criarPedidoVendaGateway(client);
      const clientesGateway = criarClientesGateway(client);
      const listarComClienteUseCase = new ListarPedidosComClienteUseCase(
        pedidoGateway,
        clientesGateway
      );
      const useCase = new ListarPedidosSepararEstoqueUseCase(listarComClienteUseCase);
      return useCase.execute(parsed);
    },
  }),
];
