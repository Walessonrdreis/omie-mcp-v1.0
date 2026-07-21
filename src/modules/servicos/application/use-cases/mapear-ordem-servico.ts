import { OrdemServicoOmie } from "../../domain/interfaces/ordem-servico-gateway.js";
import { OSDetalhe, OSResumo } from "../dto/ordem-servico.dto.js";

export function mapearOSResumo(os: OrdemServicoOmie): OSResumo {
  return {
    codigoOS: os.Cabecalho.nCodOS,
    codIntOS: os.Cabecalho.cCodIntOS,
    numero: os.Cabecalho.cNumOS,
    codigoCliente: os.Cabecalho.nCodCli,
    etapa: os.Cabecalho.cEtapa,
    dataPrevisao: os.Cabecalho.dDtPrevisao,
    valorTotal: os.Cabecalho.nValorTotal,
    faturada: os.InfoCadastro.cFaturada === "S",
    cancelada: os.InfoCadastro.cCancelada === "S",
  };
}

export function mapearOSDetalhe(os: OrdemServicoOmie): OSDetalhe {
  return {
    ...mapearOSResumo(os),
    itens: os.ServicosPrestados.map((item) => ({
      descricao: item.cDescServ,
      quantidade: item.nQtde,
      valorUnitario: item.nValUnit,
    })),
  };
}
