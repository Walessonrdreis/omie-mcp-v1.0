import { IOmieHttpClient } from "../domain/omie-http-client.js";
import { salvarCredencial } from "../infrastructure/credenciais.js";

export type ResultadoConfigurar =
  | { status: "ok"; hash: string }
  | { status: "invalido"; erro: string };

export async function rodarConfigurar(
  appKey: string,
  appSecret: string,
  client: IOmieHttpClient
): Promise<ResultadoConfigurar> {
  try {
    await client.listarProdutosPagina(1, 1);
  } catch (erro) {
    return { status: "invalido", erro: erro instanceof Error ? erro.message : String(erro) };
  }

  const hash = salvarCredencial(appKey, appSecret);
  return { status: "ok", hash };
}
