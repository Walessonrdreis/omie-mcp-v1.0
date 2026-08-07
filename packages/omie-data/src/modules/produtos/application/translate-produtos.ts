import type Database from "better-sqlite3";
import { ProdutoOmieBruto } from "../domain/produto.js";

function formatarMoeda(valor: number): string {
  const fixo = valor.toFixed(2);
  const [inteiro, centavos] = fixo.split(".");
  const inteiroComMilhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `R$ ${inteiroComMilhar},${centavos}`;
}

function round2(valor: number): number {
  return Math.round(valor * 100) / 100;
}

export function translateProdutos(db: Database.Database): number {
  const brutos = db
    .prepare("SELECT payload_json FROM raw_produtos")
    .all() as { payload_json: string }[];

  // Lê e agrupa posições de estoque por produto
  const posicoesEstoque = db
    .prepare("SELECT payload_json FROM raw_estoque")
    .all() as { payload_json: string }[];

  const estoquePorProduto = new Map<number, { quantidade: number; custoTotal: number }>();
  for (const linha of posicoesEstoque) {
    const posicao = JSON.parse(linha.payload_json);
    const atual = estoquePorProduto.get(posicao.nCodProd) ?? { quantidade: 0, custoTotal: 0 };
    atual.quantidade += posicao.fisico;
    atual.custoTotal += posicao.fisico * posicao.nCMC;
    estoquePorProduto.set(posicao.nCodProd, atual);
  }

  const upsert = db.prepare(`
    INSERT INTO view_produtos (
      codigo_produto, codigo, nome, categoria, unidade, valor_formatado, ativo, gerado_em,
      quantidade_em_estoque, valor_em_estoque_custo, valor_em_estoque_venda
    )
    VALUES (
      @codigo_produto, @codigo, @nome, @categoria, @unidade, @valor_formatado, @ativo, @gerado_em,
      @quantidade_em_estoque, @valor_em_estoque_custo, @valor_em_estoque_venda
    )
    ON CONFLICT(codigo_produto) DO UPDATE SET
      codigo = excluded.codigo,
      nome = excluded.nome,
      categoria = excluded.categoria,
      unidade = excluded.unidade,
      valor_formatado = excluded.valor_formatado,
      ativo = excluded.ativo,
      gerado_em = excluded.gerado_em,
      quantidade_em_estoque = excluded.quantidade_em_estoque,
      valor_em_estoque_custo = excluded.valor_em_estoque_custo,
      valor_em_estoque_venda = excluded.valor_em_estoque_venda
  `);

  const agora = new Date().toISOString();
  let total = 0;

  for (const linha of brutos) {
    const produto: ProdutoOmieBruto = JSON.parse(linha.payload_json);

    const estoque = estoquePorProduto.get(produto.codigo_produto) ?? { quantidade: 0, custoTotal: 0 };
    const quantidadeEmEstoque = round2(estoque.quantidade);
    const valorUnitario = produto.valor_unitario ?? 0;

    upsert.run({
      codigo_produto: produto.codigo_produto,
      codigo: produto.codigo ?? String(produto.codigo_produto),
      nome: produto.descricao ?? "(sem nome)",
      categoria: produto.descricao_familia ?? "Sem categoria",
      unidade: produto.unidade ?? "-",
      valor_formatado: formatarMoeda(produto.valor_unitario ?? 0),
      ativo: produto.inativo === "N" ? "Sim" : "Não",
      gerado_em: agora,
      quantidade_em_estoque: quantidadeEmEstoque,
      valor_em_estoque_custo: round2(estoque.custoTotal),
      valor_em_estoque_venda: round2(quantidadeEmEstoque * valorUnitario),
    });
    total++;
  }

  return total;
}
