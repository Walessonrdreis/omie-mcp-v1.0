import type Database from "better-sqlite3";
import { OrdemProducaoOmieBruta } from "../domain/ordem-producao.js";
import { ProdutoOmieBruto } from "../../produtos/domain/produto.js";

/**
 * Traduz o Dado Bruto de Ordens de Produção para a View legível, enriquecendo
 * cada OP com o SKU/descrição do produto acabado a partir de `raw_produtos`.
 *
 * Não faz rede: só lê Dado Bruto e escreve a View, então pode ser refeita a
 * qualquer momento sem custo de API. O upsert por `codigo_op` a torna idempotente.
 */
export function translateOrdemProducao(db: Database.Database): number {
  const produtosBrutos = db
    .prepare("SELECT payload_json FROM raw_produtos")
    .all() as { payload_json: string }[];

  const produtoPorCodigo = new Map<number, { codigo: string; descricao: string }>();
  for (const linha of produtosBrutos) {
    const produto = JSON.parse(linha.payload_json) as ProdutoOmieBruto;
    produtoPorCodigo.set(produto.codigo_produto, {
      codigo: produto.codigo ?? String(produto.codigo_produto),
      descricao: produto.descricao ?? "(sem nome)",
    });
  }

  const brutos = db
    .prepare("SELECT payload_json FROM raw_ordens_producao")
    .all() as { payload_json: string }[];

  const upsert = db.prepare(`
    INSERT INTO view_ordens_producao (
      codigo_op, numero_op, codigo_produto, codigo_sku, descricao_produto,
      quantidade, data_previsao, data_inicio, data_conclusao, concluida, etapa_codigo, gerado_em
    )
    VALUES (
      @codigo_op, @numero_op, @codigo_produto, @codigo_sku, @descricao_produto,
      @quantidade, @data_previsao, @data_inicio, @data_conclusao, @concluida, @etapa_codigo, @gerado_em
    )
    ON CONFLICT(codigo_op) DO UPDATE SET
      numero_op = excluded.numero_op,
      codigo_produto = excluded.codigo_produto,
      codigo_sku = excluded.codigo_sku,
      descricao_produto = excluded.descricao_produto,
      quantidade = excluded.quantidade,
      data_previsao = excluded.data_previsao,
      data_inicio = excluded.data_inicio,
      data_conclusao = excluded.data_conclusao,
      concluida = excluded.concluida,
      etapa_codigo = excluded.etapa_codigo,
      gerado_em = excluded.gerado_em
  `);

  const agora = new Date().toISOString();
  let total = 0;

  for (const linha of brutos) {
    const op = JSON.parse(linha.payload_json) as OrdemProducaoOmieBruta;
    const produto = produtoPorCodigo.get(op.identificacao.nCodProduto);

    upsert.run({
      codigo_op: op.identificacao.nCodOP,
      numero_op: op.identificacao.cNumOP,
      codigo_produto: op.identificacao.nCodProduto,
      codigo_sku: produto?.codigo ?? "",
      descricao_produto: produto?.descricao ?? "(produto não encontrado)",
      quantidade: op.identificacao.nQtde,
      data_previsao: op.identificacao.dDtPrevisao,
      data_inicio: op.infAdicionais.dDtInicio,
      // ATENÇÃO: `infAdicionais.dDtConclusao` (aqui) e `outrasInf.dConclusao`
      // são campos DISTINTOS do payload da Omie, com nomes quase iguais.
      data_conclusao: op.infAdicionais.dDtConclusao,
      concluida: op.outrasInf.cConcluida === "S" ? 1 : 0,
      etapa_codigo: op.infAdicionais.cEtapa,
      gerado_em: agora,
    });
    total++;
  }

  return total;
}
