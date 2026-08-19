import type Database from "better-sqlite3";
import { ProdutoView } from "../domain/produto.js";

export interface ResultadoConsultaProdutos {
  status: "sem_dado" | "dado_disponivel";
  produtos: ProdutoView[];
  geradoEm: string | null;
  idadeMs: number | null;
}

export interface FiltrosProdutos {
  busca?: string;
  categoria?: string;
  ativo?: "Sim" | "Não";
}

export function consultarProdutos(
  db: Database.Database,
  filtros?: FiltrosProdutos
): ResultadoConsultaProdutos {
  const condicoes: string[] = [];
  const parametros: unknown[] = [];

  if (filtros?.busca) {
    condicoes.push("(LOWER(nome) LIKE ? OR LOWER(codigo) LIKE ?)");
    const termo = `%${filtros.busca.toLowerCase()}%`;
    parametros.push(termo, termo);
  }

  if (filtros?.categoria) {
    condicoes.push("LOWER(categoria) LIKE ?");
    parametros.push(`%${filtros.categoria.toLowerCase()}%`);
  }

  if (filtros?.ativo) {
    condicoes.push("ativo = ?");
    parametros.push(filtros.ativo);
  }

  const where = condicoes.length > 0 ? `WHERE ${condicoes.join(" AND ")}` : "";

  const linhas = db
    .prepare(
      `SELECT codigo_produto, codigo, nome, categoria, unidade, valor_formatado, ativo, gerado_em, quantidade_em_estoque, valor_em_estoque_custo, valor_em_estoque_venda FROM view_produtos ${where} ORDER BY gerado_em DESC`
    )
    .all(...parametros) as Array<{
      codigo_produto: number;
      codigo: string;
      nome: string;
      categoria: string;
      unidade: string;
      valor_formatado: string;
      ativo: "Sim" | "Não";
      gerado_em: string;
      quantidade_em_estoque: number;
      valor_em_estoque_custo: number;
      valor_em_estoque_venda: number;
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
    quantidadeEmEstoque: linha.quantidade_em_estoque,
    valorEmEstoqueCusto: linha.valor_em_estoque_custo,
    valorEmEstoqueVenda: linha.valor_em_estoque_venda,
  }));

  const geradoEm = linhas[0].gerado_em;
  const idadeMs = Date.now() - new Date(geradoEm).getTime();

  return { status: "dado_disponivel", produtos, geradoEm, idadeMs };
}
