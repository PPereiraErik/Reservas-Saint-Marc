import { useEffect, useId, useMemo, useRef, useState } from "react";
import { FECHAMENTO, ABERTURA, MAX_DIAS_SEGUIDOS, PERIODOS, type Periodo } from "../config";
import type { Reservation } from "../types";
import { countDays, formatDateCompact, formatDateRange, timeToMinutes } from "../utils/date";
import {
  HORARIOS,
  activeOnDay,
  describeTimeShort,
  periodStates,
  validateSchedule,
  type FieldErrors,
  type PeriodState,
  type ScheduleInput,
} from "../utils/rules";
import type { DateRange } from "./Calendar";
import { ehBloqueio } from "../utils/bloqueios";
import { Icon } from "./Icon";

interface BookingPanelProps {
  reservas: Reservation[];
  range: DateRange;
  onClearRange: () => void;
  onContinue: (schedule: ScheduleInput) => void;
  /** Abre o pedido de aviso caso o dia ocupado libere. */
  onWaitlist?: (dia: string) => void;
}

const STATE_TEXT: Record<Exclude<PeriodState, "livre">, string> = {
  ocupado: "Reservado",
  encerrado: "Já começou",
};

/** Cartão lateral da página de reserva: datas escolhidas, período e botão de continuar. */
export function BookingPanel({ reservas, range, onClearRange, onContinue, onWaitlist }: BookingPanelProps) {
  const [periodo, setPeriodo] = useState<Periodo | null>(null);
  const [inicio, setInicio] = useState("14:00");
  const [fim, setFim] = useState("17:00");
  const [errorState, setErrorState] = useState<{ key: string; errors: FieldErrors }>({ key: "", errors: {} });
  const groupId = useId();
  const raiz = useRef<HTMLDivElement>(null);

  const start = range.start;
  const end = range.end ?? range.start;
  const multi = start !== null && end !== null && end > start;

  // Os erros valem só para as datas em que apareceram: trocar o dia limpa o aviso.
  const rangeKey = `${start}|${end}`;
  const errors = errorState.key === rangeKey ? errorState.errors : {};
  const setErrors = (found: FieldErrors) => setErrorState({ key: rangeKey, errors: found });

  // No celular, ao escolher o dia, desce até os períodos: é o próximo passo e fica fora da tela.
  useEffect(() => {
    if (!start || window.matchMedia("(min-width: 900px)").matches) return;
    const reduzir = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    raiz.current?.scrollIntoView({ behavior: reduzir ? "auto" : "smooth", block: "start" });
  }, [start]);

  const states = useMemo(() => (start ? periodStates(reservas, start) : null), [reservas, start]);
  const ocupadosNoDia = useMemo(() => (start && !multi ? activeOnDay(reservas, start) : []), [reservas, start, multi]);

  // Se o período escolhido deixar de estar livre (outro dia selecionado), ele é desmarcado.
  const periodoAtual =
    periodo === "personalizado" || (periodo && states?.[periodo] === "livre") ? periodo : null;

  const choose = (p: Periodo) => {
    setPeriodo(p);
    setErrors({});
  };

  const handleContinue = () => {
    if (!start || !end) return;
    const schedule: ScheduleInput = {
      data: start,
      dataFim: end,
      periodo: multi ? "dia-todo" : (periodoAtual ?? ("" as Periodo)),
      inicio,
      fim,
    };
    if (!multi && !periodoAtual) {
      setErrors({ periodo: "Escolha um período para continuar." });
      return;
    }
    const found = validateSchedule(schedule, reservas);
    setErrors(found);
    if (Object.keys(found).length === 0) onContinue(schedule);
  };

  const horariosFim = HORARIOS.filter((h) => timeToMinutes(h) > timeToMinutes(inicio));

  return (
    <div className="booking" ref={raiz}>
      <div className="booking__dates" aria-live="polite">
        <div className="booking__date">
          <span className="booking__date-label">Entrada</span>
          <span className={start ? "booking__date-value" : "booking__date-value is-empty"}>
            {start ? formatDateCompact(start) : "Selecione"}
          </span>
        </div>
        <div className="booking__date">
          <span className="booking__date-label">Saída</span>
          <span className={start ? "booking__date-value" : "booking__date-value is-empty"}>
            {!start ? "—" : multi && end ? formatDateCompact(end) : "Mesmo dia"}
          </span>
        </div>
      </div>

      {!start && (
        <p className="booking__hint">
          Toque em um dia livre no calendário. Para mais de um dia, toque também no último dia.
        </p>
      )}

      {start && !multi && (
        <>
          <p className="booking__hint">
            Quer mais de um dia? Toque no último dia no calendário (até {MAX_DIAS_SEGUIDOS} dias seguidos).
          </p>

          <fieldset className="booking__periods" aria-describedby={errors.periodo ? `${groupId}-erro` : undefined}>
            <legend className="booking__legend">Período</legend>
            <div className="period-grid">
              {PERIODOS.map((p) => {
                const state = states?.[p.id] ?? "livre";
                const disabled = state !== "livre";
                return (
                  <label
                    key={p.id}
                    className={[
                      "period",
                      p.id === "dia-todo" && "period--wide",
                      periodoAtual === p.id && "is-checked",
                      disabled && "is-disabled",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <input
                      type="radio"
                      name={groupId}
                      value={p.id}
                      checked={periodoAtual === p.id}
                      disabled={disabled}
                      onChange={() => choose(p.id)}
                    />
                    <span className="period__name">{p.nome}</span>
                    <span className="period__time">
                      {disabled ? STATE_TEXT[state as Exclude<PeriodState, "livre">] : `${p.inicio} às ${p.fim}`}
                    </span>
                  </label>
                );
              })}
              <label className={["period", "period--wide", periodoAtual === "personalizado" && "is-checked"].filter(Boolean).join(" ")}>
                <input
                  type="radio"
                  name={groupId}
                  value="personalizado"
                  checked={periodoAtual === "personalizado"}
                  onChange={() => choose("personalizado")}
                />
                <span className="period__name">Horário personalizado</span>
                <span className="period__time">Você escolhe o início e o fim</span>
              </label>
            </div>
          </fieldset>

          {periodoAtual === "personalizado" && (
            <div className="booking__custom">
              <div className="form__row">
                <div className={`field${errors.inicio ? " field--error" : ""}`}>
                  <label htmlFor={`${groupId}-inicio`}>Início</label>
                  <select
                    id={`${groupId}-inicio`}
                    className="input"
                    value={inicio}
                    aria-invalid={Boolean(errors.inicio)}
                    onChange={(e) => {
                      const novo = e.target.value;
                      setInicio(novo);
                      if (timeToMinutes(fim) <= timeToMinutes(novo)) {
                        const proximo = HORARIOS.find((h) => timeToMinutes(h) > timeToMinutes(novo));
                        if (proximo) setFim(proximo);
                      }
                      setErrors({});
                    }}
                  >
                    {HORARIOS.slice(0, -1).map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={`field${errors.fim ? " field--error" : ""}`}>
                  <label htmlFor={`${groupId}-fim`}>Término</label>
                  <select
                    id={`${groupId}-fim`}
                    className="input"
                    value={fim}
                    aria-invalid={Boolean(errors.fim)}
                    onChange={(e) => {
                      setFim(e.target.value);
                      setErrors({});
                    }}
                  >
                    {horariosFim.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="form__hint">
                O salão funciona das {ABERTURA} às {FECHAMENTO}.
              </p>
            </div>
          )}

          {ocupadosNoDia.length > 0 && (
            <div className="booking__taken">
              <p className="booking__taken-title">{ocupadosNoDia.every(ehBloqueio) ? "Salão fechado neste dia" : "Já reservado neste dia"}</p>
              <ul>
                {ocupadosNoDia.map((r) => (
                  <li key={r.id}>
                    {ehBloqueio(r) ? (
                      <>
                        {r.nome}
                        <span className="muted"> o dia todo</span>
                      </>
                    ) : (
                      <>
                        {describeTimeShort(r)}
                        <span className="muted"> {r.status === "aprovada" ? "confirmado" : "aguardando aprovação"}</span>
                      </>
                    )}
                  </li>
                ))}
              </ul>
              {onWaitlist && start && !ocupadosNoDia.some(ehBloqueio) && (
                <button type="button" className="link-button booking__waitlist" onClick={() => onWaitlist(start)}>
                  Avise-me se este dia liberar
                </button>
              )}
            </div>
          )}
        </>
      )}

      {multi && start && end && (
        <div className="notice notice--info">
          <Icon name="calendarCheck" size={18} />
          <div>
            <p className="notice__title">
              {countDays(start, end)} dias seguidos, de {formatDateRange(start, end)}
            </p>
            <p>
              Em reservas de vários dias, o salão fica reservado o dia todo, das {ABERTURA} às {FECHAMENTO}, em
              todas as datas.
            </p>
          </div>
        </div>
      )}

      {(errors.periodo || errors.inicio || errors.fim || errors.data) && (
        <p id={`${groupId}-erro`} className="field__error" role="alert">
          <Icon name="alert" size={14} />
          {errors.data ?? errors.periodo ?? errors.inicio ?? errors.fim}
        </p>
      )}

      <button type="button" className="button button--primary button--lg button--block" disabled={!start} onClick={handleContinue}>
        Continuar
      </button>

      {start && (
        <button type="button" className="link-button booking__clear" onClick={onClearRange}>
          Limpar datas
        </button>
      )}
    </div>
  );
}
