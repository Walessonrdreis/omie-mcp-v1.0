import { defineTool, ToolDef } from "../../../../tools/types.js";
import { OmieClient } from "../../../../integrations/omie/omieClient.js";
import {
  alterarCategoriaParamSchema,
  consultarCategoriaParamSchema,
  incluirCategoriaParamSchema,
  listarCategoriasParamSchema,
} from "../../application/dto/categoria.dto.js";
import {
  alterarDepartamentoParamSchema,
  consultarDepartamentoParamSchema,
  excluirDepartamentoParamSchema,
  incluirDepartamentoParamSchema,
  listarDepartamentosParamSchema,
} from "../../application/dto/departamento.dto.js";
import {
  AlterarCategoriaUseCase,
  ConsultarCategoriaUseCase,
  IncluirCategoriaUseCase,
  ListarCategoriasUseCase,
} from "../../application/use-cases/categoria-crud.js";
import {
  AlterarDepartamentoUseCase,
  ConsultarDepartamentoUseCase,
  ExcluirDepartamentoUseCase,
  IncluirDepartamentoUseCase,
  ListarDepartamentosUseCase,
} from "../../application/use-cases/departamento-crud.js";
import { ICategoriaGateway } from "../../domain/interfaces/categoria-gateway.js";
import { IDepartamentoGateway } from "../../domain/interfaces/departamento-gateway.js";
import { CategoriaFakeGateway } from "../../infrastructure/gateways/categoria-fake-gateway.js";
import { CategoriaOmieGateway } from "../../infrastructure/gateways/categoria-omie-gateway.js";
import { DepartamentoFakeGateway } from "../../infrastructure/gateways/departamento-fake-gateway.js";
import { DepartamentoOmieGateway } from "../../infrastructure/gateways/departamento-omie-gateway.js";

function criarCategoriaGateway(client: OmieClient): ICategoriaGateway {
  return process.env.OMIE_MOCK === "true" ? new CategoriaFakeGateway() : new CategoriaOmieGateway(client);
}
function criarDepartamentoGateway(client: OmieClient): IDepartamentoGateway {
  return process.env.OMIE_MOCK === "true" ? new DepartamentoFakeGateway() : new DepartamentoOmieGateway(client);
}

export const categoriasDepartamentosTools: ToolDef[] = [
  defineTool({
    name: "omie_categoria_incluir",
    description:
      "Cria uma nova categoria financeira, como filha de uma categoria pai já existente. Método " +
      "Omie: IncluirCategoria (recurso 'geral/categorias'). Testado ao vivo: você informa o " +
      "código da categoria PAI ('categoria_superior', ex: '2.09') e a Omie GERA e devolve o " +
      "código da nova categoria filha (ex: '2.09.04') — não é você quem escolhe o código. " +
      "⚠️ IMPORTANTE, testado ao vivo: não existe exclusão de categoria na API, e tentar " +
      "'inativar' via alterar (campo conta_inativa) não teve efeito real — categorias criadas " +
      "ficam permanentemente ativas na conta. Confirme antes de criar.",
    inputSchema: { param: incluirCategoriaParamSchema },
    execute: async (client, param) => {
      const parsed = incluirCategoriaParamSchema.parse(param);
      const useCase = new IncluirCategoriaUseCase(criarCategoriaGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_categoria_alterar",
    description: "Altera a descrição de uma categoria já existente. Método Omie: AlterarCategoria.",
    inputSchema: { param: alterarCategoriaParamSchema },
    execute: async (client, param) => {
      const parsed = alterarCategoriaParamSchema.parse(param);
      const useCase = new AlterarCategoriaUseCase(criarCategoriaGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_categoria_consultar",
    description: "Busca os detalhes de uma categoria financeira. Método Omie: ConsultarCategoria.",
    inputSchema: { param: consultarCategoriaParamSchema },
    execute: async (client, param) => {
      const parsed = consultarCategoriaParamSchema.parse(param);
      const useCase = new ConsultarCategoriaUseCase(criarCategoriaGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_categoria_listar",
    description:
      "Lista as categorias financeiras cadastradas (plano de categorias usado em contas a " +
      "pagar/receber, fluxo de caixa, DRE). Método Omie: ListarCategorias. Suporta paginação e o " +
      "parâmetro genérico 'filtros'.",
    inputSchema: { param: listarCategoriasParamSchema },
    execute: async (client, param) => {
      const parsed = listarCategoriasParamSchema.parse(param);
      const useCase = new ListarCategoriasUseCase(criarCategoriaGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_departamento_incluir",
    description:
      "Cria um novo departamento/centro de custo, como filho de um departamento pai já " +
      "existente. Método Omie: IncluirDepartamento (recurso 'geral/departamentos'). Testado ao " +
      "vivo: 'codigo_pai' é o código do departamento ONDE incluir o novo (não o código do novo " +
      "departamento) — a Omie gera e devolve o código do filho na resposta.",
    inputSchema: { param: incluirDepartamentoParamSchema },
    execute: async (client, param) => {
      const parsed = incluirDepartamentoParamSchema.parse(param);
      const useCase = new IncluirDepartamentoUseCase(criarDepartamentoGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_departamento_alterar",
    description: "Altera a descrição de um departamento já existente. Método Omie: AlterarDepartamento.",
    inputSchema: { param: alterarDepartamentoParamSchema },
    execute: async (client, param) => {
      const parsed = alterarDepartamentoParamSchema.parse(param);
      const useCase = new AlterarDepartamentoUseCase(criarDepartamentoGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_departamento_excluir",
    description:
      "Remove um departamento/centro de custo. Método Omie: ExcluirDepartamento. Diferente de " +
      "Categoria, testado ao vivo que a exclusão funciona de verdade, sem deixar rastro.",
    inputSchema: { param: excluirDepartamentoParamSchema },
    execute: async (client, param) => {
      const parsed = excluirDepartamentoParamSchema.parse(param);
      const useCase = new ExcluirDepartamentoUseCase(criarDepartamentoGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_departamento_consultar",
    description: "Busca os detalhes de um departamento/centro de custo. Método Omie: ConsultarDepartamento.",
    inputSchema: { param: consultarDepartamentoParamSchema },
    execute: async (client, param) => {
      const parsed = consultarDepartamentoParamSchema.parse(param);
      const useCase = new ConsultarDepartamentoUseCase(criarDepartamentoGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_departamento_listar",
    description:
      "Lista os departamentos/centros de custo cadastrados (estrutura hierárquica). Método Omie: " +
      "ListarDepartamentos. Suporta paginação e o parâmetro genérico 'filtros'.",
    inputSchema: { param: listarDepartamentosParamSchema },
    execute: async (client, param) => {
      const parsed = listarDepartamentosParamSchema.parse(param);
      const useCase = new ListarDepartamentosUseCase(criarDepartamentoGateway(client));
      return useCase.execute(parsed);
    },
  }),
];
