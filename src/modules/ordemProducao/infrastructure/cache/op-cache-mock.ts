import {
  abrirBanco,
  collectOrdemProducao,
  collectProdutos,
  translateOrdemProducao,
  FakeHttpClient,
  type OrdemProducaoOmieBruta,
  type ProdutoOmieBruto,
} from "../../../../data/index.js";
import type { BancoOp } from "./op-cache.js";

/**
 * Mesma convenção das ~20 fábricas de gateway do repo
 * (`process.env.OMIE_MOCK === "true" ? Fake : Real`), extraída em função só
 * porque as duas ferramentas de cache precisam consultá-la.
 */
export function modoMock(): boolean {
  return process.env.OMIE_MOCK === "true";
}

/** Produtos acabados fake, correspondentes aos `nCodProduto` das OPs abaixo. */
const PRODUTOS_MOCK: ProdutoOmieBruto[] = [
  {
    codigo_produto: 111,
    codigo: "SKU-FAKE-111",
    descricao: "Produto Fake 111",
    unidade: "UN",
    valor_unitario: 10,
    inativo: "N",
    codigo_familia: 0,
  },
  {
    codigo_produto: 222,
    codigo: "SKU-FAKE-222",
    descricao: "Produto Fake 222",
    unidade: "KG",
    valor_unitario: 20,
    inativo: "N",
    codigo_familia: 0,
  },
];

/**
 * Espelha o conjunto de `OpFakeGateway` (mesmos códigos 1001/1002 e produtos
 * 111/222), pra que o modo mock conte a mesma história nas ferramentas de CRUD
 * ao vivo e nas de cache. Tem uma OP concluída e uma não concluída de propósito
 * — é o que dá o que exercitar no filtro `apenas_nao_concluidas`.
 */
const ORDENS_PRODUCAO_MOCK: OrdemProducaoOmieBruta[] = [
  {
    identificacao: {
      cCodIntOP: "OP-FAKE-001",
      cNumOP: "1",
      codigo_local_estoque: 1,
      dDtPrevisao: "31/12/2026",
      nCodOP: 1001,
      nCodProduto: 111,
      nQtde: 10,
    },
    infAdicionais: {
      cEtapa: "10",
      dDtConclusao: "",
      dDtInicio: "01/12/2026",
      nCodProjeto: 0,
    },
    outrasInf: { cConcluida: "N", dConclusao: "", dInclusao: "01/12/2026" },
  },
  {
    identificacao: {
      cCodIntOP: "OP-FAKE-002",
      cNumOP: "2",
      codigo_local_estoque: 1,
      dDtPrevisao: "15/12/2026",
      nCodOP: 1002,
      nCodProduto: 222,
      nQtde: 5,
    },
    infAdicionais: {
      cEtapa: "30",
      dDtConclusao: "10/12/2026",
      dDtInicio: "05/12/2026",
      nCodProjeto: 0,
    },
    outrasInf: {
      cConcluida: "S",
      dConclusao: "10/12/2026",
      dInclusao: "05/12/2026",
    },
  },
];

export interface BancoOpMock {
  db: BancoOp;
  totalColetado: number;
  geradoEm: string;
}

/**
 * Monta um cache de Ordens de Produção completo em memória a partir do
 * `FakeHttpClient` do `omie-data` — coleta e tradução são as MESMAS do caminho
 * real, só a fonte HTTP muda. Consequências que importam:
 *
 * - nenhuma chamada de rede acontece em `OMIE_MOCK=true`;
 * - nenhuma credencial é exigida (com credencial dummy o caminho real falhava
 *   na autenticação da Omie);
 * - nada é escrito em disco: o banco é `:memory:`, então o modo mock nunca
 *   contamina o cache real compartilhado com o CLI/skill.
 *
 * Como o banco é volátil, cada chamada devolve um cache novo e já povoado — é
 * por isso que `omie_op_listar_com_produto` responde dado fake mesmo sem um
 * `omie_op_atualizar_cache` anterior.
 */
export async function prepararBancoOpMock(): Promise<BancoOpMock> {
  const db = abrirBanco(":memory:");
  const client = new FakeHttpClient(PRODUTOS_MOCK, [], ORDENS_PRODUCAO_MOCK);

  // Espera entre páginas zerada: não há API pra poupar de "consumo redundante".
  await collectProdutos(db, client, 0);
  const totalColetado = await collectOrdemProducao(db, client, 0);
  const { geradoEm } = translateOrdemProducao(db);

  return { db, totalColetado, geradoEm };
}
