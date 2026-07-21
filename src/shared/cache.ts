/**
 * Cache genérico em memória com TTL, usado para dados "de apoio" da Omie
 * (cadastros que mudam pouco: bancos, cidades, países, NCM, unidades,
 * famílias, categorias, departamentos, fases/origens/soluções de CRM).
 *
 * Lazy: só é populado quando o comando correspondente é chamado pela
 * primeira vez (ou depois de expirar) — não há pré-aquecimento.
 */

const DEFAULT_TTL_MS = Number(process.env.OMIE_CACHE_TTL_MS ?? 5 * 60 * 1000);

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

/** Monta a chave de cache a partir do resource/call/param de uma chamada Omie. */
export function chaveCache(resource: string, call: string, param?: Record<string, unknown>): string {
  return `${resource}:${call}:${JSON.stringify(param ?? {})}`;
}

/** Retorna o valor em cache se ainda válido; senão executa `fn`, guarda e retorna. */
export async function comCache<T>(chave: string, fn: () => Promise<T>, ttlMs = DEFAULT_TTL_MS): Promise<T> {
  const agora = Date.now();
  const entry = store.get(chave);
  if (entry && entry.expiresAt > agora) {
    return entry.value as T;
  }

  const value = await fn();
  store.set(chave, { value, expiresAt: agora + ttlMs });
  return value;
}

/** Limpa todo o cache, ou só as entradas cuja chave começa com `prefixo`. */
export function limparCache(prefixo?: string): void {
  if (!prefixo) {
    store.clear();
    return;
  }
  for (const chave of store.keys()) {
    if (chave.startsWith(prefixo)) store.delete(chave);
  }
}
