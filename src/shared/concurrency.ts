/**
 * Executa `fn` para cada item de `items`, no máximo `limit` chamadas em
 * paralelo por vez. Necessário porque a Omie aplica rate limit ("consumo
 * indevido") quando muitas chamadas batem ao mesmo tempo — descoberto ao
 * testar `consultarClientesPorCodigo` com ~20 códigos em paralelo: parte
 * falhava por rate limit e era erroneamente tratada como "não encontrado"
 * (o `OmieClient` já faz retry com backoff por chamada individual, mas isso
 * não ajuda se todas as chamadas colidem no mesmo instante).
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = new Array(items.length);
  let next = 0;

  async function worker() {
    while (next < items.length) {
      const index = next++;
      try {
        const value = await fn(items[index]);
        results[index] = { status: "fulfilled", value };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, items.length) }, () => worker());
  await Promise.all(workers);
  return results;
}
