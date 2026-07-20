import {
  ContaCorrenteOmie,
  IContasCorrentesGateway,
} from "../../../contasCorrentes/domain/interfaces/contas-correntes-gateway.js";
import { IFinancasGateway, MovimentoFinanceiro } from "../../domain/interfaces/financas-gateway.js";
import { CODIGOS_CONTAS_FAVORITAS } from "../contas-favoritas.js";
import {
  GerarFluxoCaixaParam,
  GerarFluxoCaixaResult,
  LinhaFluxoCaixa,
} from "../dto/gerar-fluxo-caixa.dto.js";

const STATUS_CANCELADO = "CANCELADO";

interface Acumulador {
  data: Date;
  periodo: string;
  codigoContaCorrente: number;
  entradasRealizadas: number;
  saidasRealizadas: number;
  entradasPrevistas: number;
  saidasPrevistas: number;
}

/**
 * A Omie não tem "fluxo de caixa" pronto: `ListarMovimentos` só devolve
 * lançamento por lançamento (contas a pagar/receber), paginado a 100 por
 * vez. Esse use-case busca o realizado (por data de pagamento) e,
 * opcionalmente, o previsto (por data de vencimento, só o que ainda está em
 * aberto — `nValAberto > 0` — e não cancelado), agrega por dia/mês e por
 * conta corrente, e calcula saldo acumulado dentro do período consultado.
 *
 * Importante: o saldo acumulado aqui é a VARIAÇÃO dentro do período pedido,
 * não o saldo bancário real da conta (a Omie não expõe histórico de saldo
 * diário por conta via API) — por isso o resultado sempre inclui um aviso
 * explícito sobre essa limitação.
 */
export class GerarFluxoCaixaUseCase {
  constructor(
    private readonly financasGateway: IFinancasGateway,
    private readonly contasCorrentesGateway: IContasCorrentesGateway
  ) {}

  async execute(param: GerarFluxoCaixaParam): Promise<GerarFluxoCaixaResult> {
    const agrupamento = param.agrupamento ?? "dia";
    const incluirPrevisto = param.incluir_previsto ?? true;
    const apenasFavoritas = param.apenas_favoritas ?? true;
    const codigosPermitidos =
      param.codigos_conta_corrente ?? (apenasFavoritas ? CODIGOS_CONTAS_FAVORITAS : null);
    const filtroContas = codigosPermitidos ? new Set(codigosPermitidos) : null;

    // A Omie rejeita duas chamadas concorrentes do MESMO método
    // (ListarMovimentos), mesmo com parâmetros diferentes ("Já existe uma
    // requisição desse método sendo executada") — por isso os dois passes
    // (realizado/previsto) rodam em sequência, não em paralelo. A consulta
    // de contas correntes é um método diferente, então pode rodar junto.
    const [movimentosRealizados, mapaContas] = await Promise.all([
      this.financasGateway.listarTodosMovimentos({
        campoData: "pagamento",
        dataDe: param.data_inicio,
        dataAte: param.data_fim,
      }),
      this.contasCorrentesGateway.mapaContasPorCodigo(),
    ]);

    const movimentosPrevistos = incluirPrevisto
      ? await this.financasGateway.listarTodosMovimentos({
          campoData: "vencimento",
          dataDe: param.data_inicio,
          dataAte: param.data_fim,
        })
      : [];

    const usarSaldoReal = param.usar_saldo_real ?? false;
    const offsetInicialPorConta = usarSaldoReal
      ? await this.calcularOffsetInicialPorConta(param.data_inicio, mapaContas, filtroContas)
      : new Map<number, number>();

    const pertenceAoFiltro = (m: MovimentoFinanceiro) =>
      filtroContas === null || filtroContas.has(m.detalhes?.nCodCC);

    const realizadosFiltrados = movimentosRealizados.filter(pertenceAoFiltro);

    const previstosAbertos = movimentosPrevistos.filter(
      (m) =>
        m.detalhes != null &&
        m.resumo != null &&
        m.detalhes.cStatus !== STATUS_CANCELADO &&
        m.resumo.nValAberto > 0 &&
        pertenceAoFiltro(m)
    );

    const acumuladores = new Map<string, Acumulador>();

    const chave = (data: Date, nCodCC: number) =>
      `${formatarPeriodo(data, agrupamento)}|${nCodCC}`;

    const obterAcumulador = (movimento: MovimentoFinanceiro, data: Date): Acumulador => {
      const nCodCC = movimento.detalhes.nCodCC;
      const k = chave(data, nCodCC);
      let acc = acumuladores.get(k);
      if (!acc) {
        acc = {
          data: iniciarPeriodo(data, agrupamento),
          periodo: formatarPeriodo(data, agrupamento),
          codigoContaCorrente: nCodCC,
          entradasRealizadas: 0,
          saidasRealizadas: 0,
          entradasPrevistas: 0,
          saidasPrevistas: 0,
        };
        acumuladores.set(k, acc);
      }
      return acc;
    };

    for (const movimento of realizadosFiltrados) {
      if (movimento.detalhes == null || movimento.resumo == null) continue;
      const data = parseDataBr(movimento.detalhes.dDtPagamento);
      if (!data) continue;
      const acc = obterAcumulador(movimento, data);
      if (movimento.detalhes.cNatureza === "R") {
        acc.entradasRealizadas += movimento.resumo.nValPago;
      } else {
        acc.saidasRealizadas += movimento.resumo.nValPago;
      }
    }

    for (const movimento of previstosAbertos) {
      const data = parseDataBr(movimento.detalhes.dDtVenc);
      if (!data) continue;
      const acc = obterAcumulador(movimento, data);
      if (movimento.detalhes.cNatureza === "R") {
        acc.entradasPrevistas += movimento.resumo.nValAberto;
      } else {
        acc.saidasPrevistas += movimento.resumo.nValAberto;
      }
    }

    const linhasOrdenadas = [...acumuladores.values()].sort((a, b) => {
      if (a.codigoContaCorrente !== b.codigoContaCorrente) {
        return a.codigoContaCorrente - b.codigoContaCorrente;
      }
      return a.data.getTime() - b.data.getTime();
    });

    const saldoAcumuladoPorConta = new Map<number, { realizado: number; projetado: number }>();
    const linhas: LinhaFluxoCaixa[] = linhasOrdenadas.map((acc) => {
      const saldoRealizadoPeriodo = round2(acc.entradasRealizadas - acc.saidasRealizadas);
      const saldoProjetadoPeriodo = round2(
        saldoRealizadoPeriodo + acc.entradasPrevistas - acc.saidasPrevistas
      );

      const anterior = saldoAcumuladoPorConta.get(acc.codigoContaCorrente) ?? {
        realizado: 0,
        projetado: 0,
      };
      const saldoRealizadoAcumulado = round2(anterior.realizado + saldoRealizadoPeriodo);
      const saldoProjetadoAcumulado = round2(anterior.projetado + saldoProjetadoPeriodo);
      saldoAcumuladoPorConta.set(acc.codigoContaCorrente, {
        realizado: saldoRealizadoAcumulado,
        projetado: saldoProjetadoAcumulado,
      });

      const conta = mapaContas.get(acc.codigoContaCorrente);
      const offsetInicial = offsetInicialPorConta.get(acc.codigoContaCorrente);
      const saldoRealAcumulado =
        offsetInicial !== undefined ? round2(offsetInicial + saldoRealizadoAcumulado) : null;

      return {
        periodo: acc.periodo,
        codigoContaCorrente: acc.codigoContaCorrente,
        descricaoContaCorrente: conta?.descricao ?? "(conta não encontrada)",
        entradasRealizadas: round2(acc.entradasRealizadas),
        saidasRealizadas: round2(acc.saidasRealizadas),
        saldoRealizadoPeriodo,
        saldoRealizadoAcumulado,
        saldoRealAcumulado,
        entradasPrevistas: round2(acc.entradasPrevistas),
        saidasPrevistas: round2(acc.saidasPrevistas),
        saldoProjetadoPeriodo,
        saldoProjetadoAcumulado,
      };
    });

    return {
      dataInicio: param.data_inicio,
      dataFim: param.data_fim,
      agrupamento,
      avisoSaldo: usarSaldoReal
        ? "saldoRealAcumulado é o saldo_inicial cadastrado na conta (via " +
          "omie_contas_correntes_listar) + movimentos realizados desde a saldo_data — uma " +
          "aproximação do saldo bancário real, não um extrato oficial. Vem null pra contas sem " +
          "saldo_data/saldo_inicial configurados na Omie, ou com saldo_data posterior a " +
          "data_inicio. saldoRealizadoAcumulado/saldoProjetadoAcumulado continuam sendo só a " +
          "variação dentro do período, independente disso."
        : "saldoRealizadoAcumulado e saldoProjetadoAcumulado são a variação líquida DENTRO do " +
          "período consultado, por conta corrente — não é o saldo bancário real. Para uma " +
          "aproximação do saldo real, chame de novo com usar_saldo_real: true (usa o " +
          "saldo_inicial/saldo_data cadastrado em cada conta via omie_contas_correntes_listar).",
      linhas,
      totalMovimentosRealizados: realizadosFiltrados.length,
      totalMovimentosPrevistos: previstosAbertos.length,
    };
  }

  /**
   * Pra cada conta relevante com saldo_data/saldo_inicial configurados na Omie e saldo_data
   * anterior (ou igual) a data_inicio, calcula quanto somar ao saldo_inicial pra chegar no saldo
   * real no início do período pedido: saldo_inicial + movimentos realizados estritamente ENTRE a
   * saldo_data e data_inicio (a soma do próprio data_inicio já é feita na agregação normal do
   * fluxo, não duplicar aqui). Busca só uma vez, cobrindo todas as contas de uma vez (menor
   * intervalo necessário), respeitando a regra de não rodar duas ListarMovimentos em paralelo.
   */
  private async calcularOffsetInicialPorConta(
    dataInicio: string,
    mapaContas: Map<number, ContaCorrenteOmie>,
    filtroContas: Set<number> | null
  ): Promise<Map<number, number>> {
    const dataInicioDate = parseDataBr(dataInicio);
    const offsets = new Map<number, number>();
    if (!dataInicioDate) return offsets;

    const contasComAncora: { nCodCC: number; ancora: Date; saldoInicial: number }[] = [];
    for (const [nCodCC, conta] of mapaContas) {
      if (filtroContas && !filtroContas.has(nCodCC)) continue;
      const ancora = parseDataBr(conta.saldo_data);
      if (!ancora || ancora.getTime() > dataInicioDate.getTime()) continue;
      contasComAncora.push({ nCodCC, ancora, saldoInicial: conta.saldo_inicial ?? 0 });
      offsets.set(nCodCC, conta.saldo_inicial ?? 0);
    }
    if (contasComAncora.length === 0) return offsets;

    const ancoraMaisAntiga = contasComAncora.reduce((min, c) =>
      c.ancora.getTime() < min.getTime() ? c.ancora : min
    , contasComAncora[0].ancora);
    const dataDe = addDays(ancoraMaisAntiga, 1);
    const dataAte = addDays(dataInicioDate, -1);
    if (dataDe.getTime() > dataAte.getTime()) return offsets;

    const movimentos = await this.financasGateway.listarTodosMovimentos({
      campoData: "pagamento",
      dataDe: formatarDataBr(dataDe),
      dataAte: formatarDataBr(dataAte),
    });

    for (const { nCodCC, ancora } of contasComAncora) {
      let ajuste = 0;
      for (const movimento of movimentos) {
        if (movimento.detalhes == null || movimento.resumo == null) continue;
        if (movimento.detalhes.nCodCC !== nCodCC) continue;
        const data = parseDataBr(movimento.detalhes.dDtPagamento);
        if (!data || data.getTime() <= ancora.getTime()) continue;
        ajuste += movimento.detalhes.cNatureza === "R" ? movimento.resumo.nValPago : -movimento.resumo.nValPago;
      }
      offsets.set(nCodCC, (offsets.get(nCodCC) ?? 0) + ajuste);
    }

    return offsets;
  }
}

function parseDataBr(data: string): Date | null {
  const match = data.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, dia, mes, ano] = match;
  return new Date(Number(ano), Number(mes) - 1, Number(dia));
}

function addDays(data: Date, dias: number): Date {
  const resultado = new Date(data);
  resultado.setDate(resultado.getDate() + dias);
  return resultado;
}

function formatarDataBr(data: Date): string {
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

function iniciarPeriodo(data: Date, agrupamento: "dia" | "mes"): Date {
  return agrupamento === "mes" ? new Date(data.getFullYear(), data.getMonth(), 1) : data;
}

function formatarPeriodo(data: Date, agrupamento: "dia" | "mes"): string {
  const dia = String(data.getDate()).padStart(2, "0");
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const ano = data.getFullYear();
  return agrupamento === "mes" ? `${mes}/${ano}` : `${dia}/${mes}/${ano}`;
}

function round2(valor: number): number {
  return Math.round(valor * 100) / 100;
}
