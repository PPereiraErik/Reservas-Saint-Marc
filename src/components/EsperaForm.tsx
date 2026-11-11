import { useState, type FormEvent } from "react";
import { useMorador } from "../hooks/useMorador";
import { useReservations } from "../hooks/useReservations";
import type { EsperaInput } from "../types";
import { formatDateLong } from "../utils/date";
import { friendlyError } from "../utils/errors";
import { validateEspera } from "../utils/espera";
import { maskPhone } from "../utils/phone";
import { BLOCOS, type FieldErrors } from "../utils/rules";
import { Field } from "./ReservationForm";
import { Icon } from "./Icon";
import { useToast } from "./Toast";

type Dados = Omit<EsperaInput, "data">;
const VAZIO: Dados = { nome: "", telefone: "", bloco: BLOCOS[0], apartamento: "" };

/** Morador pede para ser avisado se o dia escolhido ficar livre. */
export function EsperaForm({ data, onClose }: { data: string; onClose: () => void }) {
  const { joinWaitlist } = useReservations();
  const toast = useToast();
  const { morador } = useMorador();
  const [form, setForm] = useState<Dados>(() => (morador ? { nome: morador.nome, telefone: morador.telefone, bloco: morador.bloco, apartamento: morador.apartamento } : VAZIO));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [enviando, setEnviando] = useState(false);
  const [pronto, setPronto] = useState(false);

  const update = <K extends keyof Dados>(campo: K, valor: Dados[K]) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErrors((prev) => ({ ...prev, [campo]: undefined }));
  };

  const enviar = async (e?: FormEvent) => {
    e?.preventDefault();
    if (enviando) return;
    const found = validateEspera({ ...form, data });
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setEnviando(true);
    try {
      await joinWaitlist({ ...form, data });
      setPronto(true);
    } catch (error) {
      const message = friendlyError(error, "Não foi possível entrar na lista. Tente novamente.");
      setErrors({ data: message });
      toast("error", message);
    } finally {
      setEnviando(false);
    }
  };

  if (pronto) {
    return (
      <div className="success">
        <span className="success__icon">
          <Icon name="check" size={28} />
        </span>
        <h3 className="success__title">Você está na lista</h3>
        <p className="success__text">
          Se o dia <strong>{formatDateLong(data, true)}</strong> ficar livre, a administração avisa você pelo WhatsApp.
          Quem reservar primeiro garante a data.
        </p>
        <button type="button" className="button button--primary button--block" onClick={onClose}>
          Concluir
        </button>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={enviar} onKeyDown={(ev) => {
        const alvo = ev.target as HTMLElement;
        if (ev.key === "Enter" && alvo.tagName === "INPUT") {
          ev.preventDefault();
          void enviar();
        }
      }} noValidate>
      <div className="schedule-summary">
        <span className="schedule-summary__icon" aria-hidden="true">
          <Icon name="calendar" />
        </span>
        <div className="schedule-summary__text">
          <p className="schedule-summary__date">{formatDateLong(data, true)}</p>
          <p className="schedule-summary__time">Aviso se o dia liberar</p>
        </div>
      </div>
      {errors.data && (
        <p className="field__error" role="alert">
          <Icon name="alert" size={14} />
          {errors.data}
        </p>
      )}
      <Field label="Nome completo" error={errors.nome}>
        {(props) => (
          <input {...props} className="input" value={form.nome} onChange={(e) => update("nome", e.target.value)} placeholder="Maria Silva" autoComplete="name" maxLength={100} />
        )}
      </Field>
      <Field label="Telefone (WhatsApp)" error={errors.telefone}>
        {(props) => (
          <input {...props} type="tel" className="input" value={form.telefone} onChange={(e) => update("telefone", maskPhone(e.target.value))} placeholder="(47) 99999-9999" autoComplete="tel-national" inputMode="tel" maxLength={15} />
        )}
      </Field>
      <div className="form__row">
        <Field label="Bloco" error={errors.bloco}>
          {(props) => (
            <select {...props} className="input" value={form.bloco} onChange={(e) => update("bloco", e.target.value)}>
              {BLOCOS.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          )}
        </Field>
        <Field label="Apartamento" error={errors.apartamento}>
          {(props) => (
            <input {...props} className="input" value={form.apartamento} onChange={(e) => update("apartamento", e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="101" inputMode="numeric" maxLength={4} />
          )}
        </Field>
      </div>
      <div className="form__footer">
        <button type="button" className="button button--secondary" onClick={onClose}>
          Voltar
        </button>
        <button type="button" onClick={() => void enviar()} className="button button--primary" disabled={enviando}>
          {enviando ? "Enviando..." : "Entrar na lista de espera"}
        </button>
      </div>
    </form>
  );
}
