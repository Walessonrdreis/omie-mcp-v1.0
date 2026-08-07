import { IProdutosHttpClient, ListarProdutosResponseBruto } from "../domain/produtos-http-client.js";
import { IEstoqueHttpClient, ListarPosEstoqueResponseBruto } from "../domain/estoque-http-client.js";
import {
  IOrdemProducaoHttpClient,
  ListarOrdemProducaoResponseBruto,
} from "../domain/ordem-producao-http-client.js";

const OMIE_BASE_URL = "https://app.omie.com.br/api/v1";
const MAX_TENTATIVAS = 3;
const ESPERA_ENTRE_TENTATIVAS_MS = 500;

function aguardar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class OmieHttpClientReal
  implements IProdutosHttpClient, IEstoqueHttpClient, IOrdemProducaoHttpClient
{
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
          param: [
            {
              pagina,
              registros_por_pagina: registrosPorPagina,
              apenas_importado_api: "N",
              filtrar_apenas_omiepdv: "N",
            },
          ],
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

  async listarPosicoesEstoquePagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarPosEstoqueResponseBruto> {
    let ultimoErro: Error = new Error("Falha desconhecida ao chamar a API Omie");

    for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
      const response = await fetch(`${OMIE_BASE_URL}/estoque/consulta/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          call: "ListarPosEstoque",
          app_key: this.appKey,
          app_secret: this.appSecret,
          param: [
            {
              nPagina: pagina,
              nRegPorPagina: registrosPorPagina,
              codigo_local_estoque: 0,
            },
          ],
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

      return json as ListarPosEstoqueResponseBruto;
    }

    throw ultimoErro;
  }

  /**
   * Endpoint/call/payload conferidos contra o gateway já validado em produção
   * (`src/modules/ordemProducao/infrastructure/gateways/op-omie-gateway.ts` +
   * `OmieClient.call`, que envia `param: [param]`): recurso `produtos/op`,
   * call `ListarOrdemProducao`, campos `pagina` e `registros_por_pagina`.
   */
  async listarOrdensProducaoPagina(
    pagina: number,
    registrosPorPagina: number
  ): Promise<ListarOrdemProducaoResponseBruto> {
    let ultimoErro: Error = new Error("Falha desconhecida ao chamar a API Omie");

    for (let tentativa = 1; tentativa <= MAX_TENTATIVAS; tentativa++) {
      const response = await fetch(`${OMIE_BASE_URL}/produtos/op/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          call: "ListarOrdemProducao",
          app_key: this.appKey,
          app_secret: this.appSecret,
          param: [
            {
              pagina,
              registros_por_pagina: registrosPorPagina,
            },
          ],
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

      return json as ListarOrdemProducaoResponseBruto;
    }

    throw ultimoErro;
  }
}
