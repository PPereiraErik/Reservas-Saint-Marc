import { useState } from "react";
import {
  SCALE_STEPS,
  closeA11yPanel,
  isA11yDefault,
  resetA11y,
  setA11y,
  useA11y,
  useA11yPanel,
  type A11yPrefs,
} from "../hooks/useA11y";
import { Modal } from "./Modal";

type ToggleKey = Exclude<keyof A11yPrefs, "scale">;

const TOGGLES: { key: ToggleKey; label: string; hint: string }[] = [
  { key: "contrast", label: "Alto contraste", hint: "Preto e branco, com bordas firmes." },
  { key: "focus", label: "Destacar o foco", hint: "Contorno grosso no item selecionado pelo teclado." },
  { key: "motion", label: "Reduzir animações", hint: "Para o movimento de decorações e transições." },
  { key: "spacing", label: "Espaçar o texto", hint: "Mais espaço entre linhas, letras e palavras." },
  { key: "colorSafe", label: "Não depender de cor", hint: "Links sublinhados e marcação ✓ no que está escolhido." },
  { key: "simpleFont", label: "Fonte simples", hint: "Usa a letra padrão do aparelho." },
  { key: "decor", label: "Decorações de datas comemorativas", hint: "Natal, Páscoa, Halloween e outras datas." },
];

/** Painel de acessibilidade: abre pelo botão do cabeçalho e guarda as escolhas neste aparelho. */
export function A11yPanel() {
  const open = useA11yPanel();
  const prefs = useA11y();
  const [aviso, setAviso] = useState("");

  const toggle = (key: ToggleKey, label: string) => {
    const next = !prefs[key];
    setA11y({ [key]: next } as Partial<A11yPrefs>);
    setAviso(`${label}: ${next ? "ligado" : "desligado"}`);
  };

  const stepScale = (dir: -1 | 1) => {
    const i = SCALE_STEPS.indexOf(prefs.scale as (typeof SCALE_STEPS)[number]);
    const next = SCALE_STEPS[Math.min(SCALE_STEPS.length - 1, Math.max(0, i + dir))];
    setA11y({ scale: next });
    setAviso(`Tamanho do texto: ${Math.round(next * 100)}%`);
  };

  return (
    <Modal
      open={open}
      onClose={closeA11yPanel}
      title="Acessibilidade"
      description="Os ajustes ficam salvos neste aparelho."
    >
      <div className="a11y">
        <div className="a11y__row">
          <span id="a11y-tamanho" className="a11y__label">
            Tamanho do texto
          </span>
          <div className="a11y__scale" role="group" aria-labelledby="a11y-tamanho">
            <button
              type="button"
              className="button button--secondary button--sm"
              onClick={() => stepScale(-1)}
              disabled={prefs.scale === SCALE_STEPS[0]}
              aria-label="Diminuir o texto"
            >
              A−
            </button>
            <output className="a11y__value" aria-live="polite">
              {Math.round(prefs.scale * 100)}%
            </output>
            <button
              type="button"
              className="button button--secondary button--sm"
              onClick={() => stepScale(1)}
              disabled={prefs.scale === SCALE_STEPS[SCALE_STEPS.length - 1]}
              aria-label="Aumentar o texto"
            >
              A+
            </button>
          </div>
        </div>

        {TOGGLES.map(({ key, label, hint }) => (
          <div key={key} className="a11y__row">
            <span className="a11y__text">
              <span id={`a11y-${key}`} className="a11y__label">
                {label}
              </span>
              <span className="a11y__hint">{hint}</span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={prefs[key]}
              aria-labelledby={`a11y-${key}`}
              className="a11y__switch"
              onClick={() => toggle(key, label)}
            />
          </div>
        ))}

        <button
          type="button"
          className="button button--secondary button--block"
          disabled={isA11yDefault(prefs)}
          onClick={() => {
            resetA11y();
            setAviso("Ajustes restaurados para o padrão");
          }}
        >
          Restaurar o padrão
        </button>
        <p className="sr-only" role="status" aria-live="polite">
          {aviso}
        </p>
      </div>
    </Modal>
  );
}
