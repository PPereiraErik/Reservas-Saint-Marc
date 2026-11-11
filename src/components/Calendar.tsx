import { useMemo, useState } from "react";
import type { Reservation, ReservationStatus } from "../types";
import { formatDateLong, formatMonthYear, parseDateKey, toDateKey, todayKey } from "../utils/date";
import {
  STATUS_LABEL,
  activeOnDay,
  byDateTime,
  coversDay,
  dayAvailability,
  describeTimeShort,
  isMultiDay,
  PERIODO_LABEL,
  type DayAvailability,
} from "../utils/rules";
import { Icon } from "./Icon";

const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const WEEKDAYS_FULL = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];

export interface DateRange {
  start: string | null;
  end: string | null;
}

interface CalendarProps {
  reservas: Reservation[];
  /**
   * "public": disponibilidade por dia, sem dados pessoais (moradores).
   * "admin": todas as reservas, com status e horários.
   */
  mode: "public" | "admin";
  onSelectDate: (dateKey: string) => void;
  /** Dia destacado (painel administrativo e prévia da página inicial). */
  selectedDate?: string | null;
  /** Intervalo selecionado (página de reserva). */
  range?: DateRange;
  /** Quantos meses mostrar lado a lado. */
  months?: 1 | 2;
  /** Versão reduzida (prévia na página inicial). */
  compact?: boolean;
}

function monthStart(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Nos últimos dias do mês, o calendário público já abre no mês seguinte. */
function initialMonth(mode: "public" | "admin", selected?: string | null): Date {
  if (selected) return monthStart(parseDateKey(selected));
  const hoje = new Date();
  const diasRestantes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).getDate() - hoje.getDate();
  if (mode === "public" && diasRestantes < 5) return new Date(hoje.getFullYear(), hoje.getMonth() + 1, 1);
  return monthStart(hoje);
}

function monthCells(month: Date): (string | null)[] {
  const year = month.getFullYear();
  const m = month.getMonth();
  const vazias = new Date(year, m, 1).getDay();
  const dias = new Date(year, m + 1, 0).getDate();
  return [
    ...Array.from({ length: vazias }, () => null),
    ...Array.from({ length: dias }, (_, i) => toDateKey(new Date(year, m, i + 1))),
  ];
}

const AVAILABILITY_LABEL: Record<DayAvailability, string> = {
  livre: "livre",
  parcial: "parcialmente reservado",
  lotado: "indisponível",
};

export function Calendar({
  reservas,
  mode,
  onSelectDate,
  selectedDate,
  range,
  months = 1,
  compact = false,
}: CalendarProps) {
  const hoje = todayKey();
  const currentMonth = monthStart(new Date());
  const [cursor, setCursor] = useState(() => initialMonth(mode, range?.start ?? selectedDate));

  // Público: só reservas ativas. Admin: tudo, inclusive rejeitadas e canceladas.
  const visiveis = useMemo(
    () => (mode === "public" ? reservas : [...reservas].sort(byDateTime)),
    [reservas, mode],
  );

  const shownMonths = Array.from({ length: months }, (_, i) => new Date(cursor.getFullYear(), cursor.getMonth() + i, 1));
  const isCurrentMonth = cursor.getTime() === currentMonth.getTime();
  const canGoBack = mode === "admin" || !isCurrentMonth;
  const changeMonth = (offset: number) => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + offset, 1));

  const rangeStart = range?.start ?? null;
  const rangeEnd = range?.end ?? rangeStart;

  const renderPublicDay = (key: string) => {
    const isPast = key < hoje;
    const disponibilidade = isPast ? "lotado" : dayAvailability(visiveis, key);
    const disabled = isPast || disponibilidade === "lotado";
    const isStart = key === rangeStart;
    const isEnd = key === rangeEnd;
    const inRange = rangeStart !== null && rangeEnd !== null && key > rangeStart && key < rangeEnd;
    const isSelected = range ? isStart || isEnd : key === selectedDate;
    const hasRange = rangeStart !== null && rangeEnd !== null && rangeStart !== rangeEnd;

    const label = `${formatDateLong(key)}${key === hoje ? ", hoje" : ""}: ${
      isPast ? "data passada" : AVAILABILITY_LABEL[disponibilidade]
    }`;

    return (
      <span
        key={key}
        className={[
          "day-cell",
          hasRange && inRange && "is-in-range",
          hasRange && isStart && "is-range-start",
          hasRange && isEnd && "is-range-end",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <button
          type="button"
          className={[
            "day",
            `day--${disponibilidade}`,
            isPast && "day--past",
            key === hoje && "day--today",
            isSelected && "is-selected",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => onSelectDate(key)}
          disabled={disabled}
          aria-pressed={isSelected}
          aria-label={label}
        >
          <span className="day__number">{parseDateKey(key).getDate()}</span>
          {disponibilidade === "parcial" && !isPast && <span className="day__mark" aria-hidden="true" />}
        </button>
      </span>
    );
  };

  const renderAdminDay = (key: string) => {
    const doDia = visiveis.filter((r) => coversDay(r, key));
    const ativas = activeOnDay(doDia, key);
    const dayState = ativas.some((r) => r.status === "aprovada") ? "aprovada" : ativas.length > 0 ? "pendente" : "livre";
    const resumo =
      doDia.length === 0
        ? "sem reservas"
        : doDia.map((r) => `${describeTimeShort(r)}, ${STATUS_LABEL[r.status].toLowerCase()}`).join("; ");

    return (
      <button
        key={key}
        type="button"
        className={[
          "admin-day",
          `admin-day--${dayState}`,
          key < hoje && "admin-day--past",
          key === hoje && "admin-day--today",
          key === selectedDate && "is-selected",
        ]
          .filter(Boolean)
          .join(" ")}
        onClick={() => onSelectDate(key)}
        aria-pressed={key === selectedDate}
        aria-label={`${formatDateLong(key)}${key === hoje ? ", hoje" : ""}: ${resumo}`}
      >
        <span className="admin-day__number">{parseDateKey(key).getDate()}</span>
        {doDia.length > 0 && (
          <span className="admin-day__dots" aria-hidden="true">
            {doDia.slice(0, 3).map((r) => (
              <span key={r.id} className={`dot dot--${r.status}`} />
            ))}
          </span>
        )}
        {doDia.length > 0 && (
          <span className="admin-day__events" aria-hidden="true">
            {doDia.slice(0, 2).map((r) => (
              <span key={r.id} className={`event event--${r.status}`}>
                {isMultiDay(r) ? "Dia todo" : r.periodo === "personalizado" ? r.inicio : PERIODO_LABEL[r.periodo]}
              </span>
            ))}
            {doDia.length > 2 && <span className="event event--more">+{doDia.length - 2}</span>}
          </span>
        )}
      </button>
    );
  };

  const legend: { key: string; className: string; label: string }[] =
    mode === "public"
      ? [
          { key: "livre", className: "legend-day legend-day--livre", label: "Livre" },
          { key: "parcial", className: "legend-day legend-day--parcial", label: "Parte do dia reservada" },
          { key: "lotado", className: "legend-day legend-day--lotado", label: "Indisponível" },
        ]
      : [
          { key: "livre", className: "dot dot--livre", label: "Sem reservas" },
          ...(["pendente", "aprovada", "rejeitada", "cancelada"] as ReservationStatus[]).map((s) => ({
            key: s,
            className: `dot dot--${s}`,
            label: STATUS_LABEL[s],
          })),
        ];

  return (
    <section
      className={["calendar", `calendar--${mode}`, compact && "calendar--compact", months === 2 && "calendar--double"]
        .filter(Boolean)
        .join(" ")}
      aria-label="Calendário de reservas"
    >
      <div className="calendar__nav">
        <button
          type="button"
          className="icon-button icon-button--round"
          onClick={() => changeMonth(-1)}
          disabled={!canGoBack}
          aria-label="Mês anterior"
        >
          <Icon name="chevronLeft" size={18} />
        </button>
        {mode === "admin" && !isCurrentMonth && (
          <button type="button" className="button button--ghost button--sm calendar__today" onClick={() => setCursor(currentMonth)}>
            Hoje
          </button>
        )}
        <button
          type="button"
          className="icon-button icon-button--round"
          onClick={() => changeMonth(1)}
          aria-label="Próximo mês"
        >
          <Icon name="chevronRight" size={18} />
        </button>
      </div>

      <div className="calendar__months">
        {shownMonths.map((month) => (
          <div className="calendar__month" key={month.getTime()}>
            <h3 className="calendar__title" aria-live="polite">
              {formatMonthYear(month)}
            </h3>
            <div className="calendar__weekdays" aria-hidden="true">
              {WEEKDAYS.map((d, i) => (
                <span key={i} title={WEEKDAYS_FULL[i]}>
                  {d}
                </span>
              ))}
            </div>
            <div className="calendar__grid">
              {monthCells(month).map((key, index) =>
                key === null ? (
                  <span key={`vazio-${index}`} className="calendar__empty" />
                ) : mode === "public" ? (
                  renderPublicDay(key)
                ) : (
                  renderAdminDay(key)
                ),
              )}
            </div>
          </div>
        ))}
      </div>

      <ul className="calendar__legend" aria-label="Legenda">
        {legend.map((item) => (
          <li key={item.key}>
            <span className={item.className} aria-hidden="true" />
            {item.label}
          </li>
        ))}
      </ul>
    </section>
  );
}
