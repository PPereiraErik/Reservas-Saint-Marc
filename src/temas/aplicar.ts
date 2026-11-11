import { todayKey } from "../utils/date";
import { ARTE } from "./arte";
import { TEMA_APENAS_ARTE } from "../config";
import { EVENTOS, eventoDoDia, type EventoAtivo } from "./eventos";

const PREVIA_KEY = "reservas-saint-marc:tema-previa";

/**
 * Prévia de um tema fora da data: abra o site com ?tema=natal (ou ?tema=halloween etc.).
 * ?tema=nenhum volta ao normal. A escolha vale só nesta aba.
 */
function lerPrevia(): string | null {
  try {
    const fonte = [window.location.search, window.location.hash.split("?")[1] ?? ""];
    for (const trecho of fonte) {
      const valor = new URLSearchParams(trecho.replace(/^\?/, "")).get("tema");
      if (valor !== null) {
        if (valor === "nenhum" || valor === "") sessionStorage.removeItem(PREVIA_KEY);
        else sessionStorage.setItem(PREVIA_KEY, valor);
        return valor === "" ? null : valor;
      }
    }
    return sessionStorage.getItem(PREVIA_KEY);
  } catch {
    return null;
  }
}

/** O tema que deve aparecer agora (prévia pela URL ou data de hoje). */
export function eventoAtual(): EventoAtivo | null {
  const previa = lerPrevia();
  if (previa === "nenhum") return null;
  if (previa) {
    // "pascoa2" é a segunda versão da arte do mesmo tema.
    const base = previa.replace(/2$/, "");
    const evento = EVENTOS.find((e) => e.id === previa) ?? EVENTOS.find((e) => e.id === base && ARTE[previa]);
    if (evento) {
      const agora = new Date();
      // No Ano Novo, a prévia mostra o próximo ano a partir do segundo semestre.
      const anoFim = agora.getMonth() >= 6 ? agora.getFullYear() + 1 : agora.getFullYear();
      return { evento, anoFim, arte: ARTE[previa] ? previa : undefined };
    }
  }
  return eventoDoDia(todayKey());
}

/** Marca o <html> com data-evento="<id>" para o CSS (styles/eventos.css) trocar as cores. */
export function aplicarEvento(): void {
  const html = document.documentElement;
  const ativo = eventoAtual();
  const arte = ativo && (ARTE[ativo.arte ?? ativo.evento.id] ?? null);
  // Com TEMA_APENAS_ARTE, os temas que têm arte do Canva só mostram a arte (tela idêntica ao desenho).
  if (ativo && !(TEMA_APENAS_ARTE && arte)) html.setAttribute("data-evento", ativo.evento.id);
  else html.removeAttribute("data-evento");
  if (arte) html.setAttribute("data-arte", ativo.arte ?? ativo.evento.id);
  else html.removeAttribute("data-arte");
}
