import type Database from "better-sqlite3";
import { select, search } from "@inquirer/prompts";
import { IOmieHttpClient } from "../domain/omie-http-client.js";
import { rodarProdutos } from "./rodar-produtos.js";
import { FiltrosProdutos, ResultadoConsultaProdutos } from "./consultar-produtos.js";

export interface IPromptsInterativos {
  selecionarFiltro(): Promise<"busca" | "categoria" | "ativo" | "nenhum">;
  buscarTermo(fonte: (input: string) => string[]): Promise<string>;
  selecionarAtivo(): Promise<"Sim" | "Não">;
}

export function criarPromptsReais(): IPromptsInterativos {
  return {
    async selecionarFiltro() {
      return select({
        message: "Qual filtro você quer aplicar?",
        choices: [
          { name: "Busca (nome ou código)", value: "busca" as const },
          { name: "Categoria", value: "categoria" as const },
          { name: "Ativo", value: "ativo" as const },
          { name: "Sem filtro (listar tudo)", value: "nenhum" as const },
        ],
      });
    },
    async buscarTermo(fonte) {
      return search({
        message: "Digite pra filtrar (setinha + Enter pra escolher):",
        source: async (input) => {
          const termo = input ?? "";
          return fonte(termo).map((valor) => ({ name: valor, value: valor }));
        },
      });
    },
    async selecionarAtivo() {
      return select({
        message: "Ativo?",
        choices: [
          { name: "Sim", value: "Sim" as const },
          { name: "Não", value: "Não" as const },
        ],
      });
    },
  };
}

function valoresDistintos(db: Database.Database, coluna: "nome" | "categoria", termo: string): string[] {
  if (!termo) return [];
  const linhas = db
    .prepare(`SELECT DISTINCT ${coluna} AS valor FROM view_produtos WHERE LOWER(${coluna}) LIKE ? ORDER BY ${coluna} LIMIT 20`)
    .all(`%${termo.toLowerCase()}%`) as Array<{ valor: string }>;
  return linhas.map((linha) => linha.valor);
}

export async function rodarAjudaInterativa(
  db: Database.Database,
  client: IOmieHttpClient,
  atualizar: boolean,
  prompts: IPromptsInterativos = criarPromptsReais()
): Promise<ResultadoConsultaProdutos> {
  if (atualizar) {
    await rodarProdutos(db, client, true);
  }

  const filtroEscolhido = await prompts.selecionarFiltro();
  const filtros: FiltrosProdutos = {};

  if (filtroEscolhido === "busca") {
    filtros.busca = await prompts.buscarTermo((termo) => valoresDistintos(db, "nome", termo));
  } else if (filtroEscolhido === "categoria") {
    filtros.categoria = await prompts.buscarTermo((termo) => valoresDistintos(db, "categoria", termo));
  } else if (filtroEscolhido === "ativo") {
    filtros.ativo = await prompts.selecionarAtivo();
  }

  return rodarProdutos(db, client, false, filtros);
}
