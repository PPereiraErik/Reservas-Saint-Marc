import { useState, type FormEvent } from "react";
import { useReservations } from "../hooks/useReservations";
import { formatDateShort, todayKey } from "../utils/date";
import { friendlyError } from "../utils/errors";
import { blocksSlot } from "../utils/rules";
import { MOTIVO_PADRAO, validateBloqueio } from "../utils/bloqueios";
import { Icon } from "./Icon";
import { useToast } from "./Toast";

/** Administração: fecha o salão em datas específicas (manutenção, assembleia, obra...). */
export function BloqueiosAdmin() {
  const { reservas, bloqueios, addBloqueio, removeBloqueio } = useReservations();
  const toast = useToast();
  const [data, setData] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [motivo, setMotivo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const enviar = async (e?: FormEvent) => {
    e?.preventDefault();
    if (ocupado) return;
    const input = { data, dataFim: dataFim || data, motivo: motivo.trim() };
    const problema = validateBloqueio(input);
    setErro(problema);
    if (problema) return;
    setOcupado(true);
    try {
      await addBloqueio(input);
      const afetadas = reservas.filter((r) => blocksSlot(r.status) && r.dataFim >= input.data && r.data <= input.dataFim).length;
      toast(
        afetadas > 0 ? "info" : "success",
        afetadas > 0
          ? `Data bloqueada. Atenção: já existem ${afetadas} reserva(s) nesse período; avise os moradores.`
          : "Data bloqueada. Os moradores já veem o salão fechado.",
      );
      setData("");
      setDataFim("");
      setMotivo("");
    } catch (error) {
      setErro(friendlyError(error, "Não foi possível bloquear. Tente novamente."));
    } finally {
      setOcupado(false);
    }
  };

  const remover = async (id: string) => {
    try {
      await removeBloqueio(id);
      toast("success", "Data liberada.");
    } catch (error) {
      toast("error", friendlyError(error, "Não foi possível liberar. Tente novamente."));
    }
  };

  return (
    <section className="card dashboard-grid__wide" aria-labelledby="bloqueios-titulo">
      <h2 id="bloqueios-titulo" className="card__title">
        Datas bloqueadas
      </h2>
      <p className="muted">Use para fechar o salão (manutenção, assembleia, obra). Moradores não conseguem reservar nesses dias.</p>

      <form className="bloqueio-form" onSubmit={enviar} onKeyDown={(ev) => {
        const alvo = ev.target as HTMLElement;
        if (ev.key === "Enter" && alvo.tagName === "INPUT") {
          ev.preventDefault();
          void enviar();
        }
      }} noValidate>
        <label className="field">
          <span className="field__label">Primeiro dia</span>
          <input type="date" className="input" value={data} min={todayKey()} onChange={(e) => setData(e.target.value)} />
        </label>
        <label className="field">
          <span className="field__label">Último dia (opcional)</span>
          <input type="date" className="input" value={dataFim} min={data || todayKey()} onChange={(e) => setDataFim(e.target.value)} />
        </label>
        <label className="field bloqueio-form__motivo">
          <span className="field__label">Motivo (opcional)</span>
          <input className="input" value={motivo} maxLength={80} placeholder={MOTIVO_PADRAO} onChange={(e) => setMotivo(e.target.value)} />
        </label>
        <button type="button" onClick={() => void enviar()} className="button button--primary" disabled={ocupado}>
          Bloquear
        </button>
      </form>
      {erro && (
        <p className="field__error" role="alert">
          <Icon name="alert" size={14} />
          {erro}
        </p>
      )}

      {bloqueios.length > 0 && (
        <ul className="bloqueio-lista">
          {bloqueios.map((b) => (
            <li key={b.id}>
              <span>
                <strong>{b.data === b.dataFim ? formatDateShort(b.data) : `${formatDateShort(b.data)} a ${formatDateShort(b.dataFim)}`}</strong>
                <span className="muted"> · {b.motivo || MOTIVO_PADRAO}</span>
              </span>
              <button type="button" className="button button--ghost button--sm" onClick={() => remover(b.id)}>
                <Icon name="x" size={16} /> Liberar
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
