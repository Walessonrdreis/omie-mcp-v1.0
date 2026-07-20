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
 * Este cliente centraliza autenticação, tratamento de erros, retries e
 * throttling, permitindo que qualquer endpoint da Omie (Chão de Fábrica ou
 * outros módulos) seja chamado de forma genérica e consistente — todo
 * módulo do MCP passa por aqui, então uma proteção adicionada aqui vale pra
 * todos, sem precisar duplicar em cada gateway.
 */

const OMIE_BASE_URL = "https://app.omie.com.br/api/v1";

/** Espaçamento mínimo entre o INÍCIO de duas requisições consecutivas desta instância. */
const INTERVALO_MINIMO_MS = 300;

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

/**
 * Se/quanto esperar antes de tentar de novo, baseado no erro que a Omie
 * devolveu. Cobre os dois tipos de bloqueio momentâneo já observados em
 * produção: rate limit ("consumo indevido") e chamadas próximas demais
 * ("consumo redundante" — a Omie geralmente informa quantos segundos
 * esperar na própria mensagem, ex: "Aguarde 57 segundos").
 */
function calcularEsperaRetry(faultCode: unknown, faultstring: unknown, httpStatus: number): number | null {
  const mensagem = String(faultstring ?? "").toLowerCase();

  const segundosSugeridos = mensagem.match(/aguarde (\d+) segundos?/i);
  if (segundosSugeridos) {
    return (Number(segundosSugeridos[1]) + 1) * 1000;
  }

  const isRateLimit =
    faultCode === "SOAP-ENV:Client-500" ||
    mensagem.includes("consumo indevido") ||
    httpStatus === 425 ||
    httpStatus === 429;
  const isRedundante = faultCode === "SOAP-ENV:Client-6" || mensagem.includes("consumo redundante");

  if (isRateLimit || isRedundante) {
    return 2000;
  }

  return null;
}

export class OmieClient {
  private readonly appKey: string;
  private readonly appSecret: string;

  /** Serializa o espaçamento mínimo entre requisições desta instância (ver INTERVALO_MINIMO_MS). */
  private filaDeSaida: Promise<void> = Promise.resolve();

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
    await this.aguardarVez();

    const url = `${OMIE_BASE_URL}/${options.resource.replace(/^\/|\/$/g, "")}/`;

    const body = {
      call: options.call,
      app_key: this.appKey,
      app_secret: this.appSecret,
      param: [options.param ?? {}],
    };

    const maxAttempts = 4;
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
          const espera = calcularEsperaRetry(json.faultcode, json.faultstring, response.status);
          if (espera !== null && attempt < maxAttempts) {
            await sleep(espera);
            continue;
          }
          throw new OmieApiError(
            json.faultstring ?? "Erro desconhecido na API Omie",
            json.faultcode,
            json
          );
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

  /**
   * Garante um espaçamento mínimo (INTERVALO_MINIMO_MS) entre o início de
   * cada requisição desta instância, mesmo que várias chamadas cheguem ao
   * mesmo tempo (ex: `Promise.all` de dois use-cases, ou `mapWithConcurrency`
   * de um gateway) — reduz a chance de cair em "consumo redundante" antes
   * mesmo de precisar dos retries acima.
   */
  private aguardarVez(): Promise<void> {
    const minhaVez = this.filaDeSaida.then(() => sleep(INTERVALO_MINIMO_MS));
    this.filaDeSaida = minhaVez;
    return minhaVez;
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
