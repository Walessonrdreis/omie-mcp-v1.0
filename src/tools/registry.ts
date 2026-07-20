import { OmieClient } from "../omieClient.js";
import { ToolDef } from "./types.js";
import { producaoTools } from "./producao.js";
import { produtosTools } from "./produtos.js";
import { estoqueTools } from "./estoque.js";
import { comprasTools } from "./compras.js";

/**
 * Ponto único de agregação de todas as ferramentas "diretas" (resource + call
 * fixos, param repassado à Omie). Para adicionar um novo módulo (financeiro,
 * CRM, vendas, NF-e, etc.), basta criar um arquivo `src/tools/<modulo>.ts`
 * exportando um array de `ToolDef` e importá-lo/concatená-lo aqui — nenhuma
 * outra parte do servidor (src/index.ts) precisa mudar.
 */
export const allTools: ToolDef[] = [
  ...producaoTools,
  ...produtosTools,
  ...estoqueTools,
  ...comprasTools,
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
  return client.call({
    resource: tool.resource,
    call: tool.call,
    param: args.param ?? {},
  });
}
