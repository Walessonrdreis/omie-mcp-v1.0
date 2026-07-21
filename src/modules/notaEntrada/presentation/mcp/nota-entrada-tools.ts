import { defineTool, ToolDef } from "../../../../tools/types.js";
import {
  consultarNotaEntradaParamSchema,
  listarNotaEntradaParamSchema,
} from "../../application/dto/nota-entrada.dto.js";
import { ConsultarNotaEntradaUseCase, ListarNotaEntradaUseCase } from "../../application/use-cases/nota-entrada.js";
import { criarNotaEntradaGateway } from "../../infrastructure/gateways/nota-entrada-gateway-factory.js";

export const notaEntradaTools: ToolDef[] = [
  defineTool({
    name: "omie_nota_entrada_listar",
    description:
      "Lista as notas de entrada (recebimento físico de mercadoria vinda de compra) já " +
      "registradas. Método Omie: ListarNotaEnt (recurso 'produtos/notaentrada'). SOMENTE " +
      "LEITURA — não inclui/altera nota de entrada (é lançamento fiscal/financeiro definitivo, " +
      "sem round-trip seguro de teste). Suporta paginação, filtro por data de última alteração " +
      "e o parâmetro genérico 'filtros'.",
    inputSchema: { param: listarNotaEntradaParamSchema },
    execute: async (client, param) => {
      const parsed = listarNotaEntradaParamSchema.parse(param);
      const useCase = new ListarNotaEntradaUseCase(criarNotaEntradaGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_nota_entrada_consultar",
    description:
      "Busca os detalhes completos de uma nota de entrada (itens com CFOP/NCM, valores). Método " +
      "Omie: ConsultarNotaEnt.",
    inputSchema: { param: consultarNotaEntradaParamSchema },
    execute: async (client, param) => {
      const parsed = consultarNotaEntradaParamSchema.parse(param);
      const useCase = new ConsultarNotaEntradaUseCase(criarNotaEntradaGateway(client));
      return useCase.execute(parsed);
    },
  }),
];
