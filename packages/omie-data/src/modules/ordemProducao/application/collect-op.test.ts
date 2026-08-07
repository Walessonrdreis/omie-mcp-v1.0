import { afterEach, describe, expect, it } from "vitest";
import { abrirBanco } from "../../../infrastructure/database.js";
import { FakeHttpClient } from "../../../infrastructure/fake-http-client.js";
import {
  IOrdemProducaoHttpClient,
  ListarOrdemProducaoResponseBruto,
} from "../../../domain/ordem-producao-http-client.js";
import { OrdemProducaoOmieBruta } from "../domain/ordem-producao.js";
import { collectOrdemProducao } from "./collect-op.js";

function criarOp(nCodOP: number): OrdemProducaoOmieBruta {
  return {
    identificacao: {
      cCodIntOP: "", cNumOP: `2024/${nCodOP}`, codigo_local_estoque: 1,
      dDtPrevisao: "01/01/2024", nCodOP, nCodProduto: 1, nQtde: 10,
    },
    infAdicionais: { cEtapa: "80", dDtConclusao: "01/01/2024", dDtInicio: "01/01/2024", nCodProjeto: 0 },
    outrasInf: { cConcluida: "S", dConclusao: "01/01/2024", dInclusao: "01/01/2024" },
  };
}

/** Envolve o FakeHttpClient registrando as páginas pedidas e o instante de cada chamada. */
class ClienteEspiao implements IOrdemProducaoHttpClient {
  readonly chamadas: { pagina: number; registrosPorPagina: number; instanteMs: number }[] = [];

  constructor(private readonly interno: IOrdemProducaoHttpClient) {}

  async listarOrdensProducaoPagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarOrdemProducaoResponseBruto> {
    this.chamadas.push({ pagina, registrosPorPagina, instanteMs: Date.now() });
    return this.interno.listarOrdensProducaoPagina(pagina, registrosPorPagina);
  }
}

describe("collectOrdemProducao", () => {
  let db: ReturnType<typeof abrirBanco> | undefined;

  afterEach(() => {
    db?.close();
    // zera pra não fechar duas vezes a mesma conexão caso abrirBanco lance no
    // teste seguinte — o erro real ficaria escondido atrás de um TypeError.
    db = undefined;
  });

  it("grava cada OP em raw_ordens_producao com payload bruto", async () => {
    db = abrirBanco(":memory:");
    const client = new FakeHttpClient([], [], [criarOp(100)]);

    const total = await collectOrdemProducao(db, client);

    expect(total).toBe(1);

    const linha = db.prepare(
      "SELECT codigo_op, payload_json, coletado_em FROM raw_ordens_producao WHERE codigo_op = 100"
    ).get() as any;

    expect(linha.codigo_op).toBe(100);
    expect(JSON.parse(linha.payload_json).identificacao.nQtde).toBe(10);
    expect(linha.coletado_em).toBeTruthy();

  });

  it("faz upsert: mesma OP rodada duas vezes não duplica", async () => {
    db = abrirBanco(":memory:");
    const client = new FakeHttpClient([], [], [criarOp(100)]);

    await collectOrdemProducao(db, client);
    await collectOrdemProducao(db, client);

    const linhas = db.prepare("SELECT COUNT(*) as total FROM raw_ordens_producao").get() as { total: number };
    expect(linhas.total).toBe(1);

  });

  it("coleta todas as OPs quando há mais de uma página", async () => {
    db = abrirBanco(":memory:");
    const ordens = Array.from({ length: 150 }, (_, i) => criarOp(i + 1));
    const client = new FakeHttpClient([], [], ordens);

    const total = await collectOrdemProducao(db, client, 0); // sem espera no teste

    expect(total).toBe(150);
  });

  it("percorre todas as páginas sem pular nem repetir registros", async () => {
    db = abrirBanco(":memory:");
    const ordens = Array.from({ length: 250 }, (_, i) => criarOp(i + 1));
    const espiao = new ClienteEspiao(new FakeHttpClient([], [], ordens));

    const total = await collectOrdemProducao(db, espiao, 0);

    expect(total).toBe(250);
    expect(espiao.chamadas.map((c) => c.pagina)).toEqual([1, 2, 3]);
    expect(espiao.chamadas.every((c) => c.registrosPorPagina === 100)).toBe(true);

    const codigos = db
      .prepare("SELECT codigo_op FROM raw_ordens_producao ORDER BY codigo_op")
      .all() as { codigo_op: number }[];

    expect(codigos.length).toBe(250);
    expect(codigos.map((l) => l.codigo_op)).toEqual(
      Array.from({ length: 250 }, (_, i) => i + 1)
    );

  });

  it("respeita o intervalo de espera configurado entre as páginas", async () => {
    db = abrirBanco(":memory:");
    const ordens = Array.from({ length: 250 }, (_, i) => criarOp(i + 1));
    const espiao = new ClienteEspiao(new FakeHttpClient([], [], ordens));
    const esperaMs = 60;

    await collectOrdemProducao(db, espiao, esperaMs);

    expect(espiao.chamadas.length).toBe(3);
    // margem de 10ms pra imprecisão do timer do runtime
    expect(espiao.chamadas[1].instanteMs - espiao.chamadas[0].instanteMs).toBeGreaterThanOrEqual(esperaMs - 10);
    expect(espiao.chamadas[2].instanteMs - espiao.chamadas[1].instanteMs).toBeGreaterThanOrEqual(esperaMs - 10);

  });

  it("não espera antes da primeira página quando só existe uma", async () => {
    db = abrirBanco(":memory:");
    const espiao = new ClienteEspiao(new FakeHttpClient([], [], [criarOp(1)]));

    const inicio = Date.now();
    await collectOrdemProducao(db, espiao, 500);
    const decorrido = Date.now() - inicio;

    expect(espiao.chamadas.length).toBe(1);
    expect(decorrido).toBeLessThan(400);

  });
});
