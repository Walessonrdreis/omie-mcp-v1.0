import { z } from "zod";
import { ToolDef, paramSchema, defineTool } from "../../../../tools/types.js";
import {
  alterarClienteParamSchema,
  excluirClienteParamSchema,
  incluirClienteParamSchema,
} from "../../application/dto/cliente-crud.dto.js";
import { IncluirClienteUseCase } from "../../application/use-cases/incluir-cliente.js";
import { AlterarClienteUseCase } from "../../application/use-cases/alterar-cliente.js";
import { ExcluirClienteUseCase } from "../../application/use-cases/excluir-cliente.js";
import { criarClientesGateway } from "../../infrastructure/gateways/clientes-gateway-factory.js";

const fornecedoresListarParamSchema = z.object({
  pagina: z.number().optional().describe("Página da listagem (padrão 1)."),
  registros_por_pagina: z.number().optional().describe("Registros por página (padrão 20)."),
  razao_social: z.string().optional().describe("Filtra por razão social (busca parcial)."),
  nome_fantasia: z.string().optional().describe("Filtra por nome fantasia (busca parcial)."),
  cnpj_cpf: z.string().optional().describe("Filtra por CNPJ/CPF exato."),
  apenas_ativos: z
    .boolean()
    .optional()
    .describe("Se true, remove da lista os fornecedores marcados como inativos."),
});

export const clientesFornecedoresTools: ToolDef[] = [
  defineTool({
    name: "omie_clientes_consultar",
    description:
      "Consulta o cadastro de um cliente ou fornecedor específico (razão social, nome fantasia, " +
      "CNPJ/CPF, contato, endereço) — na Omie, cliente e fornecedor usam o MESMO cadastro " +
      "('geral/clientes'), diferenciados pela tag ('Cliente'/'Fornecedor'/'Colaborador'/'Sócios', " +
      "campo 'tags'). Método Omie: ConsultarCliente.",
    inputSchema: { param: paramSchema },
    resource: "geral/clientes",
    call: "ConsultarCliente",
  }),
  defineTool({
    name: "omie_clientes_listar",
    description:
      "Lista clientes/fornecedores cadastrados, com paginação e filtros. Método Omie: " +
      "ListarClientes (recurso 'geral/clientes'). Aceita filtro avançado via 'clientesFiltro' " +
      "(ex: {\"tags\": [{\"tag\": \"Fornecedor\"}]} pra listar só fornecedores — ver também " +
      "omie_fornecedores_listar, que já vem pronto com esse filtro).",
    inputSchema: { param: paramSchema },
    resource: "geral/clientes",
    call: "ListarClientes",
  }),
  defineTool({
    name: "omie_fornecedores_listar",
    description:
      "Lista fornecedores cadastrados — atalho pra omie_clientes_listar já filtrado pela tag " +
      "'Fornecedor' (a Omie não separa cliente de fornecedor em cadastros diferentes, só por " +
      "tag). Suporta paginação e busca por razão social/nome fantasia/CNPJ-CPF, além de " +
      "apenas_ativos (remove inativos).",
    inputSchema: { param: fornecedoresListarParamSchema },
    execute: async (client, param) => {
      const parsed = fornecedoresListarParamSchema.parse(param);
      const resposta = await client.call<{
        pagina: number;
        total_de_paginas: number;
        registros: number;
        total_de_registros: number;
        clientes_cadastro: Array<Record<string, unknown> & { inativo?: string }>;
      }>({
        resource: "geral/clientes",
        call: "ListarClientes",
        param: {
          pagina: parsed.pagina ?? 1,
          registros_por_pagina: parsed.registros_por_pagina ?? 20,
          clientesFiltro: {
            tags: [{ tag: "Fornecedor" }],
            ...(parsed.razao_social ? { razao_social: parsed.razao_social } : {}),
            ...(parsed.nome_fantasia ? { nome_fantasia: parsed.nome_fantasia } : {}),
            ...(parsed.cnpj_cpf ? { cnpj_cpf: parsed.cnpj_cpf } : {}),
          },
        },
      });

      const cadastro = parsed.apenas_ativos
        ? resposta.clientes_cadastro.filter((f) => f.inativo !== "S")
        : resposta.clientes_cadastro;

      return { ...resposta, clientes_cadastro: cadastro };
    },
  }),
  defineTool({
    name: "omie_clientes_incluir",
    description:
      "Cria um novo cliente/fornecedor no cadastro (lembre: é o MESMO cadastro na Omie, " +
      "diferenciado só pela tag — use tags: [{ tag: 'Cliente' }] ou [{ tag: 'Fornecedor' }]). " +
      "Método Omie: IncluirCliente. Campos obrigatórios (testado ao vivo — a doc pública da " +
      "Omie erra ao marcar 'codigo_cliente_integracao' como opcional): codigo_cliente_integracao, " +
      "razao_social, cnpj_cpf. Opcionais comuns: nome_fantasia, email, tags, telefone, endereço.",
    inputSchema: { param: incluirClienteParamSchema },
    execute: async (client, param) => {
      const parsed = incluirClienteParamSchema.parse(param);
      const useCase = new IncluirClienteUseCase(criarClientesGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_clientes_alterar",
    description:
      "Altera um cliente/fornecedor já cadastrado. Método Omie: AlterarCliente. Identifique por " +
      "codigo_cliente_omie ou codigo_cliente_integracao, e envie os campos que devem mudar " +
      "(mesmos aceitos em omie_clientes_incluir).",
    inputSchema: { param: alterarClienteParamSchema },
    execute: async (client, param) => {
      const parsed = alterarClienteParamSchema.parse(param);
      const useCase = new AlterarClienteUseCase(criarClientesGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_clientes_excluir",
    description:
      "Exclui um cliente/fornecedor do cadastro. Método Omie: ExcluirCliente. Identifique por " +
      "codigo_cliente_omie ou codigo_cliente_integracao. A Omie recusa se já houver movimentação " +
      "(pedido, conta a pagar/receber, etc.).",
    inputSchema: { param: excluirClienteParamSchema },
    execute: async (client, param) => {
      const parsed = excluirClienteParamSchema.parse(param);
      const useCase = new ExcluirClienteUseCase(criarClientesGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
];
