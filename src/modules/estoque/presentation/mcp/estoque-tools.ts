import { ToolDef, paramSchema, defineTool } from "../../../../tools/types.js";
import { estoqueTotalProdutoParamSchema } from "../../application/dto/estoque-total-produto.dto.js";
import { ConsultarEstoqueTotalProdutoUseCase } from "../../application/use-cases/consultar-estoque-total-produto.js";
import { IEstoqueGateway } from "../../domain/interfaces/estoque-gateway.js";
import { EstoqueFakeGateway } from "../../infrastructure/gateways/estoque-fake-gateway.js";
import { EstoqueOmieGateway } from "../../infrastructure/gateways/estoque-omie-gateway.js";
import { OmieClient } from "../../../../omieClient.js";

function criarEstoqueGateway(client: OmieClient): IEstoqueGateway {
  return process.env.OMIE_MOCK === "true"
    ? new EstoqueFakeGateway()
    : new EstoqueOmieGateway(client);
}

export const estoqueTools: ToolDef[] = [
  defineTool({
    name: "omie_estoque_ajuste_incluir",
    description:
      "Registra um ajuste/movimentação manual de estoque (ex: consumo de insumos, entrada de " +
      "produto acabado da produção). Método Omie: IncluirAjusteEstoque.",
    inputSchema: { param: paramSchema },
    resource: "estoque/ajuste",
    call: "IncluirAjusteEstoque",
    destructive: true,
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
      const gateway = criarEstoqueGateway(client);
      const useCase = new ConsultarEstoqueTotalProdutoUseCase(gateway);
      return useCase.execute(codigo_produto);
    },
  }),
];
