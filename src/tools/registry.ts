import { OmieClient } from "../omieClient.js";
import { ToolDef } from "./types.js";
import { comprasTools } from "./compras.js";
import { contasPagarModuleTools } from "../modules/contasPagar/index.js";
import { estoqueModuleTools } from "../modules/estoque/index.js";
import { produtosModuleTools } from "../modules/produtos/index.js";
import { ordemProducaoModuleTools } from "../modules/ordemProducao/index.js";
import { pedidoVendaModuleTools } from "../modules/pedidoVenda/index.js";
import { clientesFornecedoresModuleTools } from "../modules/clientesFornecedores/index.js";
import { contasCorrentesModuleTools } from "../modules/contasCorrentes/index.js";
import { fluxoCaixaModuleTools } from "../modules/fluxoCaixa/index.js";

/**
 * Ponto único de agregação de todas as ferramentas MCP do servidor. Para
 * adicionar um novo módulo (financeiro, CRM, vendas, NF-e, etc.):
 *
 * - Se for passthrough simples (resource + call fixos): crie
 *   `src/tools/<modulo>.ts` exportando um array de `ToolDef` e
 *   importe/concatene aqui.
 * - Se precisar de lógica própria (agregar/combinar chamadas Omie, ex:
 *   estoque total por produto): crie `src/modules/<modulo>/` com as camadas
 *   application/infrastructure/presentation (ver src/modules/estoque como
 *   referência) e importe o array de tools exportado pelo módulo.
 *
 * Em ambos os casos, nenhuma outra parte do servidor (src/index.ts) precisa
 * mudar — o registro é genérico via `handleToolCall`.
 */
export const allTools: ToolDef[] = [
  ...ordemProducaoModuleTools,
  ...produtosModuleTools,
  ...estoqueModuleTools,
  ...pedidoVendaModuleTools,
  ...clientesFornecedoresModuleTools,
  ...contasCorrentesModuleTools,
  ...fluxoCaixaModuleTools,
  ...comprasTools,
  ...contasPagarModuleTools,
];

export async function handleToolCall(
  client: OmieClient,
  toolName: string,
  args: { param?: Record<string, unknown> }
) {
  const tool = allTools.find((t) => t.name === toolName);
  if (!tool) {
    throw new Error(`Ferramenta desconhecida: ${toolName}`);
  }

  if (tool.execute) {
    return tool.execute(client, args.param ?? {});
  }

  return client.call({
    resource: tool.resource,
    call: tool.call,
    param: args.param ?? {},
  });
}
