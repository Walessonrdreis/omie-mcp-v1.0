import { NotaFiscalOmie } from "../../domain/interfaces/nfe-gateway.js";
import { ItemNotaFiscal, NotaFiscalDetalhe, NotaFiscalResumo } from "../dto/nfe.dto.js";

export function mapearNotaFiscalResumo(nota: NotaFiscalOmie): NotaFiscalResumo {
  return {
    codigoNota: nota.compl.nIdNF,
    chave: nota.compl.cChaveNFe,
    numero: nota.ide.nNF,
    serie: nota.ide.serie,
    dataEmissao: nota.ide.dEmi,
    cancelada: nota.ide.dCan !== "",
    tipo: nota.ide.tpNF === "1" ? "saida" : "entrada",
    ambiente: nota.ide.tpAmb === "1" ? "producao" : "homologacao",
    cliente: nota.nfDestInt.cRazao,
    cnpjCpf: nota.nfDestInt.cnpj_cpf,
    valorTotal: nota.total.ICMSTot.vNF,
    quantidadeItens: nota.det.length,
  };
}

function mapearItem(item: NotaFiscalOmie["det"][number]): ItemNotaFiscal {
  return {
    codigo: item.prod.cProd,
    descricao: item.prod.xProd,
    ncm: item.prod.NCM,
    cfop: item.prod.CFOP,
    quantidade: item.prod.qCom,
    unidade: item.prod.uCom,
    valorUnitario: item.prod.vUnCom,
    valorTotal: item.prod.vProd,
  };
}

export function mapearNotaFiscalDetalhe(nota: NotaFiscalOmie): NotaFiscalDetalhe {
  return {
    ...mapearNotaFiscalResumo(nota),
    itens: nota.det.map(mapearItem),
    codigoPedido: nota.compl.nIdPedido || undefined,
    titulos: (nota.titulos ?? []).map((t) => ({
      numero: t.cNumTitulo,
      vencimento: t.dDtVenc,
      valor: t.nValorTitulo,
    })),
  };
}
