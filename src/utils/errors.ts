import { ReservationError } from "../services/reservations";
import { StorageError } from "../services/storage";

/** Mostra só mensagens preparadas para o usuário; erros técnicos viram o texto padrão. */
export function friendlyError(error: unknown, fallback: string): string {
  if (error instanceof ReservationError || error instanceof StorageError) return error.message;
  return fallback;
}
