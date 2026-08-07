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

/** Espera padrão quando a Omie sinaliza bloqueio momentâneo sem dizer quanto esperar. */
const ESPERA_RATE_LIMIT_PADRAO_MS = 2000;

/**
 * Quanto esperar antes de tentar de novo, ou `null` se o erro não é
 * recuperável. Replica a semântica de `calcularEsperaRetry` em
 * `src/integrations/omie/omieClient.ts` (servidor raiz, já em produção): o
 * rate limit da Omie não chega como HTTP 429/5xx, e sim como `faultstring`
 * dentro de um HTTP 200 — "consumo indevido" (rate limit) ou "consumo
 * redundante" (chamadas próximas demais). Quando a própria Omie informa
 * "Aguarde N segundos", esse tempo é honrado. Qualquer outra `faultstring`
 * (credencial inválida, parâmetro errado) continua falhando na hora, sem
 * retry inútil.
 */
function calcularEsperaRetry(faultCode: unknown, faultstring: unknown): number | null {
  const mensagem = String(faultstring ?? "").toLowerCase();

  const segundosSugeridos = mensagem.match(/aguarde (\d+) segundos?/i);
  if (segundosSugeridos) {
    return (Number(segundosSugeridos[1]) + 1) * 1000;
  }

  const isRateLimit = faultCode === "SOAP-ENV:Client-500" || mensagem.includes("consumo indevido");
  const isRedundante = faultCode === "SOAP-ENV:Client-6" || mensagem.includes("consumo redundante");

  if (isRateLimit || isRedundante) {
    return ESPERA_RATE_LIMIT_PADRAO_MS;
  }

  return null;
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
        // Além dos 5xx, a Omie também sinaliza rate limit por status HTTP em
        // alguns casos — 425/429, os mesmos que `calcularEsperaRetry` em
        // src/integrations/omie/omieClient.ts reconhece. Os demais 4xx (400,
        // 401, ...) continuam sendo erro real, sem retry inútil.
        const ehRateLimitHttp = response.status === 425 || response.status === 429;
        if ((response.status >= 500 || ehRateLimitHttp) && tentativa < MAX_TENTATIVAS) {
          await aguardar(ehRateLimitHttp ? ESPERA_RATE_LIMIT_PADRAO_MS : ESPERA_ENTRE_TENTATIVAS_MS);
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
        const falha = json as { faultstring?: string; faultcode?: string };
        ultimoErro = new Error(falha.faultstring ?? "Erro desconhecido na API Omie");

        const espera = calcularEsperaRetry(falha.faultcode, falha.faultstring);
        if (espera !== null && tentativa < MAX_TENTATIVAS) {
          await aguardar(espera);
          continue;
        }
        throw ultimoErro;
      }

      return json as ListarOrdemProducaoResponseBruto;
    }

    throw ultimoErro;
  }
}
