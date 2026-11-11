import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { MODO_DEMO } from "../config";
import type { Activity, Bloqueio, BloqueioInput, Espera, EsperaInput, Reservation, ReservationInput, ReservationStatus } from "../types";
import * as esperaService from "../services/espera";
import * as bloqueiosService from "../services/bloqueios";
import { bloqueioComoReserva } from "../utils/bloqueios";
import * as service from "../services/reservations";
import { useAuth } from "./useAuth";

type LoadState = "loading" | "ready" | "error";

interface ReservationsContextValue {
  reservas: Reservation[];
  atividades: Activity[];
  /** Lista de espera (só o administrador recebe dados). */
  espera: Espera[];
  bloqueios: Bloqueio[];
  /** Reservas + datas bloqueadas: use para mostrar disponibilidade e validar novas reservas. */
  ocupacao: Reservation[];
  state: LoadState;
  reload: () => Promise<void>;
  create: (input: ReservationInput) => Promise<Reservation>;
  setStatus: (id: string, status: ReservationStatus) => Promise<void>;
  remove: (id: string) => Promise<void>;
  joinWaitlist: (input: EsperaInput) => Promise<void>;
  removeEspera: (id: string) => Promise<void>;
  addBloqueio: (input: BloqueioInput) => Promise<void>;
  removeBloqueio: (id: string) => Promise<void>;
  /** Só existe no modo local. */
  resetDemo?: () => Promise<void>;
}

const ReservationsContext = createContext<ReservationsContextValue | null>(null);

/** Com banco compartilhado, a lista é atualizada sozinha neste intervalo. */
const REFRESH_MS = 30_000;

/**
 * Guarda as reservas em memória e mantém tudo sincronizado com o serviço.
 * Cada ação chama o serviço e depois recarrega a lista.
 */
export function ReservationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [reservas, setReservas] = useState<Reservation[]>([]);
  const [atividades, setAtividades] = useState<Activity[]>([]);
  const [espera, setEspera] = useState<Espera[]>([]);
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
  const [state, setState] = useState<LoadState>("loading");

  /** `silent`: atualização em segundo plano; se falhar, mantém o que já está na tela. */
  const load = useCallback(async (silent: boolean) => {
    try {
      const [novasReservas, novasAtividades, novaEspera, novosBloqueios] = await Promise.all([
        service.getReservations(),
        service.getActivities(),
        esperaService.getEspera().catch(() => [] as Espera[]),
        bloqueiosService.getBloqueios().catch(() => [] as Bloqueio[]),
      ]);
      setReservas(novasReservas);
      setAtividades(novasAtividades);
      setEspera(novaEspera);
      setBloqueios(novosBloqueios);
      setState("ready");
    } catch {
      if (!silent) setState("error");
    }
  }, []);

  const reload = useCallback(() => load(false), [load]);

  // Carrega ao abrir e de novo quando o administrador entra ou sai
  // (visitantes e administrador veem dados diferentes).
  const userEmail = user?.email ?? null;
  useEffect(() => {
    void load(false);
  }, [load, userEmail]);

  // Várias pessoas usam ao mesmo tempo: mantém a lista em dia sem precisar recarregar a página.
  useEffect(() => {
    if (MODO_DEMO) return;
    const refresh = () => {
      if (document.visibilityState === "visible") void load(true);
    };
    const timer = window.setInterval(refresh, REFRESH_MS);
    document.addEventListener("visibilitychange", refresh);
    window.addEventListener("online", refresh);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
      window.removeEventListener("online", refresh);
    };
  }, [load]);

  const withReload =
    <A extends unknown[], R>(action: (...args: A) => Promise<R>) =>
    async (...args: A): Promise<R> => {
      const result = await action(...args);
      await load(true);
      return result;
    };

  const value: ReservationsContextValue = {
    reservas,
    atividades,
    espera,
    bloqueios,
    ocupacao: [...reservas, ...bloqueios.map(bloqueioComoReserva)],
    state,
    reload,
    create: withReload(service.createReservation),
    setStatus: withReload(service.updateReservationStatus),
    remove: withReload(service.deleteReservation),
    joinWaitlist: withReload(esperaService.joinWaitlist),
    removeEspera: withReload(esperaService.removeEspera),
    addBloqueio: withReload(bloqueiosService.addBloqueio),
    removeBloqueio: withReload(bloqueiosService.removeBloqueio),
    resetDemo: service.resetDemoData ? withReload(service.resetDemoData) : undefined,
  };

  return <ReservationsContext.Provider value={value}>{children}</ReservationsContext.Provider>;
}

export function useReservations() {
  const context = useContext(ReservationsContext);
  if (!context) throw new Error("useReservations precisa estar dentro de <ReservationsProvider>");
  return context;
}
