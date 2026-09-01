export function limparTexto(texto: string = ''): string {
  return texto
    .replace(/<[^>]*>/g, ' ')
    .replace(/\{\{.*?\}\}/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function criarGeradorComSeed(textoSeed: string): () => number {
  let seed = 0;
  for (let i = 0; i < textoSeed.length; i++) {
    seed = (seed * 31 + textoSeed.charCodeAt(i)) >>> 0;
  }
  return function () {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

export function embaralharComSeed<T>(lista: T[], aleatorio: () => number): T[] {
  const copia = [...lista];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(aleatorio() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}
