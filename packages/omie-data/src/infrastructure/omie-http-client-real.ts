import { IOmieHttpClient, ListarProdutosResponseBruto } from "../domain/omie-http-client.js";

const OMIE_BASE_URL = "https://app.omie.com.br/api/v1";
const MAX_TENTATIVAS = 3;
const ESPERA_ENTRE_TENTATIVAS_MS = 500;

function aguardar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class OmieHttpClientReal implements IOmieHttpClient {
  constructor(
    private readonly appKey: string,
    private readonly appSecret: string
  ) {}

  async listarProdutosPagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarProdutosResponseBruto> {
    let ultimoErro: Error = new Error("Falha desconhecida ao chamar a API Omie");

    for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
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

      if (!response.ok) {
        ultimoErro = new Error(`API Omie respondeu HTTP ${response.status}`);
        if (response.status >= 500 && tentativa < MAX_TENTATIVAS) {
          await aguardar(ESPERA_ENTRE_TENTATIVAS_MS);
          continue;
        }
        throw ultimoErro;
      }

      const texto = await response.text();
      let json: unknown;
      try {
        json = JSON.parse(texto);
      } catch {
        throw new Error(`API Omie devolveu resposta inválida (não é JSON): ${texto.slice(0, 200)}`);
      }

      if (json && typeof json === "object" && ("faultstring" in json || "faultcode" in json)) {
        const falha = json as { faultstring?: string };
        throw new Error(falha.faultstring ?? "Erro desconhecido na API Omie");
      }

      return json as ListarProdutosResponseBruto;
    }

    throw ultimoErro;
  }
}
