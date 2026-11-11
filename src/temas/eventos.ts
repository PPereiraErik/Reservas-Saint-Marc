/**
 * Datas comemorativas: quando cada tema aparece e o que ele mostra.
 * Tudo é calculado pela data de hoje. Datas móveis (Páscoa, Carnaval, Dia das Mães e dos Pais)
 * saem de regras, então não precisam ser atualizadas a cada ano.
 * Para ligar ou desligar um tema, basta incluí-lo ou removê-lo de EVENTOS.
 */
import { addDays } from "../utils/date";

export type Motivo =
  | "estrela"
  | "floco"
  | "bola"
  | "brilho"
  | "balao"
  | "confete"
  | "ovo"
  | "flor"
  | "coracao"
  | "bandeirinha"
  | "abobora"
  | "morcego"
  | "losango";

export interface Evento {
  id: string;
  nome: string;
  /** Texto curto da faixa. Recebe o ano em que a janela termina (usado no Ano Novo). */
  mensagem: (anoFim: number) => string;
  /** Primeiro e último dia (AAAA-MM-DD) em que o tema aparece, para o ano de referência. */
  intervalo: (ano: number) => [inicio: string, fim: string];
  /** Desenhos usados na faixa e no canto da foto. */
  motivos: Motivo[];
  /** Texto grande opcional sobre a foto (o ano, no Ano Novo). */
  destaque?: (anoFim: number) => string;
}

const p2 = (n: number) => String(n).padStart(2, "0");
const chave = (ano: number, mes: number, dia: number) => `${ano}-${p2(mes)}-${p2(dia)}`;

/** Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher). */
export function pascoa(ano: number): string {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return chave(ano, mes, dia);
}

/** n-ésimo domingo do mês (Dia das Mães = 2º de maio; Dia dos Pais = 2º de agosto). */
export function enesimoDomingo(ano: number, mes: number, n: number): string {
  const primeiro = new Date(ano, mes - 1, 1).getDay(); // 0 = domingo
  const dia = 1 + ((7 - primeiro) % 7) + 7 * (n - 1);
  return chave(ano, mes, dia);
}

export const EVENTOS: Evento[] = [
  {
    id: "natal",
    nome: "Natal",
    mensagem: () => "Boas festas! Feliz Natal a todos os moradores.",
    intervalo: (a) => [chave(a, 12, 15), chave(a, 12, 26)],
    motivos: ["bola", "estrela", "floco"],
  },
  {
    id: "ano-novo",
    nome: "Ano Novo",
    mensagem: (ano) => `Feliz ${ano}! Que o novo ano traga ótimas festas.`,
    intervalo: (a) => [chave(a, 12, 27), chave(a + 1, 1, 3)],
    motivos: ["brilho", "estrela", "confete"],
    destaque: (ano) => String(ano),
  },
  {
    id: "carnaval",
    nome: "Carnaval",
    mensagem: () => "Bom Carnaval! Aproveite com responsabilidade.",
    intervalo: (a) => [addDays(pascoa(a), -51), addDays(pascoa(a), -47)],
    motivos: ["confete", "balao", "estrela"],
  },
  {
    id: "pascoa",
    nome: "Páscoa",
    mensagem: () => "Feliz Páscoa! Que a semana seja de paz e doçura.",
    intervalo: (a) => [addDays(pascoa(a), -7), pascoa(a)],
    motivos: ["ovo", "flor", "ovo"],
  },
  {
    id: "maes",
    nome: "Dia das Mães",
    mensagem: () => "Feliz Dia das Mães!",
    intervalo: (a) => {
      const dia = enesimoDomingo(a, 5, 2);
      return [addDays(dia, -7), dia];
    },
    motivos: ["flor", "coracao", "flor"],
  },
  {
    id: "junina",
    nome: "Festa Junina",
    mensagem: () => "Boas festas juninas!",
    intervalo: (a) => [chave(a, 6, 10), chave(a, 6, 29)],
    motivos: ["bandeirinha", "balao", "bandeirinha"],
  },
  {
    id: "pais",
    nome: "Dia dos Pais",
    mensagem: () => "Feliz Dia dos Pais!",
    intervalo: (a) => {
      const dia = enesimoDomingo(a, 8, 2);
      return [addDays(dia, -7), dia];
    },
    motivos: ["estrela", "losango", "estrela"],
  },
  {
    id: "independencia",
    nome: "Independência do Brasil",
    mensagem: () => "Viva o Brasil! Feliz Dia da Independência.",
    intervalo: (a) => [chave(a, 9, 2), chave(a, 9, 7)],
    motivos: ["estrela", "losango", "estrela"],
  },
  {
    id: "criancas",
    nome: "Dia das Crianças",
    mensagem: () => "Feliz Dia das Crianças!",
    intervalo: (a) => [chave(a, 10, 5), chave(a, 10, 12)],
    motivos: ["balao", "estrela", "confete"],
  },
  {
    id: "halloween",
    nome: "Halloween",
    mensagem: () => "Feliz Halloween! Doces ou travessuras?",
    intervalo: (a) => [chave(a, 10, 25), chave(a, 10, 31)],
    motivos: ["abobora", "morcego", "abobora"],
  },
];

export interface EventoAtivo {
  evento: Evento;
  /** Ano em que a janela termina (2027 para o Ano Novo de 31/12/2026). */
  anoFim: number;
  /** Pasta da arte do Canva em uso (pode ser uma variante, ex.: pascoa2). */
  arte?: string;
}

/** Tema que vale na data informada (AAAA-MM-DD), ou null se nenhuma data comemorativa estiver perto. */
export function eventoDoDia(hoje: string): EventoAtivo | null {
  const ano = Number(hoje.slice(0, 4));
  // O Ano Novo cruza a virada do ano: confere a janela que começou no ano anterior também.
  for (const a of [ano - 1, ano]) {
    for (const evento of EVENTOS) {
      const [inicio, fim] = evento.intervalo(a);
      if (hoje >= inicio && hoje <= fim) return { evento, anoFim: Number(fim.slice(0, 4)) };
    }
  }
  return null;
}
