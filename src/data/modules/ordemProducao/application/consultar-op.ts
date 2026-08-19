import type Database from "better-sqlite3";

export interface OrdemProducaoView {
  codigoOp: number;
  numeroOp: string;
  codigoProduto: number;
  codigoSku: string;
  descricaoProduto: string;
  quantidade: number;
  dataPrevisao: string;
  dataInicio: string;
  dataConclusao: string;
  concluida: boolean;
  etapaCodigo: string;
}

export interface FiltrosOrdensProducao {
  apenasNaoConcluidas?: boolean;
}

export interface ResultadoConsultaOrdensProducao {
  status: "sem_dado" | "dado_disponivel";
  ordens: OrdemProducaoView[];
  geradoEm: string | null;
  idadeMs: number | null;
}

/**
 * Consulta as Ordens de Produção já traduzidas.
 *
 * Lê SOMENTE `view_ordens_producao` — nunca o Dado Bruto e nunca a rede.
 * View vazia devolve `status: "sem_dado"` (e não uma lista vazia silenciosa),
 * porque "não existe OP nenhuma" e "nunca coletei" são respostas diferentes.
 */
export function consultarOrdensProducao(
  db: Database.Database,
  filtros?: FiltrosOrdensProducao
): ResultadoConsultaOrdensProducao {
  const condicoes: string[] = [];

  if (filtros?.apenasNaoConcluidas) {
    condicoes.push("concluida = 0");
  }

  const where = condicoes.length > 0 ? `WHERE ${condicoes.join(" AND ")}` : "";

  const linhas = db
    .prepare(
      `SELECT codigo_op, numero_op, codigo_produto, codigo_sku, descricao_produto, quantidade, data_previsao, data_inicio, data_conclusao, concluida, etapa_codigo, gerado_em FROM view_ordens_producao ${where} ORDER BY gerado_em DESC, codigo_op ASC`
    )
    .all() as Array<{
      codigo_op: number;
      numero_op: string;
      codigo_produto: number;
      codigo_sku: string;
      descricao_produto: string;
      quantidade: number;
      data_previsao: string;
      data_inicio: string;
      data_conclusao: string;
      concluida: number;
      etapa_codigo: string;
      gerado_em: string;
    }>;

  if (linhas.length === 0) {
    return { status: "sem_dado", ordens: [], geradoEm: null, idadeMs: null };
  }

  const ordens: OrdemProducaoView[] = linhas.map((linha) => ({
    codigoOp: linha.codigo_op,
    numeroOp: linha.numero_op,
    codigoProduto: linha.codigo_produto,
    codigoSku: linha.codigo_sku,
    descricaoProduto: linha.descricao_produto,
    quantidade: linha.quantidade,
    dataPrevisao: linha.data_previsao,
    dataInicio: linha.data_inicio,
    dataConclusao: linha.data_conclusao,
    concluida: linha.concluida === 1,
    etapaCodigo: linha.etapa_codigo,
  }));

  const geradoEm = linhas[0].gerado_em;
  const idadeMs = Date.now() - new Date(geradoEm).getTime();

  return { status: "dado_disponivel", ordens, geradoEm, idadeMs };
}
