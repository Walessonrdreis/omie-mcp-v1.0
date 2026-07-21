import {
  BoletoOmie,
  IContasReceberGateway,
} from "../../domain/interfaces/contas-receber-gateway.js";
import {
  BoletoResult,
  CancelamentoBoletoResult,
  CodigoTituloParam,
  ProrrogarBoletoParam,
} from "../dto/boleto.dto.js";

function mapearBoleto(boleto: BoletoOmie): BoletoResult {
  return {
    linkBoleto: boleto.cLinkBoleto,
    codigoStatus: boleto.cCodStatus,
    descricaoStatus: boleto.cDesStatus,
    dataEmissao: boleto.dDtEmBol,
    numeroBoleto: boleto.cNumBoleto,
    codigoBarras: boleto.cCodBarras,
  };
}

export class GerarBoletoUseCase {
  constructor(private readonly gateway: IContasReceberGateway) {}

  async execute(param: CodigoTituloParam): Promise<BoletoResult> {
    return mapearBoleto(await this.gateway.gerarBoleto(param.codigo_titulo));
  }
}

export class ObterBoletoUseCase {
  constructor(private readonly gateway: IContasReceberGateway) {}

  async execute(param: CodigoTituloParam): Promise<BoletoResult> {
    return mapearBoleto(await this.gateway.obterBoleto(param.codigo_titulo));
  }
}

export class ProrrogarBoletoUseCase {
  constructor(private readonly gateway: IContasReceberGateway) {}

  async execute(param: ProrrogarBoletoParam): Promise<BoletoResult> {
    return mapearBoleto(
      await this.gateway.prorrogarBoleto(param.codigo_titulo, param.nova_data_vencimento)
    );
  }
}

export class CancelarBoletoUseCase {
  constructor(private readonly gateway: IContasReceberGateway) {}

  async execute(param: CodigoTituloParam): Promise<CancelamentoBoletoResult> {
    const status = await this.gateway.cancelarBoleto(param.codigo_titulo);
    return { codigoStatus: status.cCodStatus, descricaoStatus: status.cDesStatus };
  }
}
