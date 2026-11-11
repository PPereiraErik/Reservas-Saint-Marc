import { CONDOMINIO } from "../config";
import type { Reservation } from "../types";

type Evento = Pick<Reservation, "id" | "nome" | "bloco" | "apartamento" | "data" | "dataFim" | "inicio" | "fim" | "status">;

/** "2026-11-15" + "18:00" -> "20261115T180000" (horário local, sem fuso: vale o do aparelho). */
function stamp(dia: string, hora: string): string {
  return `${dia.replaceAll("-", "")}T${hora.replace(":", "")}00`;
}

function titulo(r: Evento): string {
  const base = `Salão de festas - ${CONDOMINIO.nome}`;
  return r.status === "pendente" ? `${base} (aguardando aprovação)` : base;
}

function descricao(r: Evento): string {
  return `Reserva em nome de ${r.nome}, apto ${r.apartamento}, ${r.bloco}.`;
}

/** Link que abre o Google Agenda já com o evento preenchido. */
export function googleAgendaLink(r: Evento): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: titulo(r),
    dates: `${stamp(r.data, r.inicio)}/${stamp(r.dataFim, r.fim)}`,
    details: descricao(r),
    location: CONDOMINIO.nome,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function escapar(texto: string): string {
  return texto.replaceAll("\\", "\\\\").replaceAll(";", "\;").replaceAll(",", "\\,").replaceAll("\n", "\\n");
}

/** Conteúdo de um arquivo .ics (abre no Agenda do iPhone/Android, Outlook, etc.), com lembrete 1 dia antes. */
export function gerarIcs(r: Evento): string {
  const agora = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Reservas Saint-Marc//PT-BR",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${r.id}@reservas-saint-marc`,
    `DTSTAMP:${agora}`,
    `DTSTART:${stamp(r.data, r.inicio)}`,
    `DTEND:${stamp(r.dataFim, r.fim)}`,
    `SUMMARY:${escapar(titulo(r))}`,
    `DESCRIPTION:${escapar(descricao(r))}`,
    `LOCATION:${escapar(CONDOMINIO.nome)}`,
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "ACTION:DISPLAY",
    "DESCRIPTION:Amanhã: reserva do salão de festas",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}

/** Baixa o arquivo .ics no aparelho. */
export function baixarIcs(r: Evento): void {
  const blob = new Blob([gerarIcs(r)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reserva-salao-${r.data}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 2000);
}
