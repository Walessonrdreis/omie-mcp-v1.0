import { IEstoqueGateway, PosicaoEstoque } from "../../domain/interfaces/estoque-gateway.js";

const POSICOES_FAKE: PosicaoEstoque[] = [
  {
    cCodigo: "PROD-001",
    cDescricao: "Produto Fake 1",
    codigo_local_estoque: 1,
    fisico: 100,
    nCodProd: 111,
    nSaldo: 90,
    reservado: 10,
    nPendente: 0,
    nCMC: 12.5,
  },
  {
    cCodigo: "PROD-001",
    cDescricao: "Produto Fake 1",
    codigo_local_estoque: 2,
    fisico: 50,
    nCodProd: 111,
    nSaldo: 50,
    reservado: 0,
    nPendente: 0,
    nCMC: 12.5,
  },
  {
    cCodigo: "PROD-002",
    cDescricao: "Produto Fake 2",
    codigo_local_estoque: 1,
    fisico: 20,
    nCodProd: 222,
    nSaldo: 15,
    reservado: 5,
    nPendente: 0,
    nCMC: 30,
  },
];

/**
 * Implementação em memória de `IEstoqueGateway`, sem chamar a Omie real —
 * usada quando `OMIE_MOCK=true`, pra desenvolvimento/testes offline.
 */
export class EstoqueFakeGateway implements IEstoqueGateway {
  constructor(private readonly posicoes: PosicaoEstoque[] = POSICOES_FAKE) {}

  async listarTodasPosicoes(): Promise<PosicaoEstoque[]> {
    return [...this.posicoes];
  }

  async listarPosicoesPorProduto(codigoProduto: number): Promise<PosicaoEstoque[]> {
    return this.posicoes.filter((p) => p.nCodProd === codigoProduto);
  }
}
