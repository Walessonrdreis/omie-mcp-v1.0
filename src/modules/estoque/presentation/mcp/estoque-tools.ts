import { ToolDef, paramSchema, defineTool } from "../../../../tools/types.js";
import { estoqueTotalProdutoParamSchema } from "../../application/dto/estoque-total-produto.dto.js";
import {
  excluirAjusteEstoqueParamSchema,
  incluirAjusteEstoqueParamSchema,
} from "../../application/dto/ajuste-estoque.dto.js";
import { ConsultarEstoqueTotalProdutoUseCase } from "../../application/use-cases/consultar-estoque-total-produto.js";
import { IncluirAjusteEstoqueUseCase } from "../../application/use-cases/incluir-ajuste-estoque.js";
import { ExcluirAjusteEstoqueUseCase } from "../../application/use-cases/excluir-ajuste-estoque.js";
import { IEstoqueGateway } from "../../domain/interfaces/estoque-gateway.js";
import { EstoqueFakeGateway } from "../../infrastructure/gateways/estoque-fake-gateway.js";
import { EstoqueOmieGateway } from "../../infrastructure/gateways/estoque-omie-gateway.js";
import { OmieClient } from "../../../../integrations/omie/omieClient.js";

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
      "produto acabado da produção, correção de inventário). Método Omie: IncluirAjusteEstoque. " +
      "Campos: id_prod, data (dd/mm/aaaa), tipo (ENT/SAI/SLD/TRF), quan, origem (AJU/PDV) e " +
      "motivo — testado ao vivo, só aceita 'INI'/'INV'/'OPE'/'PDV' (não documentado na doc " +
      "pública). ATENÇÃO (testado ao vivo): depois de QUALQUER ajuste de estoque num produto, " +
      "esse produto nunca mais pode ser excluído (a Omie mantém um 'Movimento de Estoque " +
      "(calculado)' permanente, mesmo se o ajuste for excluído depois) — avise o usuário antes " +
      "de ajustar estoque de um produto de teste/temporário.",
    inputSchema: { param: incluirAjusteEstoqueParamSchema },
    execute: async (client, param) => {
      const parsed = incluirAjusteEstoqueParamSchema.parse(param);
      const useCase = new IncluirAjusteEstoqueUseCase(criarEstoqueGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_estoque_ajuste_excluir",
    description:
      "Exclui um ajuste de estoque (pelo id_ajuste devolvido na inclusão). Método Omie: " +
      "ExcluirAjusteEstoque. ATENÇÃO: isso reverte o ajuste, mas NÃO desfaz a dependência já " +
      "criada no produto — ele continua sem poder ser excluído (ver nota em " +
      "omie_estoque_ajuste_incluir).",
    inputSchema: { param: excluirAjusteEstoqueParamSchema },
    execute: async (client, param) => {
      const parsed = excluirAjusteEstoqueParamSchema.parse(param);
      const useCase = new ExcluirAjusteEstoqueUseCase(criarEstoqueGateway(client));
      return useCase.execute(parsed);
    },
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
