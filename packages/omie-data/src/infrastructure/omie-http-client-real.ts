import { IOmieHttpClient, ListarProdutosResponseBruto } from "../domain/omie-http-client.js";

const OMIE_BASE_URL = "https://app.omie.com.br/api/v1";

export class OmieHttpClientReal implements IOmieHttpClient {
  constructor(
    private readonly appKey: string,
    private readonly appSecret: string
  ) {}

  async listarProdutosPagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarProdutosResponseBruto> {
    const response = await fetch(`${OMIE_BASE_URL}/geral/produtos/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        call: "ListarProdutos",
        app_key: this.appKey,
        app_secret: this.appSecret,
        param: [{ pagina, registros_por_pagina: registrosPorPagina, apenas_importado_api: "N" }],
      }),
    });

    const texto = await response.text();
    const json = JSON.parse(texto);

    if (json && (json.faultstring || json.faultcode)) {
      throw new Error(json.faultstring ?? "Erro desconhecido na API Omie");
    }

    return json as ListarProdutosResponseBruto;
  }
}
