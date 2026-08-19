import { z } from "zod";
import { OmieClient } from "../integrations/omie/omieClient.js";

/**
 * Ferramenta genérica que permite chamar QUALQUER endpoint da API Omie,
 * cobrindo todos os módulos além do Chão de Fábrica (financeiro, CRM,
 * vendas, NF-e, serviços, estoque, cadastros, etc.), sem precisar
 * implementar uma tool específica para cada um dos ~150 métodos da Omie.
 *
 * Lista completa de recursos/módulos disponíveis: https://developer.omie.com.br/service-list/
 */
export const genericToolDefinition = {
  name: "omie_chamar_api",
  description:
    "Chama qualquer endpoint da API da Omie (ERP), permitindo acessar todos os módulos: " +
    "Geral (clientes, fornecedores, projetos), CRM, Finanças (contas a pagar/receber, extrato), " +
    "Compras/Estoque/Produção (produtos, estrutura, ordens de produção, estoque), " +
    "Vendas e NF-e, Serviços e NFS-e, Painel do Contador, entre outros. " +
    "Use quando não houver uma ferramenta específica (omie_op_*, omie_estrutura_*, etc.) " +
    "para a operação desejada. Consulte https://developer.omie.com.br/service-list/ para " +
    "descobrir o 'resource' (caminho do módulo) e o 'call' (nome do método) corretos.",
  inputSchema: {
    resource: z
      .string()
      .describe(
        "Caminho do módulo/recurso da Omie, ex: 'produtos/op', 'geral/clientes', " +
          "'financas/contapagar', 'estoque/consulta', 'produtos/malha'."
      ),
    call: z
      .string()
      .describe(
        "Nome do método da API Omie a ser chamado, ex: 'IncluirOrdemProducao', " +
          "'ListarClientes', 'IncluirContaPagar', 'ConsultarEstrutura'."
      ),
    param: z
      .record(z.string(), z.unknown())
      .optional()
      .describe("Objeto com os parâmetros exigidos pelo método (conforme documentação Omie)."),
  },
};

export async function handleGenericCall(
  client: OmieClient,
  args: { resource: string; call: string; param?: Record<string, unknown> }
) {
  const result = await client.call({
    resource: args.resource,
    call: args.call,
    param: args.param ?? {},
  });
  return result;
}
