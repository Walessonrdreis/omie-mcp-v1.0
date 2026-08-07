import type Database from "better-sqlite3";
import { ProdutoOmieBruto } from "../modules/produtos/domain/produto.js";

function formatarMoeda(valor: number): string {
  const fixo = valor.toFixed(2);
  const [inteiro, centavos] = fixo.split(".");
  const inteiroComMilhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `R$ ${inteiroComMilhar},${centavos}`;
}

export function translateProdutos(db: Database.Database): number {
  const brutos = db
    .prepare("SELECT payload_json FROM raw_produtos")
    .all() as { payload_json: string }[];

  const upsert = db.prepare(`
    INSERT INTO view_produtos (codigo_produto, codigo, nome, categoria, unidade, valor_formatado, ativo, gerado_em)
    VALUES (@codigo_produto, @codigo, @nome, @categoria, @unidade, @valor_formatado, @ativo, @gerado_em)
    ON CONFLICT(codigo_produto) DO UPDATE SET
      codigo = excluded.codigo,
      nome = excluded.nome,
      categoria = excluded.categoria,
      unidade = excluded.unidade,
      valor_formatado = excluded.valor_formatado,
      ativo = excluded.ativo,
      gerado_em = excluded.gerado_em
  `);

  const agora = new Date().toISOString();
  let total = 0;

  for (const linha of brutos) {
    const produto: ProdutoOmieBruto = JSON.parse(linha.payload_json);

    upsert.run({
      codigo_produto: produto.codigo_produto,
      codigo: produto.codigo ?? String(produto.codigo_produto),
      nome: produto.descricao ?? "(sem nome)",
      categoria: produto.descricao_familia ?? "Sem categoria",
      unidade: produto.unidade ?? "-",
      valor_formatado: formatarMoeda(produto.valor_unitario ?? 0),
      ativo: produto.inativo === "N" ? "Sim" : "Não",
      gerado_em: agora,
    });
    total++;
  }

  return total;
}
