import { input, password, select } from "@inquirer/prompts";
import { rodarConfigurar, ResultadoConfigurar } from "./rodar-configurar.js";
import { IOmieHttpClient } from "../domain/omie-http-client.js";

export interface IPromptsMenu {
  selecionarComando(): Promise<"produtos" | "ajuda" | "configurar" | "sair">;
  perguntarAppKey(): Promise<string>;
  perguntarAppSecret(): Promise<string>;
}

export function criarPromptsMenuReais(): IPromptsMenu {
  return {
    async selecionarComando() {
      return select({
        message: "O que você quer fazer?",
        choices: [
          { name: "Produtos", value: "produtos" as const },
          { name: "Ajuda", value: "ajuda" as const },
          { name: "Configurar", value: "configurar" as const },
          { name: "Sair", value: "sair" as const },
        ],
      });
    },
    async perguntarAppKey() {
      return input({ message: "App Key:" });
    },
    async perguntarAppSecret() {
      return password({ message: "App Secret:", mask: "*" });
    },
  };
}

export type ResultadoMenu =
  | { tipo: "sair" }
  | { tipo: "ajuda" }
  | { tipo: "configurar"; resultado: ResultadoConfigurar }
  | { tipo: "produtos_sem_credencial" }
  | { tipo: "produtos"; saida: "voltar" | "sair" };

export async function rodarMenuPrincipal(
  temCredencial: () => boolean,
  criarClienteConfigurar: (appKey: string, appSecret: string) => IOmieHttpClient,
  abrirProdutos: () => Promise<"voltar" | "sair">,
  prompts: IPromptsMenu = criarPromptsMenuReais()
): Promise<ResultadoMenu> {
  const comando = await prompts.selecionarComando();

  if (comando === "sair") {
    return { tipo: "sair" };
  }

  if (comando === "ajuda") {
    return { tipo: "ajuda" };
  }

  if (comando === "configurar") {
    const appKey = await prompts.perguntarAppKey();
    const appSecret = await prompts.perguntarAppSecret();
    const client = criarClienteConfigurar(appKey, appSecret);
    const resultado = await rodarConfigurar(appKey, appSecret, client);
    return { tipo: "configurar", resultado };
  }

  if (!temCredencial()) {
    return { tipo: "produtos_sem_credencial" };
  }

  const saida = await abrirProdutos();
  return { tipo: "produtos", saida };
}
