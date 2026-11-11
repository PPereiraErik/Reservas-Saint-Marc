import { useState } from "react";
import { BloqueiosAdmin } from "../components/BloqueiosAdmin";
import { Calendar } from "../components/Calendar";
import { EmptyState, ErrorState, LoadingState } from "../components/Feedback";
import { Icon, type IconName } from "../components/Icon";
import { Modal } from "../components/Modal";
import { ReservationDetails } from "../components/ReservationDetails";
import { StatusBadge } from "../components/StatusBadge";
import { useReservations } from "../hooks/useReservations";
import type { ActivityType, Reservation } from "../types";
import { formatDateLong, formatDateShort, formatMonthShort, formatRelative, parseDateKey, todayKey } from "../utils/date";
import { blocksSlot, byDateTime, coversDay, describeDatesShort, describeTimeShort, isMultiDay } from "../utils/rules";

const ACTIVITY: Record<ActivityType, { icon: IconName; text: string }> = {
  criada: { icon: "plus", text: "solicitou uma reserva" },
  aprovada: { icon: "check", text: "teve a reserva aprovada" },
  rejeitada: { icon: "x", text: "teve a reserva rejeitada" },
  cancelada: { icon: "ban", text: "teve a reserva cancelada" },
  excluida: { icon: "trash", text: "teve a reserva excluída" },
};

export function DashboardPage() {
  const { reservas, atividades, state, reload, resetDemo } = useReservations();
  const [selectedDay, setSelectedDay] = useState(todayKey);
  const [detailsId, setDetailsId] = useState<string | null>(null);

  if (state === "loading") return <LoadingState />;
  if (state === "error") {
    return (
      <div className="container">
        <ErrorState onRetry={reload} onReset={resetDemo} />
      </div>
    );
  }

  const hoje = todayKey();
  const mes = hoje.slice(0, 7);
  const ativas = reservas.filter((r) => blocksSlot(r.status));

  const stats: { label: string; value: number; icon: IconName; tone: string }[] = [
    { label: "Reservas hoje", value: ativas.filter((r) => coversDay(r, hoje)).length, icon: "calendar", tone: "primary" },
    { label: "Pendentes", value: reservas.filter((r) => r.status === "pendente").length, icon: "clock", tone: "pendente" },
    { label: "Confirmadas", value: reservas.filter((r) => r.status === "aprovada" && r.dataFim >= hoje).length, icon: "calendarCheck", tone: "aprovada" },
    { label: "Este mês", value: ativas.filter((r) => r.data.startsWith(mes)).length, icon: "sparkle", tone: "accent" },
  ];

  const proximas = ativas.filter((r) => r.dataFim >= hoje).sort(byDateTime).slice(0, 5);
  const doDia = reservas.filter((r) => coversDay(r, selectedDay)).sort(byDateTime);
  const detalhes = reservas.find((r) => r.id === detailsId) ?? null;

  return (
    <div className="container">
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Painel</h1>
          <p className="page-header__text">{formatDateLong(hoje, true)}</p>
        </div>
        <a href="#/admin/reservas" className="button button--primary">
          Gerenciar reservas
        </a>
      </header>

      <div className="stats">
        {stats.map((s) => (
          <div key={s.label} className="stat">
            <span className={`stat__icon tone--${s.tone}`}>
              <Icon name={s.icon} />
            </span>
            <p className="stat__value">{s.value}</p>
            <p className="stat__label">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        <section className="card" aria-labelledby="proximas">
          <h2 id="proximas" className="card__title">
            Próximas reservas
          </h2>
          {proximas.length === 0 ? (
            <EmptyState icon="calendar" title="Nenhuma reserva agendada." text="As próximas reservas aparecem aqui." />
          ) : (
            <ul className="reservation-list">
              {proximas.map((r) => (
                <ReservationRow key={r.id} reserva={r} onOpen={() => setDetailsId(r.id)} />
              ))}
            </ul>
          )}
        </section>

        <section className="card" aria-labelledby="atividade">
          <h2 id="atividade" className="card__title">
            Atividade recente
          </h2>
          {atividades.length === 0 ? (
            <EmptyState icon="activity" title="Nenhuma atividade ainda." />
          ) : (
            <ul className="activity">
              {atividades.slice(0, 7).map((a) => (
                <li key={a.id} className="activity__item">
                  <span className={`activity__icon tone--${a.tipo}`}>
                    <Icon name={ACTIVITY[a.tipo].icon} size={16} />
                  </span>
                  <div>
                    <p>
                      <strong>{a.nome}</strong> {ACTIVITY[a.tipo].text} para {formatDateShort(a.dataReserva)}
                    </p>
                    <p className="small muted">{formatRelative(a.em)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card card--flush dashboard-grid__wide" aria-labelledby="calendario-admin">
          <h2 id="calendario-admin" className="sr-only">
            Calendário
          </h2>
          <div className="admin-calendar">
            <Calendar mode="admin" reservas={reservas} selectedDate={selectedDay} onSelectDate={setSelectedDay} />
            <div className="admin-calendar__day" aria-live="polite">
              <h3 className="card__title">{formatDateLong(selectedDay)}</h3>
              {doDia.length === 0 ? (
                <p className="muted">Nenhuma reserva neste dia.</p>
              ) : (
                <ul className="reservation-list">
                  {doDia.map((r) => (
                    <ReservationRow key={r.id} reserva={r} onOpen={() => setDetailsId(r.id)} hideDate />
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <BloqueiosAdmin />
      </div>

      <Modal open={detalhes !== null} onClose={() => setDetailsId(null)} title="Detalhes da reserva">
        {detalhes && <ReservationDetails reserva={detalhes} onClose={() => setDetailsId(null)} />}
      </Modal>
    </div>
  );
}

function ReservationRow({
  reserva,
  onOpen,
  hideDate = false,
}: {
  reserva: Reservation;
  onOpen: () => void;
  hideDate?: boolean;
}) {
  return (
    <li>
      <button type="button" className="reservation-row" onClick={onOpen}>
        {!hideDate && (
          <span className="date-chip" aria-hidden="true">
            <span className="date-chip__month">{formatMonthShort(reserva.data)}</span>
            <span className="date-chip__day">{parseDateKey(reserva.data).getDate()}</span>
          </span>
        )}
        <span className="reservation-row__text">
          <span className="reservation-row__name">{reserva.nome}</span>
          <span className="reservation-row__meta">
            {hideDate ? (isMultiDay(reserva) ? `${describeDatesShort(reserva)}, ` : "") : `${describeDatesShort(reserva)}, `}
            {describeTimeShort(reserva)}
          </span>
        </span>
        <StatusBadge status={reserva.status} />
      </button>
    </li>
  );
}
