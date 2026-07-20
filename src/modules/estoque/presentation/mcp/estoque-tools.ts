import { ToolDef, paramSchema, defineTool } from "../../../../tools/types.js";
import { estoqueTotalProdutoParamSchema } from "../../application/dto/estoque-total-produto.dto.js";
import { ConsultarEstoqueTotalProdutoUseCase } from "../../application/use-cases/consultar-estoque-total-produto.js";
import { EstoqueOmieGateway } from "../../infrastructure/gateways/estoque-omie-gateway.js";

export const estoqueTools: ToolDef[] = [
  defineTool({
    name: "omie_estoque_ajuste_incluir",
    description:
      "Registra um ajuste/movimentação manual de estoque (ex: consumo de insumos, entrada de " +
      "produto acabado da produção). Método Omie: IncluirAjusteEstoque.",
    inputSchema: { param: paramSchema },
    resource: "estoque/ajuste",
    call: "IncluirAjusteEstoque",
  }),
  defineTool({
    name: "omie_estoque_movimentos_listar",
    description:
      "Lista os movimentos de estoque (entradas/saídas) de um produto em um período, por local de " +
      "estoque. Método Omie: ListarMovimentos (recurso 'estoque/movestoque').",
    inputSchema: { param: paramSchema },
    resource: "estoque/movestoque",
    call: "ListarMovimentos",
  }),
  defineTool({
    name: "omie_estoque_total_produto",
    description:
      "Calcula o estoque TOTAL de um produto, somando a posição física (e saldo/reservado) em " +
      "TODOS os locais de estoque cadastrados na Omie. A Omie não expõe esse total pronto — só " +
      "posições por local, paginadas — então esta ferramenta busca todas as páginas e consolida. " +
      "Use quando o usuário perguntar 'quanto tenho no total desse produto', sem se referir a um " +
      "local específico.",
    inputSchema: { param: estoqueTotalProdutoParamSchema },
    execute: async (client, param) => {
      const { codigo_produto } = estoqueTotalProdutoParamSchema.parse(param);
      const gateway = new EstoqueOmieGateway(client);
      const useCase = new ConsultarEstoqueTotalProdutoUseCase(gateway);
      return useCase.execute(codigo_produto);
    },
  }),
];
