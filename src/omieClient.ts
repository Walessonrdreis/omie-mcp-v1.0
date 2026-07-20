/**
 * Cliente HTTP genérico para a API da Omie.
 *
 * Todas as APIs da Omie seguem o mesmo formato de requisição:
 *   POST https://app.omie.com.br/api/v1/{modulo}/{recurso}/
 *   {
 *     "call": "NomeDoMetodo",
 *     "app_key": "...",
 *     "app_secret": "...",
 *     "param": [ { ... } ]
 *   }
 *
 * Este cliente centraliza autenticação, tratamento de erros e retries simples,
 * permitindo que qualquer endpoint da Omie (Chão de Fábrica ou outros módulos)
 * seja chamado de forma genérica.
 */

const OMIE_BASE_URL = "https://app.omie.com.br/api/v1";

export interface OmieCallOptions {
  /** Caminho do recurso, ex: "produtos/op", "geral/clientes", "estoque/consulta" */
  resource: string;
  /** Nome do método/chamada da Omie, ex: "IncluirOrdemProducao" */
  call: string;
  /** Parâmetros da chamada (objeto único, será enviado como param: [param]) */
  param?: Record<string, unknown>;
}

export class OmieApiError extends Error {
  constructor(
    message: string,
    public readonly faultCode?: string | number,
    public readonly raw?: unknown
  ) {
    super(message);
    this.name = "OmieApiError";
  }
}

export class OmieClient {
  private readonly appKey: string;
  private readonly appSecret: string;

  constructor(appKey?: string, appSecret?: string) {
    const key = appKey ?? process.env.OMIE_APP_KEY;
    const secret = appSecret ?? process.env.OMIE_APP_SECRET;

    if (!key || !secret) {
      throw new Error(
        "Credenciais da Omie não configuradas. Defina OMIE_APP_KEY e OMIE_APP_SECRET " +
          "nas variáveis de ambiente (ex: arquivo .env)."
      );
    }

    this.appKey = key;
    this.appSecret = secret;
  }

  async call<T = unknown>(options: OmieCallOptions): Promise<T> {
    const url = `${OMIE_BASE_URL}/${options.resource.replace(/^\/|\/$/g, "")}/`;

    const body = {
      call: options.call,
      app_key: this.appKey,
      app_secret: this.appSecret,
      param: [options.param ?? {}],
    };

    const maxAttempts = 3;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const text = await response.text();
        let json: any;
        try {
          json = JSON.parse(text);
        } catch {
          throw new OmieApiError(
            `Resposta não-JSON da Omie (HTTP ${response.status}): ${text.slice(0, 500)}`
          );
        }

        // A Omie retorna erros com faultstring/faultcode mesmo em HTTP 200,
        // e também usa códigos HTTP não-2xx em alguns casos (ex: rate limit).
        if (json && (json.faultstring || json.faultcode)) {
          const code = json.faultcode;
          // Rate limit / bloqueio momentâneo: tenta novamente com backoff
          if (
            (code === "SOAP-ENV:Client-500" ||
              String(json.faultstring || "").toLowerCase().includes("consumo indevido") ||
              response.status === 425 ||
              response.status === 429) &&
            attempt < maxAttempts
          ) {
            await sleep(attempt * 1000);
            continue;
          }
          throw new OmieApiError(json.faultstring ?? "Erro desconhecido na API Omie", code, json);
        }

        if (!response.ok) {
          throw new OmieApiError(
            `Erro HTTP ${response.status} ao chamar Omie: ${text.slice(0, 500)}`,
            response.status
          );
        }

        return json as T;
      } catch (err) {
        lastError = err;
        if (err instanceof OmieApiError) throw err;
        if (attempt >= maxAttempts) break;
        await sleep(attempt * 500);
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("Falha desconhecida ao chamar a API da Omie");
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
