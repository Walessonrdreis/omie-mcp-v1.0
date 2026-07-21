import { ToolDef, paramSchema, defineTool } from "../../../../tools/types.js";
import { listarPedidosComClienteParamSchema } from "../../application/dto/listar-pedidos-com-cliente.dto.js";
import { listarPedidosSepararEstoqueParamSchema } from "../../application/dto/listar-pedidos-separar-estoque.dto.js";
import { listarProdutosParaSepararParamSchema } from "../../application/dto/listar-produtos-para-separar.dto.js";
import {
  alterarPedidoParamSchema,
  chavePedidoParamSchema,
  incluirPedidoParamSchema,
} from "../../application/dto/pedido-crud.dto.js";
import { ListarPedidosComClienteUseCase } from "../../application/use-cases/listar-pedidos-com-cliente.js";
import { ListarPedidosSepararEstoqueUseCase } from "../../application/use-cases/listar-pedidos-separar-estoque.js";
import { ListarProdutosParaSepararUseCase } from "../../application/use-cases/listar-produtos-para-separar.js";
import { IncluirPedidoUseCase } from "../../application/use-cases/incluir-pedido.js";
import { AlterarPedidoUseCase } from "../../application/use-cases/alterar-pedido.js";
import { ExcluirPedidoUseCase } from "../../application/use-cases/excluir-pedido.js";
import { ConsultarPedidoUseCase } from "../../application/use-cases/consultar-pedido.js";
import { criarPedidoVendaGateway, criarClientesGateway } from "../../infrastructure/gateways/pedido-venda-gateway-factory.js";

export const pedidoVendaTools: ToolDef[] = [
  defineTool({
    name: "omie_pedido_venda_consultar",
    description:
      "Consulta um Pedido de Venda específico, com todos os itens/impostos. Método Omie: " +
      "ConsultarPedido. Identifique por codigo_pedido ou codigo_pedido_integracao.",
    inputSchema: { param: chavePedidoParamSchema },
    execute: async (client, param) => {
      const parsed = chavePedidoParamSchema.parse(param);
      const useCase = new ConsultarPedidoUseCase(criarPedidoVendaGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_pedido_venda_incluir",
    description:
      "Cria um novo Pedido de Venda. Método Omie: IncluirPedido. Precisa de codigo_cliente (o " +
      "cliente precisa ter UF preenchida no cadastro, senão a Omie recusa — teste ao vivo), " +
      "data_previsao, codigo_categoria (via omie_chamar_api resource 'geral/categorias' call " +
      "'ListarCategorias' — use uma categoria de receita), codigo_conta_corrente (via " +
      "omie_contas_correntes_listar) e itens (codigo_item_integracao, codigo_produto, " +
      "quantidade, valor_unitario). etapa (padrão '10') e codigo_parcela (padrão '000' = à vista) " +
      "são opcionais.",
    inputSchema: { param: incluirPedidoParamSchema },
    execute: async (client, param) => {
      const parsed = incluirPedidoParamSchema.parse(param);
      const useCase = new IncluirPedidoUseCase(criarPedidoVendaGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_pedido_venda_alterar",
    description:
      "Altera um Pedido de Venda existente. Método Omie: AlterarPedidoVenda. Identifique por " +
      "codigo_pedido ou codigo_pedido_integracao e reenvie os dados (mesmos campos de " +
      "omie_pedido_venda_incluir) — os itens enviados substituem os itens atuais do pedido.",
    inputSchema: { param: alterarPedidoParamSchema },
    execute: async (client, param) => {
      const parsed = alterarPedidoParamSchema.parse(param);
      const useCase = new AlterarPedidoUseCase(criarPedidoVendaGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_pedido_venda_excluir",
    description:
      "Exclui um Pedido de Venda. Método Omie: ExcluirPedido. Identifique por codigo_pedido ou " +
      "codigo_pedido_integracao. A Omie recusa se o pedido já estiver faturado.",
    inputSchema: { param: chavePedidoParamSchema },
    execute: async (client, param) => {
      const parsed = chavePedidoParamSchema.parse(param);
      const useCase = new ExcluirPedidoUseCase(criarPedidoVendaGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
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
      "expedição', etc. Suporta paginação, o filtro etapa_codigo (para outras etapas do funil de " +
      "vendas, ex: '50' Faturar) e o parâmetro genérico 'filtros' (critérios campo/operador/valor " +
      "sobre qualquer campo do item, ex: descricaoProduto, quantidade).",
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
      "esse filtro, traz pedidos de todas as etapas. Também aceita o parâmetro genérico 'filtros' " +
      "(critérios campo/operador/valor sobre qualquer campo do pedido já resolvido, ex: " +
      "'cliente.razaoSocial', 'valorTotalPedido').",
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
      "cancelado); use incluir_cancelados=true pra vê-los também. Suporta paginação e o parâmetro " +
      "genérico 'filtros' (mesmo formato de omie_pedido_venda_listar_com_cliente).",
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
