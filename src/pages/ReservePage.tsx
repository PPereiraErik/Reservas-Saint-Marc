import { useState } from "react";
import { BookingPanel } from "../components/BookingPanel";
import { Calendar, type DateRange } from "../components/Calendar";
import { EsperaForm } from "../components/EsperaForm";
import { ErrorState, LoadingState } from "../components/Feedback";
import { Icon } from "../components/Icon";
import { Modal } from "../components/Modal";
import { ReservationForm } from "../components/ReservationForm";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { useReservations } from "../hooks/useReservations";
import { countDays, formatDateRange, isValidDateKey, todayKey } from "../utils/date";
import { canReserveRange, type ScheduleInput } from "../utils/rules";

export function ReservePage({ initialDate }: { initialDate: string | null }) {
  const { ocupacao: reservas, state, reload, resetDemo } = useReservations();
  const isWide = useMediaQuery("(min-width: 900px)");
  const [range, setRange] = useState<DateRange>(() => ({
    start: initialDate && isValidDateKey(initialDate) && initialDate >= todayKey() ? initialDate : null,
    end: null,
  }));
  const [schedule, setSchedule] = useState<ScheduleInput | null>(null);
  const [esperaData, setEsperaData] = useState<string | null>(null);

  /**
   * Seleção estilo Airbnb:
   * 1º toque escolhe o dia; 2º toque em um dia depois dele forma o intervalo
   * (se todos os dias estiverem livres). Um novo toque recomeça a seleção.
   */
  const handleSelectDate = (dia: string) => {
    const { start, end } = range;
    if (!start || end) return setRange({ start: dia, end: null });
    if (dia === start) return;
    if (dia < start) return setRange({ start: dia, end: null });
    if (canReserveRange(reservas, start, dia)) return setRange({ start, end: dia });
    setRange({ start: dia, end: null });
  };

  const fim = range.end ?? range.start;
  const resumo =
    range.start && fim && fim > range.start
      ? `${countDays(range.start, fim)} dias: ${formatDateRange(range.start, fim)}`
      : range.start
        ? `1 dia: ${formatDateRange(range.start, range.start)}`
        : "Escolha a data do seu evento";

  return (
    <div className="container">
      <a href="#/" className="back-link">
        <Icon name="chevronLeft" size={18} /> Voltar ao início
      </a>
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Reservar o salão</h1>
          <p className="page-header__text">
            Escolha a data e o período. A reserva fica pendente até a administração confirmar.
          </p>
        </div>
      </header>

      {state === "loading" && <LoadingState />}
      {state === "error" && <ErrorState onRetry={reload} onReset={resetDemo} />}
      {state === "ready" && (
        <div className="reserve-layout">
          <section className="reserve-calendar" aria-labelledby="titulo-datas">
            <h2 id="titulo-datas" className="reserve-calendar__title">
              {resumo}
            </h2>
            <Calendar
              mode="public"
              reservas={reservas}
              range={range}
              onSelectDate={handleSelectDate}
              months={isWide ? 2 : 1}
            />
          </section>

          <aside className="card reserve-panel" aria-label="Sua reserva">
            <BookingPanel
              reservas={reservas}
              range={range}
              onClearRange={() => setRange({ start: null, end: null })}
              onContinue={setSchedule}
              onWaitlist={setEsperaData}
            />
          </aside>
        </div>
      )}

      <Modal
        open={schedule !== null}
        onClose={() => setSchedule(null)}
        title="Confirmar reserva"
        description="Informe seus dados. A administração do condomínio vai analisar o pedido."
      >
        {schedule && (
          <ReservationForm
            schedule={schedule}
            onClose={() => setSchedule(null)}
            onDone={() => {
              setSchedule(null);
              setRange({ start: null, end: null });
            }}
          />
        )}
      </Modal>

      <Modal
        open={esperaData !== null}
        onClose={() => setEsperaData(null)}
        title="Lista de espera"
        description="Deixe seu contato. Se alguém cancelar, a administração avisa você."
      >
        {esperaData && <EsperaForm data={esperaData} onClose={() => setEsperaData(null)} />}
      </Modal>
    </div>
  );
}
