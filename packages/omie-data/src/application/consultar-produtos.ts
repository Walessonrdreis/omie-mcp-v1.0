import type Database from "better-sqlite3";
import { ProdutoView } from "../domain/produto.js";

export interface ResultadoConsultaProdutos {
  status: "sem_dado" | "dado_disponivel";
  produtos: ProdutoView[];
  geradoEm: string | null;
  idadeMs: number | null;
}

export function consultarProdutos(db: Database.Database): ResultadoConsultaProdutos {
  const linhas = db
    .prepare(
      "SELECT codigo_produto, codigo, nome, categoria, unidade, valor_formatado, ativo, gerado_em FROM view_produtos"
    )
    .all() as Array<{
      codigo_produto: number;
      codigo: string;
      nome: string;
      categoria: string;
      unidade: string;
      valor_formatado: string;
      ativo: "Sim" | "Não";
      gerado_em: string;
    }>;

  if (linhas.length === 0) {
    return { status: "sem_dado", produtos: [], geradoEm: null, idadeMs: null };
  }

  const produtos: ProdutoView[] = linhas.map((linha) => ({
    codigoProduto: linha.codigo_produto,
    codigo: linha.codigo,
    nome: linha.nome,
    categoria: linha.categoria,
    unidade: linha.unidade,
    valorFormatado: linha.valor_formatado,
    ativo: linha.ativo,
  }));

  const geradoEm = linhas[0].gerado_em;
  const idadeMs = Date.now() - new Date(geradoEm).getTime();

  return { status: "dado_disponivel", produtos, geradoEm, idadeMs };
}
