import { ToolDef, paramSchema, defineTool } from "../../../../tools/types.js";
import { listarProdutosParaSepararParamSchema } from "../../application/dto/listar-produtos-para-separar.dto.js";
import { ListarProdutosParaSepararUseCase } from "../../application/use-cases/listar-produtos-para-separar.js";
import { PedidoVendaOmieGateway } from "../../infrastructure/gateways/pedido-venda-omie-gateway.js";

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
      const gateway = new PedidoVendaOmieGateway(client);
      const useCase = new ListarProdutosParaSepararUseCase(gateway);
      return useCase.execute(parsed);
    },
  }),
];
