import { z } from "zod";
import {
  collectOrdemProducao,
  translateOrdemProducao,
  OmieHttpClientReal,
  consultarOrdensProducao,
  type FiltrosOrdensProducao,
} from "omie-data";
import { ToolDef, paramSchema, defineTool } from "../../../../tools/types.js";
import { aplicarFiltros } from "../../../../shared/filtro.js";
import { abrirBancoAtivo, credenciaisOmieOuFalha } from "../../infrastructure/cache/op-cache.js";
import {
  listarOpsComProdutoParamSchema,
  type OrdemProducaoComProduto,
} from "../../application/dto/listar-ops-com-produto.dto.js";
import {
  alterarOPParamSchema,
  chaveOPParamSchema,
  incluirOPParamSchema,
} from "../../application/dto/op-crud.dto.js";
import { IncluirOPUseCase } from "../../application/use-cases/incluir-op.js";
import { AlterarOPUseCase } from "../../application/use-cases/alterar-op.js";
import { ExcluirOPUseCase } from "../../application/use-cases/excluir-op.js";
import { ConsultarOPUseCase } from "../../application/use-cases/consultar-op.js";
import { criarOpGateway } from "../../infrastructure/gateways/op-gateway-factory.js";

export const ordemProducaoTools: ToolDef[] = [
  defineTool({
    name: "omie_op_incluir",
    description:
      "Inclui uma nova Ordem de Produção (OP) na Omie. Método Omie: IncluirOrdemProducao. " +
      "Precisa de nCodProduto (o produto já precisa ter estrutura/BOM preenchida, senão a Omie " +
      "recusa — veja omie_estrutura_incluir), dDtPrevisao (dd/mm/aaaa) e nQtde. " +
      "codigo_local_estoque é opcional (padrão 0, testado ao vivo: a Omie exige o campo mesmo " +
      "assim, mesmo a doc pública marcando como opcional).",
    inputSchema: { param: incluirOPParamSchema },
    execute: async (client, param) => {
      const parsed = incluirOPParamSchema.parse(param);
      const useCase = new IncluirOPUseCase(criarOpGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_op_alterar",
    description:
      "Altera uma Ordem de Produção existente. Método Omie: AlterarOrdemProducao. Identifique " +
      "por nCodOP ou cCodIntOP e reenvie os dados (nCodProduto, dDtPrevisao, nQtde).",
    inputSchema: { param: alterarOPParamSchema },
    execute: async (client, param) => {
      const parsed = alterarOPParamSchema.parse(param);
      const useCase = new AlterarOPUseCase(criarOpGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_op_excluir",
    description:
      "Exclui uma Ordem de Produção. Método Omie: ExcluirOrdemProducao. Identifique por nCodOP " +
      "ou cCodIntOP.",
    inputSchema: { param: chaveOPParamSchema },
    execute: async (client, param) => {
      const parsed = chaveOPParamSchema.parse(param);
      const useCase = new ExcluirOPUseCase(criarOpGateway(client));
      return useCase.execute(parsed);
    },
    destructive: true,
  }),
  defineTool({
    name: "omie_op_consultar",
    description:
      "Consulta uma Ordem de Produção específica (por código Omie ou código interno), com os " +
      "insumos utilizados. Método Omie: ConsultarOrdemProducao. O produto vem só como código " +
      "(nCodProduto) e a etapa como código cru (cEtapa) — para descrição/SKU do produto, use " +
      "omie_produtos_consultar ou omie_op_listar_com_produto.",
    inputSchema: { param: chaveOPParamSchema },
    execute: async (client, param) => {
      const parsed = chaveOPParamSchema.parse(param);
      const useCase = new ConsultarOPUseCase(criarOpGateway(client));
      return useCase.execute(parsed);
    },
  }),
  defineTool({
    name: "omie_op_listar",
    description:
      "Lista as Ordens de Produção cadastradas, com paginação e filtros. Método Omie: " +
      "ListarOrdemProducao. Devolve só o código do produto (nCodProduto, sem descrição/SKU) e a " +
      "etapa como código cru (cEtapa, configurável por conta, sem tradução via API). Para já vir " +
      "com a descrição do produto, use omie_op_listar_com_produto.",
    inputSchema: { param: paramSchema },
    resource: "produtos/op",
    call: "ListarOrdemProducao",
  }),
  defineTool({
    name: "omie_op_listar_com_produto",
    description:
      "Lista Ordens de Produção JÁ com a descrição/SKU do produto de cada OP, lendo de um CACHE " +
      "LOCAL (não bate na Omie a cada chamada — chame omie_op_atualizar_cache antes se precisar de " +
      "dado mais recente que o cache atual). A resposta inclui geradoEm/idadeMs informando a idade " +
      "do dado. Também expõe 'concluida' (true/false, campo confiável) além do 'etapaCodigo' cru " +
      "(a etapa do kanban é configurável por conta — de 3 a 6 fases com nomes próprios — e a API " +
      "não tem endpoint pra traduzir o código pro nome; se você souber o significado das etapas " +
      "dessa conta, pode interpretar etapaCodigo). Suporta paginação (pagina/registros_por_pagina, " +
      "agora aplicada sobre o cache local), o filtro apenas_nao_concluidas e o parâmetro genérico " +
      "'filtros' — lista de critérios (campo/operador/valor) aplicados sobre QUALQUER campo do " +
      "resultado já enriquecido (ex: descricaoProduto, codigoSku, quantidade), com operadores " +
      "igual/diferente/contem/maior_que/menor_que/entre. Ex: filtros: [{ campo: " +
      "'descricaoProduto', operador: 'contem', valor: '100kg' }].",
    inputSchema: { param: listarOpsComProdutoParamSchema },
    execute: async (_client, param) => {
      const parsed = listarOpsComProdutoParamSchema.parse(param);
      const { appKey } = credenciaisOmieOuFalha();
      const db = abrirBancoAtivo(appKey);
      try {
        const filtros: FiltrosOrdensProducao = { apenasNaoConcluidas: parsed.apenas_nao_concluidas };
        const resultado = consultarOrdensProducao(db, filtros);

        if (resultado.status === "sem_dado") {
          return {
            pagina: 1,
            totalPaginas: 0,
            totalRegistros: 0,
            itens: [],
            geradoEm: null,
            idadeMs: null,
            aviso: "Nenhuma OP no cache ainda — rode omie_op_atualizar_cache primeiro.",
          };
        }

        let itens: OrdemProducaoComProduto[] = resultado.ordens.map((ordem) => ({
          numeroOP: ordem.numeroOp,
          codigoOP: ordem.codigoOp,
          codigoProduto: ordem.codigoProduto,
          codigoSku: ordem.codigoSku,
          descricaoProduto: ordem.descricaoProduto,
          quantidade: ordem.quantidade,
          dataPrevisao: ordem.dataPrevisao,
          dataInicio: ordem.dataInicio,
          dataConclusao: ordem.dataConclusao,
          concluida: ordem.concluida,
          etapaCodigo: ordem.etapaCodigo,
        }));

        itens = aplicarFiltros(itens, parsed.filtros);

        const pagina = parsed.pagina ?? 1;
        const registrosPorPagina = parsed.registros_por_pagina ?? 20;
        const totalRegistros = itens.length;
        const totalPaginas = Math.max(1, Math.ceil(totalRegistros / registrosPorPagina));
        const inicio = (pagina - 1) * registrosPorPagina;
        const paginaItens = itens.slice(inicio, inicio + registrosPorPagina);

        return {
          pagina,
          totalPaginas,
          totalRegistros,
          itens: paginaItens,
          geradoEm: resultado.geradoEm,
          idadeMs: resultado.idadeMs,
        };
      } finally {
        db.close();
      }
    },
  }),
  defineTool({
    name: "omie_op_atualizar_cache",
    description:
      "Atualiza o cache local de Ordens de Produção, buscando TODAS as OPs na Omie " +
      "(ListarOrdemProducao, paginado) e regravando o cache que omie_op_listar_com_produto lê. " +
      "Sem parâmetro. CARA: são dezenas de chamadas reais à Omie (~16 páginas com 300ms de espera " +
      "entre elas, vários segundos por execução) — NÃO chame a cada pergunta. Chame antes de " +
      "omie_op_listar_com_produto só se precisar de dado mais recente que o cache atual; a resposta " +
      "de omie_op_listar_com_produto sempre informa a idade do dado (geradoEm/idadeMs), que é o " +
      "critério pra decidir. Devolve 'atualizadoEm', o mesmo carimbo que passa a ser lido como " +
      "'geradoEm' pelas consultas ao cache.",
    inputSchema: { param: z.object({}).optional() },
    execute: async () => {
      const { appKey, appSecret } = credenciaisOmieOuFalha();
      const db = abrirBancoAtivo(appKey);
      try {
        const client = new OmieHttpClientReal(appKey, appSecret);
        let totalColetado: number;
        try {
          totalColetado = await collectOrdemProducao(db, client);
        } catch (erro) {
          // A coleta grava página a página, sem transação: uma falha no meio deixa
          // as páginas já baixadas no cache, misturadas com o dado da coleta
          // anterior. Sem este contexto o chamador recebe só o erro de rede e não
          // tem como saber que o cache ficou parcialmente sobrescrito.
          const motivo = erro instanceof Error ? erro.message : String(erro);
          throw new Error(
            `Coleta de Ordens de Produção interrompida: ${motivo}. O cache pode estar ` +
              "PARCIALMENTE atualizado (as páginas já baixadas foram gravadas). Rode " +
              "omie_op_atualizar_cache de novo antes de confiar no dado."
          );
        }
        // O carimbo vem de quem escreveu a view — gerar um relógio novo aqui
        // divergiria do `geradoEm` que o consumidor efetivamente lê.
        const { geradoEm } = translateOrdemProducao(db);
        return { totalColetado, atualizadoEm: geradoEm };
      } finally {
        db.close();
      }
    },
  }),
];
