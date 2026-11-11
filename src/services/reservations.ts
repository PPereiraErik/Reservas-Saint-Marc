/**
 * Serviço de reservas usado pelo resto do app.
 *
 * Escolhe a implementação conforme a configuração:
 * - com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY: banco compartilhado (reservations.remote.ts);
 * - sem elas: modo local, os dados ficam só no navegador, começando vazios (reservations.local.ts).
 *
 * As duas têm as mesmas funções, então as páginas não sabem a diferença.
 */
import { MODO_DEMO } from "../config";
import * as local from "./reservations.local";
import * as remote from "./reservations.remote";

export { ReservationError } from "./errors";

const impl = MODO_DEMO ? local : remote;

export const getReservations = impl.getReservations;
export const getActivities = impl.getActivities;
export const createReservation = impl.createReservation;
export const updateReservationStatus = impl.updateReservationStatus;
export const deleteReservation = impl.deleteReservation;

/** Só existe no modo local: com banco real, apagar tudo nunca deve ser um botão. */
export const resetDemoData: (() => Promise<void>) | undefined = MODO_DEMO ? local.resetDemoData : undefined;
