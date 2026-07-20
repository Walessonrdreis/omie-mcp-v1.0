import { z } from "zod";

export const gerarFluxoCaixaParamSchema = z.object({
  data_inicio: z.string().describe("Data inicial do período, formato dd/mm/aaaa."),
  data_fim: z.string().describe("Data final do período, formato dd/mm/aaaa."),
  agrupamento: z
    .enum(["dia", "mes"])
    .optional()
    .describe("Granularidade das linhas do fluxo: 'dia' (padrão) ou 'mes'."),
  incluir_previsto: z
    .boolean()
    .optional()
    .describe(
      "Se true (padrão), inclui também o que está previsto (contas a pagar/receber em aberto, " +
        "ainda não liquidadas) além do que já foi realizado (pago/recebido). Se false, mostra só " +
        "o realizado."
    ),
  apenas_favoritas: z
    .boolean()
    .optional()
    .describe(
      "Se true (padrão), restringe o fluxo às contas correntes marcadas como favoritas pelo " +
        "usuário (Cartão NuBank, Stone, Banco do Brasil, Wix, iFood, Sicoob, Itaú, Cartão Elo " +
        "LEANDRO, Amazon, CAIXA LOJA), ignorando as demais dezenas de contas cadastradas na Omie " +
        "(cartões antigos, adquirentes específicas, etc.). Se false, considera todas as contas."
    ),
  codigos_conta_corrente: z
    .array(z.number())
    .optional()
    .describe(
      "Lista explícita de códigos de conta corrente (nCodCC, via omie_contas_correntes_listar) " +
        "pra restringir o fluxo — sobrepõe apenas_favoritas quando informado."
    ),
  usar_saldo_real: z
    .boolean()
    .optional()
    .describe(
      "Se true, ancora o saldo acumulado no saldo_inicial/saldo_data cadastrado de cada conta " +
        "corrente (via omie_contas_correntes_listar) — busca os movimentos realizados entre a " +
        "saldo_data e o início do período pedido e soma ao saldo_inicial, chegando num valor " +
        "próximo do saldo bancário real (em vez de só a variação dentro do período). Requer que " +
        "a conta tenha saldo_data/saldo_inicial configurados na Omie (data anterior ou igual a " +
        "data_inicio) — contas sem isso configurado ficam com saldoRealAcumulado nulo. Pode ser " +
        "mais lento (busca movimentos extras desde a saldo_data). Padrão: false."
    ),
});

export type GerarFluxoCaixaParam = z.infer<typeof gerarFluxoCaixaParamSchema>;

export interface LinhaFluxoCaixa {
  /** Data (dd/mm/aaaa) se agrupamento='dia', ou mês (mm/aaaa) se agrupamento='mes'. */
  periodo: string;
  codigoContaCorrente: number;
  descricaoContaCorrente: string;
  entradasRealizadas: number;
  saidasRealizadas: number;
  saldoRealizadoPeriodo: number;
  /** Saldo realizado acumulado desde o início do período consultado (NÃO é o saldo bancário real). */
  saldoRealizadoAcumulado: number;
  entradasPrevistas: number;
  saidasPrevistas: number;
  /** saldoRealizadoPeriodo + entradasPrevistas - saidasPrevistas. */
  saldoProjetadoPeriodo: number;
  saldoProjetadoAcumulado: number;
  /**
   * Só preenchido quando `usar_saldo_real: true` E a conta tem saldo_data/saldo_inicial
   * configurados na Omie (anterior ou igual a data_inicio): saldo_inicial + movimentos
   * realizados desde a saldo_data + saldoRealizadoAcumulado. Aproximação do saldo bancário
   * real. `null` quando não há saldo_data configurado ou ela é posterior a data_inicio.
   */
  saldoRealAcumulado: number | null;
}

export interface GerarFluxoCaixaResult {
  dataInicio: string;
  dataFim: string;
  agrupamento: "dia" | "mes";
  /**
   * Aviso sobre a limitação do saldo acumulado — não é o saldo bancário
   * real, é a variação líquida dentro do período consultado (a Omie não
   * expõe saldo diário histórico por conta, só o saldo_inicial cadastrado).
   */
  avisoSaldo: string;
  linhas: LinhaFluxoCaixa[];
  totalMovimentosRealizados: number;
  totalMovimentosPrevistos: number;
}
