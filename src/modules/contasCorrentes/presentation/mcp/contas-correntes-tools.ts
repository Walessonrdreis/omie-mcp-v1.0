import { ToolDef, paramSchema, defineTool } from "../../../../tools/types.js";

export const contasCorrentesTools: ToolDef[] = [
  defineTool({
    name: "omie_contas_correntes_listar",
    description:
      "Lista as contas correntes cadastradas (bancos, caixas, cartões, maquininhas), com código, " +
      "descrição, banco, tipo e saldo inicial registrado. Método Omie: ListarContasCorrentes " +
      "(recurso 'geral/contacorrente').",
    inputSchema: { param: paramSchema },
    resource: "geral/contacorrente",
    call: "ListarContasCorrentes",
  }),
];
