import { IContasCorrentesGateway } from "../../domain/interfaces/contas-correntes-gateway.js";
import { aplicarFiltros } from "../../../../shared/filtro.js";
import { ConsultarExtratoParam, ExtratoContaCorrenteResult, MovimentoExtrato } from "../dto/extrato.dto.js";

function natureza(n?: string): "receita" | "despesa" | "indefinida" {
  if (n === "R") return "receita";
  if (n === "D") return "despesa";
  return "indefinida";
}

export class ConsultarExtratoUseCase {
  constructor(private readonly gateway: IContasCorrentesGateway) {}

  async execute(param: ConsultarExtratoParam): Promise<ExtratoContaCorrenteResult> {
    const extrato = await this.gateway.consultarExtrato({
      codigoContaCorrente: param.codigo_conta_corrente,
      periodoInicial: param.periodo_inicial,
      periodoFinal: param.periodo_final,
    });

    const movimentos: MovimentoExtrato[] = extrato.listaMovimentos.map((m) => ({
      codigoLancamento: m.nCodLancamento,
      situacao: m.cSituacao,
      data: m.dDataLancamento,
      descricao: m.cDesCliente,
      tipoDocumento: m.cTipoDocumento,
      numero: m.cNumero,
      valor: m.nValorDocumento,
      saldoApos: m.nSaldo,
      categoria: m.cDesCategoria,
      documentoFiscal: m.cDocumentoFiscal,
      natureza: natureza(m.cNatureza),
      observacoes: m.cObservacoes,
    }));

    return {
      codigoContaCorrente: extrato.nCodCC,
      descricaoConta: extrato.cDescricao,
      periodoInicial: extrato.dPeriodoInicial,
      periodoFinal: extrato.dPeriodoFinal,
      saldoAnterior: extrato.nSaldoAnterior,
      saldoAtual: extrato.nSaldoAtual,
      saldoConciliado: extrato.nSaldoConciliado,
      saldoDisponivel: extrato.nSaldoDisponivel,
      movimentos: aplicarFiltros(movimentos, param.filtros),
    };
  }
}
