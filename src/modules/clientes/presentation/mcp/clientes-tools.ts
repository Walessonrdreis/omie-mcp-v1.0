import { ToolDef, paramSchema, defineTool } from "../../../../tools/types.js";

export const clientesTools: ToolDef[] = [
  defineTool({
    name: "omie_clientes_consultar",
    description:
      "Consulta o cadastro de um cliente específico (razão social, nome fantasia, CNPJ/CPF, " +
      "contato, endereço). Método Omie: ConsultarCliente.",
    inputSchema: { param: paramSchema },
    resource: "geral/clientes",
    call: "ConsultarCliente",
  }),
];
