import { useId, useState, type FormEvent, type ReactNode } from "react";
import { WHATSAPP_ADMINISTRACAO } from "../config";
import { useMorador } from "../hooks/useMorador";
import { useReservations } from "../hooks/useReservations";
import type { Reservation, ReservationInput } from "../types";
import { friendlyError } from "../utils/errors";
import { maskPhone, whatsappLink } from "../utils/phone";
import {
  BLOCOS,
  describeDates,
  describeTime,
  resolveTimes,
  validateReservation,
  type FieldErrors,
  type ScheduleInput,
} from "../utils/rules";
import { AgendaBotoes } from "./AgendaBotoes";
import { Icon } from "./Icon";
import { RegrasSalao } from "./RegrasSalao";
import { useToast } from "./Toast";

interface ReservationFormProps {
  /** Data e período já escolhidos na página de reserva. */
  schedule: ScheduleInput;
  /** Volta para a escolha de data, sem enviar. */
  onClose: () => void;
  /** Reserva enviada e confirmação fechada. */
  onDone: () => void;
}

type PersonalData = Pick<ReservationInput, "nome" | "telefone" | "bloco" | "apartamento" | "observacoes">;

const EMPTY: PersonalData = { nome: "", telefone: "", bloco: BLOCOS[0], apartamento: "", observacoes: "" };

export function ReservationForm({ schedule, onClose, onDone }: ReservationFormProps) {
  const { ocupacao: reservas, create } = useReservations();
  const toast = useToast();
  const { morador } = useMorador();
  const [form, setForm] = useState<PersonalData>(() =>
    morador ? { ...EMPTY, nome: morador.nome, telefone: morador.telefone, bloco: morador.bloco, apartamento: morador.apartamento } : EMPTY,
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<Reservation | null>(null);
  const [aceite, setAceite] = useState(false);
  const [aceiteErro, setAceiteErro] = useState(false);

  const update = <K extends keyof PersonalData>(field: K, value: PersonalData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  // Horário real do período escolhido (para mostrar no resumo).
  const resolved = { ...schedule, ...resolveTimes(schedule) };

  // Erros de data/horário (ex.: alguém reservou o mesmo horário nesse meio-tempo).
  const scheduleError = errors.data ?? errors.periodo ?? errors.inicio ?? errors.fim;

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    if (submitting) return;

    const input: ReservationInput = { ...form, ...schedule };
    const found = validateReservation(input, reservas);
    setErrors(found);
    if (!aceite) setAceiteErro(true);
    if (Object.keys(found).length > 0 || !aceite) {
      toast("error", !aceite && Object.keys(found).length === 0 ? "Aceite as regras do salão para continuar." : "Revise os campos destacados.");
      return;
    }

    setSubmitting(true);
    try {
      const nova = await create(input);
      setCreated(nova);
      toast("success", "Reserva enviada!", "Agora é só aguardar a confirmação.");
    } catch (error) {
      const message = friendlyError(error, "Não foi possível salvar a reserva. Tente novamente.");
      setErrors({ periodo: message });
      toast("error", message);
    } finally {
      setSubmitting(false);
    }
  };

  if (created) {
    return (
      <div className="success">
        <span className="success__icon">
          <Icon name="check" size={28} />
        </span>
        <h3 className="success__title">Solicitação enviada</h3>
        <p className="success__text">
          Sua reserva está <strong>pendente</strong>. A administração do condomínio vai analisar e
          confirmar o pedido.
        </p>
        <dl className="summary">
          <dt>Data</dt>
          <dd>{describeDates(created, true)}</dd>
          <dt>Horário</dt>
          <dd>{describeTime(created)}</dd>
          <dt>Unidade</dt>
          <dd>
            Apto {created.apartamento}, {created.bloco}
          </dd>
        </dl>
        {WHATSAPP_ADMINISTRACAO && (
          <a
            className="button button--secondary button--block"
            href={whatsappLink(
              WHATSAPP_ADMINISTRACAO,
              `Olá! Acabei de pedir a reserva do salão de festas em ${describeDates(created, true)} (${describeTime(created)}). Sou ${created.nome}, apto ${created.apartamento}, ${created.bloco}.`,
            )}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="message" size={18} /> Avisar a administração no WhatsApp
          </a>
        )}
        <AgendaBotoes reserva={created} />
        <button type="button" className="button button--primary button--block" onClick={onDone}>
          Concluir
        </button>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={handleSubmit} onKeyDown={(ev) => {
        const alvo = ev.target as HTMLElement;
        if (ev.key === "Enter" && alvo.tagName === "INPUT") {
          ev.preventDefault();
          void handleSubmit();
        }
      }} noValidate>
      <div className="schedule-summary">
        <span className="schedule-summary__icon" aria-hidden="true">
          <Icon name="calendarCheck" />
        </span>
        <div className="schedule-summary__text">
          <p className="schedule-summary__date">{describeDates(resolved, true)}</p>
          <p className="schedule-summary__time">{describeTime(resolved)}</p>
        </div>
        <button type="button" className="link-button" onClick={onClose}>
          Alterar
        </button>
      </div>

      {morador ? (
        <p className="form__aviso">
          <Icon name="user" size={16} /> Dados preenchidos pelo cadastro do Apto {morador.apartamento}, {morador.bloco}.
        </p>
      ) : (
        <p className="form__aviso">
          <Icon name="user" size={16} /> <a href="#/cadastro">Cadastre seu apartamento</a> e os dados já vêm preenchidos nas próximas reservas.
        </p>
      )}

      {scheduleError && (
        <p className="field__error" role="alert">
          <Icon name="alert" size={14} />
          {scheduleError}
        </p>
      )}

      <fieldset className="form__section">
        <legend>Seus dados</legend>
        <Field label="Nome completo" error={errors.nome}>
          {(props) => (
            <input
              {...props}
              className="input"
              value={form.nome}
              onChange={(e) => update("nome", e.target.value)}
              placeholder="Maria Silva"
              autoComplete="name"
              maxLength={100}
            />
          )}
        </Field>
        <Field label="Telefone (WhatsApp)" error={errors.telefone}>
          {(props) => (
            <input
              {...props}
              type="tel"
              className="input"
              value={form.telefone}
              onChange={(e) => update("telefone", maskPhone(e.target.value))}
              placeholder="(47) 99999-9999"
              autoComplete="tel-national"
              inputMode="tel"
              maxLength={15}
            />
          )}
        </Field>
        <div className="form__row">
          <Field label="Bloco" error={errors.bloco}>
            {(props) => (
              <select
                {...props}
                className="input"
                value={form.bloco}
                onChange={(e) => update("bloco", e.target.value)}
              >
                {BLOCOS.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            )}
          </Field>
          <Field label="Apartamento" error={errors.apartamento}>
            {(props) => (
              <input
                {...props}
                className="input"
                value={form.apartamento}
                onChange={(e) => update("apartamento", e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="101"
                inputMode="numeric"
                maxLength={4}
              />
            )}
          </Field>
        </div>
        <Field
          label="Observações (opcional)"
          error={errors.observacoes}
          hint={`${form.observacoes.length}/500`}
        >
          {(props) => (
            <textarea
              {...props}
              className="input"
              rows={3}
              value={form.observacoes}
              onChange={(e) => update("observacoes", e.target.value)}
              placeholder="Ex.: aniversário de 15 anos, cerca de 40 convidados."
              maxLength={500}
            />
          )}
        </Field>
      </fieldset>

      <fieldset className="form__section regras-aceite">
        <legend>Regras do salão</legend>
        <RegrasSalao />
        <label className={`check${aceiteErro && !aceite ? " check--error" : ""}`}>
          <input
            type="checkbox"
            checked={aceite}
            onChange={(e) => {
              setAceite(e.target.checked);
              setAceiteErro(false);
            }}
            aria-invalid={aceiteErro && !aceite}
          />
          <span>Li e aceito as regras do salão.</span>
        </label>
        {aceiteErro && !aceite && (
          <p className="field__error" role="alert">
            <Icon name="alert" size={14} />
            Aceite as regras para enviar o pedido.
          </p>
        )}
      </fieldset>

      <div className="form__footer">
        <button type="button" className="button button--secondary" onClick={onClose}>
          Voltar
        </button>
        <button type="button" onClick={() => void handleSubmit()} className="button button--primary" disabled={submitting}>
          {submitting ? (
            <>
              <span className="spinner spinner--sm" aria-hidden="true" /> Enviando...
            </>
          ) : (
            "Enviar pedido de reserva"
          )}
        </button>
      </div>
    </form>
  );
}

interface FieldControlProps {
  id: string;
  "aria-invalid": boolean;
  "aria-describedby"?: string;
}

/** Liga label, campo e mensagem de erro para leitores de tela. */
export function Field({
  label,
  error,
  hint,
  children,
}: {
  label: string;
  error?: string;
  hint?: string;
  children: (props: FieldControlProps) => ReactNode;
}) {
  const id = useId();
  const errorId = `${id}-erro`;
  return (
    <div className={`field${error ? " field--error" : ""}`}>
      <div className="field__top">
        <label htmlFor={id}>{label}</label>
        {hint && <span className="field__hint">{hint}</span>}
      </div>
      {children({ id, "aria-invalid": Boolean(error), "aria-describedby": error ? errorId : undefined })}
      {error && (
        <p id={errorId} className="field__error">
          <Icon name="alert" size={14} />
          {error}
        </p>
      )}
    </div>
  );
}
