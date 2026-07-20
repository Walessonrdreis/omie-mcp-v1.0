import {
  ContaCorrenteOmie,
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
}
