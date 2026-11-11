import { useMemo, type ReactNode } from "react";
import { eventoAtual } from "../temas/aplicar";
import { ARTE } from "../temas/arte";
import type { Motivo } from "../temas/eventos";
import { TEMA_APENAS_ARTE } from "../config";

/** Desenhos simples (grade 24x24) usados nos temas de datas. As cores vêm de --evento-m1..3. */
const DESENHOS: Record<Motivo, ReactNode> = {
  estrela: <path d="M12 2.5l2.9 6.2 6.8.8-5 4.7 1.3 6.7-6-3.4-6 3.4 1.3-6.7-5-4.7 6.8-.8z" fill="currentColor" />,
  floco: (
    <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none">
      <path d="M12 2.5v19M3.8 7.2l16.4 9.6M3.8 16.8l16.4-9.6" />
      <path d="M9.5 4.5 12 7l2.5-2.5M9.5 19.5 12 17l2.5 2.5" />
    </g>
  ),
  bola: (
    <g>
      <rect x="9.5" y="2.5" width="5" height="3.5" rx="1" fill="#d4a72c" />
      <circle cx="12" cy="14" r="7.5" fill="currentColor" />
      <path d="M7.5 12.5a5 5 0 0 1 3-3.5" stroke="#fff" strokeOpacity=".65" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </g>
  ),
  brilho: <path d="M12 2l2.2 7.3L21.5 12l-7.3 2.7L12 22l-2.2-7.3L2.5 12l7.3-2.7z" fill="currentColor" />,
  balao: (
    <g>
      <ellipse cx="12" cy="9.5" rx="6.5" ry="7.5" fill="currentColor" />
      <path d="M12 17l-1.6 2.2h3.2z" fill="currentColor" />
      <path d="M12 19.2c-1.5 1.2 1.5 2 0 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      <path d="M8.6 6.5a4 4 0 0 1 2.2-2" stroke="#fff" strokeOpacity=".6" strokeWidth="1.4" strokeLinecap="round" fill="none" />
    </g>
  ),
  confete: (
    <g fill="currentColor">
      <rect x="3" y="5" width="5" height="2.4" rx=".8" transform="rotate(25 5.5 6.2)" />
      <rect x="14" y="3" width="5" height="2.4" rx=".8" transform="rotate(-30 16.5 4.2)" />
      <rect x="8" y="12" width="5" height="2.4" rx=".8" transform="rotate(60 10.5 13.2)" />
      <rect x="16" y="14" width="5" height="2.4" rx=".8" transform="rotate(10 18.5 15.2)" />
      <circle cx="5" cy="18.5" r="1.7" />
      <circle cx="12.5" cy="20" r="1.4" />
    </g>
  ),
  ovo: (
    <g>
      <path d="M12 2.5c4 0 7 6 7 11a7 7 0 0 1-14 0c0-5 3-11 7-11z" fill="currentColor" />
      <path d="M5.3 13.5l2.2-2 2.2 2 2.3-2 2.2 2 2.2-2 1.9 1.9" stroke="#fff" strokeOpacity=".85" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </g>
  ),
  flor: (
    <g>
      <g fill="currentColor">
        <circle cx="12" cy="6" r="3.6" />
        <circle cx="18" cy="10.4" r="3.6" />
        <circle cx="15.7" cy="17.4" r="3.6" />
        <circle cx="8.3" cy="17.4" r="3.6" />
        <circle cx="6" cy="10.4" r="3.6" />
      </g>
      <circle cx="12" cy="12" r="3" fill="#f7d46b" />
    </g>
  ),
  coracao: <path d="M12 21s-8-5.2-8-11a4.5 4.5 0 0 1 8-2.6A4.5 4.5 0 0 1 20 10c0 5.8-8 11-8 11z" fill="currentColor" />,
  bandeirinha: <path d="M3.5 4h17L12 20z" fill="currentColor" />,
  abobora: (
    <g>
      <path d="M12 7c-6 0-9 3.4-9 7.4S6 21 12 21s9-2.6 9-6.6S18 7 12 7z" fill="currentColor" />
      <path d="M12 7c0-2 .6-3.2 2.2-4" stroke="#2f7d4b" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M7.6 12.4l2.2 1.6-2.2.6zM16.4 12.4l-2.2 1.6 2.2.6zM8.5 17.2c2 1.4 5 1.4 7 0l-1-2.2-1.5 1-1.5-1-1.5 1z" fill="#2b1740" />
    </g>
  ),
  morcego: (
    <path
      d="M12 8.2c.9-1.8 1.7-2.4 2.9-2.4l.4 2.3c2-1.5 5-1.3 6.9.4-1 .5-1.5 1.2-1.6 2.2-.8-.5-1.7-.5-2.4-.1-.2 1-.8 1.7-1.7 2L12 18.5l-3.5-6.1c-.9-.3-1.5-1-1.7-2-.7-.4-1.6-.4-2.4.1-.1-1-.6-1.7-1.6-2.2 1.9-1.7 4.9-1.9 6.9-.4l.4-2.3c1.2 0 2 .6 2.9 2.4z"
      fill="currentColor"
    />
  ),
  losango: <path d="M12 2l10 10-10 10L2 12z" fill="currentColor" />,
};

function Desenho({ tipo, cor, className }: { tipo: Motivo; cor: 1 | 2 | 3; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`motivo motivo--cor${cor}${className ? ` ${className}` : ""}`} aria-hidden="true" focusable="false">
      {DESENHOS[tipo]}
    </svg>
  );
}

const cor = (i: number) => ((i % 3) + 1) as 1 | 2 | 3;

/** Faixa de mensagem no topo da página. Só aparece perto de uma data comemorativa. */
export function EventoFaixa() {
  const ativo = useMemo(eventoAtual, []);
  if (!ativo) return null;
  if (TEMA_APENAS_ARTE && ARTE[ativo.arte ?? ativo.evento.id]) return null;
  const { evento, anoFim } = ativo;
  const motivos = [...evento.motivos, ...evento.motivos].slice(0, 5);
  return (
    <div className="evento-faixa">
      <span className="evento-faixa__motivos" aria-hidden="true">
        {motivos.map((m, i) => (
          <Desenho key={i} tipo={m} cor={cor(i)} className="motivo--faixa" />
        ))}
      </span>
      <p>{evento.mensagem(anoFim)}</p>
      <span className="evento-faixa__motivos" aria-hidden="true">
        {[...motivos].reverse().map((m, i) => (
          <Desenho key={i} tipo={m} cor={cor(i + 1)} className="motivo--faixa" />
        ))}
      </span>
    </div>
  );
}

/** Posições (em % da foto), tamanho (px) e giro dos desenhos: uma "guirlanda" no alto da foto, onde fica o céu. */
const POSICOES = [
  { top: "5%", right: "6%", size: 40, giro: 12 },
  { top: "9%", right: "22%", size: 30, giro: -14 },
  { top: "4%", right: "38%", size: 36, giro: 18 },
  { top: "10%", right: "54%", size: 28, giro: -10 },
  { top: "5%", right: "70%", size: 34, giro: 16 },
];

/** Desenhos sobre a foto da página inicial (o texto fica fora da foto, então nada atrapalha a leitura). */
export function EventoDecor() {
  const ativo = useMemo(eventoAtual, []);
  if (!ativo) return null;
  const { evento, anoFim } = ativo;
  return (
    <div className={`evento-decor${ARTE[ativo.arte ?? evento.id] ? " evento-decor--tem-arte" : ""}`} aria-hidden="true">
      {POSICOES.map((pos, i) => (
        <span
          key={i}
          className="evento-decor__item"
          style={{
            top: pos.top,
            right: pos.right,
            width: pos.size,
            height: pos.size,
            ["--giro" as string]: `${pos.giro}deg`,
            animationDelay: `${i * 0.7}s`,
          }}
        >
          <Desenho tipo={evento.motivos[i % evento.motivos.length]} cor={cor(i)} />
        </span>
      ))}
      {evento.destaque && <span className="evento-decor__destaque">{evento.destaque(anoFim)}</span>}
    </div>
  );
}

/**
 * Arte do Canva sobre o topo da página (só em telas largas). `esq` fica ao lado do texto,
 * `dir` ao lado da foto; cada peça tem posição em px a partir do canto superior esquerdo do bloco.
 */
export function EventoArte({ lado }: { lado: "esq" | "dir" }) {
  const ativo = useMemo(eventoAtual, []);
  if (!ativo) return null;
  const pecas = ARTE[ativo.arte ?? ativo.evento.id]?.filter((p) => p.lado === lado);
  if (!pecas?.length) return null;
  return (
    <div className="evento-arte" aria-hidden="true">
      {pecas.map((p) => (
        <img
          key={p.src}
          src={p.src}
          alt=""
          draggable={false}
          className={p.atras ? "evento-arte__atras" : undefined}
          style={{ left: p.x, top: p.y, width: p.w, height: p.h }}
        />
      ))}
    </div>
  );
}
