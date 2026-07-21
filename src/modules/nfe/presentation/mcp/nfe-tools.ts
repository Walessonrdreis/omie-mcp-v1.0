import { defineTool, ToolDef } from "../../../../tools/types.js";
import { consultarNfeParamSchema, listarNfeParamSchema } from "../../application/dto/nfe.dto.js";
import { ListarNfeUseCase } from "../../application/use-cases/listar-nfe.js";
import { ConsultarNfeUseCase } from "../../application/use-cases/consultar-nfe.js";
import { criarNfeGateway } from "../../infrastructure/gateways/nfe-gateway-factory.js";

export const nfeTools: ToolDef[] = [
  defineTool({
    name: "omie_nfe_listar",
    description:
      "Lista notas fiscais (NF-e) já emitidas/registradas na Omie, com resumo (número, série, " +
      "chave, cliente, valor total, cancelada ou não). Método Omie: ListarNF (recurso " +
      "'nfconsultar'). Suporta paginação (pagina/registros_por_pagina, padrão 50), filtro por " +
      "período de emissão (data_de/data_ate, dd/mm/aaaa), por status (apenas_canceladas), por " +
      "tipo (entrada/saida) e o parâmetro genérico 'filtros' sobre qualquer campo do resumo " +
      "(ex: cliente, valorTotal). Este módulo é SOMENTE LEITURA — não emite nem cancela nota " +
      "fiscal (documento com efeito legal, sem round-trip seguro de teste).",
    inputSchema: { param: listarNfeParamSchema },
    execute: async (client, param) => {
      const parsed = listarNfeParamSchema.parse(param);
      const useCase = new ListarNfeUseCase(criarNfeGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_nfe_consultar",
    description:
      "Consulta o detalhe completo de uma nota fiscal (NF-e) específica: itens (descrição, NCM, " +
      "CFOP, quantidade, valores), títulos financeiros gerados pela nota, e dados de emissão. " +
      "Método Omie: ConsultarNF. Informe 'chave' (chave de acesso de 44 dígitos) OU 'codigo' " +
      "(código interno da nota na Omie, nIdNF) — um dos dois é obrigatório.",
    inputSchema: { param: consultarNfeParamSchema },
    execute: async (client, param) => {
      const parsed = consultarNfeParamSchema.parse(param);
      const useCase = new ConsultarNfeUseCase(criarNfeGateway(client));
      return useCase.execute(parsed);
    },
  }),
];
