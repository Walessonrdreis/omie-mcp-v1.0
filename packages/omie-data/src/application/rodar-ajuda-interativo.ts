import type Database from "better-sqlite3";
import { select, search } from "@inquirer/prompts";
import { IOmieHttpClient } from "../domain/omie-http-client.js";
import { rodarProdutos } from "./rodar-produtos.js";
import { FiltrosProdutos, ResultadoConsultaProdutos } from "./consultar-produtos.js";

export interface OpcaoBusca {
  rotulo: string;
  valor: string;
}

export interface IPromptsInterativos {
  selecionarFiltro(): Promise<"busca" | "categoria" | "ativo" | "nenhum" | "voltar" | "sair">;
  buscarTermo(fonte: (input: string) => OpcaoBusca[]): Promise<string>;
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
          { name: "Voltar", value: "voltar" as const },
          { name: "Sair", value: "sair" as const },
        ],
      });
    },
    async buscarTermo(fonte) {
      return search({
        message: "Digite pra filtrar (setinha + Enter pra escolher):",
        source: async (input) => {
          const termo = input ?? "";
          return fonte(termo).map((opcao) => ({ name: opcao.rotulo, value: opcao.valor }));
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

function valoresDistintos(db: Database.Database, coluna: "categoria", termo: string): OpcaoBusca[] {
  if (!termo) return [];
  const linhas = db
    .prepare(`SELECT DISTINCT ${coluna} AS valor FROM view_produtos WHERE LOWER(${coluna}) LIKE ? ORDER BY ${coluna} LIMIT 20`)
    .all(`%${termo.toLowerCase()}%`) as Array<{ valor: string }>;
  return linhas.map((linha) => ({ rotulo: linha.valor, valor: linha.valor }));
}

export function valoresBusca(db: Database.Database, termo: string): OpcaoBusca[] {
  if (!termo) return [];
  const termoLike = `%${termo.toLowerCase()}%`;

  const porNome = db
    .prepare("SELECT DISTINCT nome AS valor FROM view_produtos WHERE LOWER(nome) LIKE ? ORDER BY nome LIMIT 20")
    .all(termoLike) as Array<{ valor: string }>;
  const porCodigo = db
    .prepare("SELECT DISTINCT codigo, nome FROM view_produtos WHERE LOWER(codigo) LIKE ? ORDER BY codigo LIMIT 20")
    .all(termoLike) as Array<{ codigo: string; nome: string }>;

  const itensNome: OpcaoBusca[] = porNome.map((linha) => ({ rotulo: linha.valor, valor: linha.valor }));
  const itensCodigo: OpcaoBusca[] = porCodigo.map((linha) => ({
    rotulo: `${linha.codigo} - ${linha.nome}`,
    valor: linha.codigo,
  }));

  const vistos = new Set<string>();
  const combinados: OpcaoBusca[] = [];
  for (const opcao of [...itensNome, ...itensCodigo]) {
    if (!vistos.has(opcao.valor)) {
      vistos.add(opcao.valor);
      combinados.push(opcao);
    }
  }

  return combinados.slice(0, 20);
}

export type ResultadoAjudaInterativa =
  | { tipo: "voltar" }
  | { tipo: "sair" }
  | { tipo: "resultado"; resultado: ResultadoConsultaProdutos };

export async function rodarAjudaInterativa(
  db: Database.Database,
  client: IOmieHttpClient,
  atualizar: boolean,
  filtrosBase: FiltrosProdutos = {},
  prompts: IPromptsInterativos = criarPromptsReais()
): Promise<ResultadoAjudaInterativa> {
  const filtroEscolhido = await prompts.selecionarFiltro();

  if (filtroEscolhido === "voltar") {
    return { tipo: "voltar" };
  }
  if (filtroEscolhido === "sair") {
    return { tipo: "sair" };
  }

  if (atualizar) {
    await rodarProdutos(db, client, true);
  }

  const filtroPrompt: FiltrosProdutos = {};

  if (filtroEscolhido === "busca") {
    filtroPrompt.busca = await prompts.buscarTermo((termo) => valoresBusca(db, termo));
  } else if (filtroEscolhido === "categoria") {
    filtroPrompt.categoria = await prompts.buscarTermo((termo) => valoresDistintos(db, "categoria", termo));
  } else if (filtroEscolhido === "ativo") {
    filtroPrompt.ativo = await prompts.selecionarAtivo();
  }

  const filtros: FiltrosProdutos = { ...filtrosBase, ...filtroPrompt };

  const resultado = await rodarProdutos(db, client, false, filtros);
  return { tipo: "resultado", resultado };
}
