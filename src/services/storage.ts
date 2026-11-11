/**
 * Leitura e escrita no localStorage com tratamento de erros.
 * Todas as chaves do projeto começam com "reservas-saint-marc:".
 *
 * Se o navegador bloquear o armazenamento (prévia dentro de um app, aba anônima restrita),
 * os dados ficam na memória até fechar a página, em vez de o site parar de funcionar.
 */

const PREFIX = "reservas-saint-marc:";
const memoria = new Map<string, string>();

export class StorageError extends Error {}

function ler(key: string): string | null {
  try {
    return localStorage.getItem(PREFIX + key);
  } catch {
    return memoria.get(key) ?? null;
  }
}

export function readJSON<T>(key: string): T | null {
  const raw = ler(key);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new StorageError("Os dados salvos neste navegador estão corrompidos.");
  }
}

export function writeJSON(key: string, value: unknown): void {
  const texto = JSON.stringify(value);
  try {
    localStorage.setItem(PREFIX + key, texto);
  } catch {
    memoria.set(key, texto);
  }
}

export function removeItem(key: string): void {
  memoria.delete(key);
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // Sem acesso ao armazenamento: não há o que remover.
  }
}
