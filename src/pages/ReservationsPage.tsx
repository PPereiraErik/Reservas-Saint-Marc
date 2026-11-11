import { useMemo, useState } from "react";
import { EsperaLista } from "../components/EsperaLista";
import { EmptyState, ErrorState, LoadingState } from "../components/Feedback";
import { Icon } from "../components/Icon";
import { Modal } from "../components/Modal";
import { ReservationDetails } from "../components/ReservationDetails";
import { StatusBadge } from "../components/StatusBadge";
import { useToast } from "../components/Toast";
import { useReservations } from "../hooks/useReservations";
import type { Reservation, ReservationStatus } from "../types";
import { formatDateShort, formatMonthShort, parseDateKey, todayKey } from "../utils/date";
import { friendlyError } from "../utils/errors";
import { phoneLink } from "../utils/phone";
import { STATUS_LABEL, coversDay, describeDates, describeTimeShort } from "../utils/rules";

type StatusFilter = "todas" | ReservationStatus;
const FILTERS: StatusFilter[] = ["todas", "pendente", "aprovada", "rejeitada", "cancelada"];

/** Remove acentos e deixa minúsculo, para a busca ignorar "é" vs "e". */
function normalize(text: string) {
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function matchesSearch(r: Reservation, query: string) {
  if (!query) return true;
  const q = normalize(query);
  const digits = q.replace(/\D/g, "");
  return (
    normalize(r.nome).includes(q) ||
    normalize(`apto ${r.apartamento} ${r.bloco}`).includes(q) ||
    formatDateShort(r.data).includes(q) ||
    formatDateShort(r.dataFim).includes(q) ||
    (digits.length >= 4 && r.telefone.replace(/\D/g, "").includes(digits))
  );
}

export function ReservationsPage() {
  const { reservas, state, reload, resetDemo, setStatus, espera } = useReservations();
  const toast = useToast();
  const [search, setSearch] = useState("");
  const [status, setStatusFilter] = useState<StatusFilter>("todas");
  const [date, setDate] = useState("");
  const [detailsId, setDetailsId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  /** Aprovou/rejeitou pela lista: abre os detalhes já com o convite para avisar o morador. */
  const [avisoInicial, setAvisoInicial] = useState<"aprovada" | "rejeitada" | null>(null);

  const hoje = todayKey();

  const counts = useMemo(() => {
    const result: Record<StatusFilter, number> = { todas: 0, pendente: 0, aprovada: 0, rejeitada: 0, cancelada: 0 };
    for (const r of reservas) {
      if (date && !coversDay(r, date)) continue;
      result.todas++;
      result[r.status]++;
    }
    return result;
  }, [reservas, date]);

  // Próximas primeiro (da mais perto para a mais longe), depois as passadas.
  const filtradas = useMemo(() => {
    const lista = reservas.filter(
      (r) => (status === "todas" || r.status === status) && (!date || coversDay(r, date)) && matchesSearch(r, search.trim()),
    );
    const futuras = lista.filter((r) => r.dataFim >= hoje);
    const passadas = lista.filter((r) => r.dataFim < hoje).reverse();
    return [...futuras, ...passadas];
  }, [reservas, status, date, search, hoje]);

  const hasFilters = search !== "" || status !== "todas" || date !== "";
  const detalhes = reservas.find((r) => r.id === detailsId) ?? null;

  const quickStatus = async (id: string, novo: "aprovada" | "rejeitada") => {
    setBusyId(id);
    try {
      await setStatus(id, novo);
      toast("success", novo === "aprovada" ? "Reserva aprovada." : "Reserva rejeitada.");
      setAvisoInicial(novo);
      setDetailsId(id);
    } catch (error) {
      toast("error", friendlyError(error, "Não foi possível alterar a reserva. Tente novamente."));
    } finally {
      setBusyId(null);
    }
  };

  const handleReset = async () => {
    if (!resetDemo || !window.confirm("Apagar todas as reservas, cadastros de moradores e dados guardados neste navegador? Isso não pode ser desfeito.")) return;
    try {
      await resetDemo();
      toast("success", "Dados apagados.");
    } catch (error) {
      toast("error", friendlyError(error, "Não foi possível apagar os dados."));
    }
  };

  return (
    <div className="container">
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Reservas</h1>
          <p className="page-header__text">Aprove, rejeite e acompanhe todas as solicitações.</p>
        </div>
        {resetDemo ? (
          <button type="button" className="button button--ghost" onClick={handleReset}>
            <Icon name="refresh" size={18} /> Apagar dados deste navegador
          </button>
        ) : (
          <button type="button" className="button button--ghost" onClick={() => void reload()}>
            <Icon name="refresh" size={18} /> Atualizar
          </button>
        )}
      </header>

      <div className="card filters">
        <div className="filters__row">
          <label className="search">
            <span className="sr-only">Buscar reservas</span>
            <Icon name="search" size={18} />
            <input
              type="search"
              className="input"
              placeholder="Nome, apartamento, bloco, telefone ou data"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <label className="date-filter">
            <span className="sr-only">Filtrar por data</span>
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
        </div>
        <div className="chips" role="group" aria-label="Filtrar por status">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={`chip${status === f ? " is-active" : ""}`}
              aria-pressed={status === f}
              onClick={() => setStatusFilter(f)}
            >
              {f === "todas" ? "Todas" : STATUS_LABEL[f]}
              <span className="chip__count">{counts[f]}</span>
            </button>
          ))}
        </div>
      </div>

      {state === "loading" && <LoadingState />}
      {state === "error" && <ErrorState onRetry={reload} onReset={resetDemo} />}
      {state === "ready" &&
        (filtradas.length === 0 ? (
          <div className="card">
            <EmptyState
              title="Nenhuma reserva encontrada."
              text={hasFilters ? "Ajuste a busca ou os filtros." : "As solicitações feitas pelos moradores aparecem aqui."}
              action={
                hasFilters && (
                  <button
                    type="button"
                    className="button button--secondary"
                    onClick={() => {
                      setSearch("");
                      setStatusFilter("todas");
                      setDate("");
                    }}
                  >
                    Limpar filtros
                  </button>
                )
              }
            />
          </div>
        ) : (
          <ul className="admin-list">
            {filtradas.map((r) => (
              <li key={r.id} className={`admin-item${r.dataFim < hoje ? " is-past" : ""}`}>
                <span className="date-chip" aria-hidden="true">
                  <span className="date-chip__month">{formatMonthShort(r.data)}</span>
                  <span className="date-chip__day">{parseDateKey(r.data).getDate()}</span>
                </span>
                <div className="admin-item__info">
                  <div className="admin-item__top">
                    <h2 className="admin-item__name">{r.nome}</h2>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="admin-item__meta">
                    {describeDates(r)}, {describeTimeShort(r)}
                  </p>
                  <p className="admin-item__meta">
                    Apto {r.apartamento}, {r.bloco}
                  </p>
                </div>
                <div className="admin-item__actions">
                  <a className="icon-button icon-button--outline" href={phoneLink(r.telefone)} aria-label={`Ligar para ${r.nome}`}>
                    <Icon name="phone" size={18} />
                  </a>
                  {r.status === "pendente" && (
                    <>
                      <button
                        type="button"
                        className="button button--success button--sm"
                        disabled={busyId === r.id}
                        onClick={() => quickStatus(r.id, "aprovada")}
                      >
                        <Icon name="check" size={16} /> Aprovar
                      </button>
                      <button
                        type="button"
                        className="button button--secondary button--sm"
                        disabled={busyId === r.id}
                        onClick={() => quickStatus(r.id, "rejeitada")}
                      >
                        <Icon name="x" size={16} /> Rejeitar
                      </button>
                    </>
                  )}
                  <button type="button" className="button button--ghost button--sm" onClick={() => setDetailsId(r.id)}>
                    <Icon name="eye" size={16} /> Detalhes
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ))}

      <EsperaLista itens={espera} titulo={`Lista de espera (${espera.length})`} />

      <Modal
        open={detalhes !== null}
        onClose={() => {
          setDetailsId(null);
          setAvisoInicial(null);
        }}
        title="Detalhes da reserva"
      >
        {detalhes && (
          <ReservationDetails
            key={detalhes.id}
            reserva={detalhes}
            avisarInicial={avisoInicial}
            onClose={() => {
              setDetailsId(null);
              setAvisoInicial(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}
