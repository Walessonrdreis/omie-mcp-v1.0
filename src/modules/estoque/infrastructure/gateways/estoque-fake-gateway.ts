import {
  DadosAjusteEstoqueParaGravar,
  IEstoqueGateway,
  PosicaoEstoque,
  StatusAjusteEstoqueOmie,
} from "../../domain/interfaces/estoque-gateway.js";

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
  private proximoIdAjuste = 7000;
  private ajustesAtivos = new Map<number, { nCodProd: number; quan: number; tipo: string }>();

  /**
   * Cópia própria por instância (não a constante `POSICOES_FAKE` direto) —
   * mesmo cuidado dos demais fakes desta sessão: agora que o fake também
   * grava ajuste (altera `fisico`/`nSaldo`), compartilhar por referência
   * vazaria estado de um teste pro outro.
   */
  constructor(private readonly posicoes: PosicaoEstoque[] = POSICOES_FAKE.map((p) => ({ ...p }))) {}

  async listarTodasPosicoes(): Promise<PosicaoEstoque[]> {
    return [...this.posicoes];
  }

  async listarPosicoesPorProduto(codigoProduto: number): Promise<PosicaoEstoque[]> {
    return this.posicoes.filter((p) => p.nCodProd === codigoProduto);
  }

  async incluirAjuste(dados: DadosAjusteEstoqueParaGravar): Promise<StatusAjusteEstoqueOmie> {
    const posicao = this.posicoes.find((p) => p.nCodProd === dados.id_prod);
    if (!posicao) {
      throw new Error(`Produto ${dados.id_prod} não tem posição de estoque (fake).`);
    }

    const delta = dados.tipo === "SAI" ? -dados.quan : dados.quan;
    posicao.fisico += delta;
    posicao.nSaldo += delta;

    const idAjuste = this.proximoIdAjuste++;
    const idMovest = this.proximoIdAjuste++;
    this.ajustesAtivos.set(idAjuste, { nCodProd: dados.id_prod, quan: delta, tipo: dados.tipo });

    return {
      codigo_status: "0",
      descricao_status: "Movimento de estoque de ajuste incluido com sucesso. (fake)",
      id_movest: idMovest,
      id_ajuste: idAjuste,
    };
  }

  async excluirAjuste(idAjuste: number): Promise<StatusAjusteEstoqueOmie> {
    const ajuste = this.ajustesAtivos.get(idAjuste);
    if (!ajuste) {
      throw new Error(`Ajuste ${idAjuste} não encontrado (fake).`);
    }

    const posicao = this.posicoes.find((p) => p.nCodProd === ajuste.nCodProd);
    if (posicao) {
      posicao.fisico -= ajuste.quan;
      posicao.nSaldo -= ajuste.quan;
    }
    this.ajustesAtivos.delete(idAjuste);

    return {
      codigo_status: "0",
      descricao_status: "Movimento de estoque de ajuste excluido com sucesso. (fake)",
      id_movest: 0,
      id_ajuste: idAjuste,
    };
  }
}
