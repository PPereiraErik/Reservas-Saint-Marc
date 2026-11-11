/**
 * Cliente mínimo para a API do Supabase (REST e Auth), feito só com `fetch`.
 * Assim o projeto continua com react e react-dom como únicas dependências.
 */
import { SUPABASE_KEY, SUPABASE_URL } from "../config";

/** O servidor não pôde ser alcançado (sem internet, DNS, tempo esgotado). */
export class NetworkError extends Error {}

/** O servidor respondeu, mas com erro. */
export class ApiError extends Error {
  readonly status: number;
  /** Código do PostgREST/Auth, ex.: "23P01" (conflito) ou "P0001" (regra do banco). */
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  /** Token de quem está logado. Sem ele, a requisição vai como visitante (anon). */
  token?: string | null;
  headers?: Record<string, string>;
}

const TIMEOUT_MS = 15_000;

// Chaves antigas (JWT, começam com "eyJ") vão também em Authorization.
// As novas (sb_publishable_...) não são JWT e vão somente em `apikey`.
const KEY_IS_JWT = SUPABASE_KEY.startsWith("eyJ");

export async function api<T = unknown>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { apikey: SUPABASE_KEY, ...options.headers };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  else if (KEY_IS_JWT) headers.Authorization = `Bearer ${SUPABASE_KEY}`;

  let body: string | undefined;
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS);
  let response: Response;
  let text: string;
  try {
    response = await fetch(SUPABASE_URL + path, {
      method: options.method ?? "GET",
      headers,
      body,
      signal: controller.signal,
    });
    text = await response.text();
  } catch {
    throw new NetworkError("Sem resposta do servidor.");
  } finally {
    window.clearTimeout(timer);
  }

  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const e = (data && typeof data === "object" ? data : {}) as Record<string, unknown>;
    const message = String(e.message ?? e.msg ?? e.error_description ?? e.error ?? response.statusText);
    const rawCode = e.code ?? e.error_code;
    throw new ApiError(message, response.status, rawCode == null ? undefined : String(rawCode));
  }
  return data as T;
}
