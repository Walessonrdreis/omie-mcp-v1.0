import {
  ConsultarExtratoParams,
  ContaCorrenteOmie,
  ExtratoContaCorrenteOmie,
  IContasCorrentesGateway,
} from "../../domain/interfaces/contas-correntes-gateway.js";

const CONTAS_FAKE: ContaCorrenteOmie[] = [
  {
    nCodCC: 9183200875,
    descricao: "Cartão NuBank (fake)",
    codigo_banco: "260",
    tipo_conta_corrente: "CC",
    inativo: "N",
    saldo_inicial: 1000,
    saldo_data: "01/12/2026",
  },
  {
    nCodCC: 9181761228,
    descricao: "Stone (fake)",
    codigo_banco: "197",
    tipo_conta_corrente: "CA",
    inativo: "N",
    saldo_inicial: 500,
    saldo_data: "01/12/2026",
  },
];

/**
 * Implementação em memória de `IContasCorrentesGateway`, sem chamar a Omie
 * real — usada quando `OMIE_MOCK=true`, pra desenvolvimento/testes offline.
 */
export class ContasCorrentesFakeGateway implements IContasCorrentesGateway {
  constructor(private readonly contas: ContaCorrenteOmie[] = CONTAS_FAKE) {}

  async mapaContasPorCodigo(): Promise<Map<number, ContaCorrenteOmie>> {
    return new Map(this.contas.map((c) => [c.nCodCC, c]));
  }

  async consultarExtrato(params: ConsultarExtratoParams): Promise<ExtratoContaCorrenteOmie> {
    const conta = this.contas.find((c) => c.nCodCC === params.codigoContaCorrente);
    if (!conta) {
      throw new Error(`Conta corrente ${params.codigoContaCorrente} não encontrada (fake).`);
    }

    return {
      nCodCC: conta.nCodCC,
      cDescricao: conta.descricao,
      dPeriodoInicial: params.periodoInicial,
      dPeriodoFinal: params.periodoFinal,
      nSaldoAnterior: conta.saldo_inicial,
      nSaldoAtual: conta.saldo_inicial + 150,
      nSaldoConciliado: conta.saldo_inicial + 100,
      nSaldoProvisorio: conta.saldo_inicial + 150,
      nSaldoDisponivel: conta.saldo_inicial + 150,
      listaMovimentos: [
        {
          dDataLancamento: params.periodoInicial,
          cDesCliente: "SALDO ANTERIOR",
          nValorDocumento: 0,
          nSaldo: conta.saldo_inicial,
          nSaldoPrev: conta.saldo_inicial,
        },
        {
          nCodLancamento: 1,
          cSituacao: "Conciliado",
          dDataLancamento: params.periodoFinal,
          cDesCliente: "Cliente Fake",
          cTipoDocumento: "Dinheiro",
          cNumero: "0000001",
          nValorDocumento: 150,
          nSaldo: conta.saldo_inicial + 150,
          nSaldoPrev: conta.saldo_inicial + 150,
          cDesCategoria: "Vendas (fake)",
          cNatureza: "R",
        },
      ],
    };
  }
}
