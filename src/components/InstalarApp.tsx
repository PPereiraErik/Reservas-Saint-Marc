import { useEffect, useState } from "react";

interface EventoInstalar extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

function jaInstalado(): boolean {
  return window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function ehIphone(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** Convite discreto no rodapé para instalar o site como app (Android/Chrome) ou ensinar o caminho no iPhone. */
export function InstalarApp() {
  const [evento, setEvento] = useState<EventoInstalar | null>(null);
  const [instalado, setInstalado] = useState(() => jaInstalado());

  useEffect(() => {
    const antes = (e: Event) => {
      e.preventDefault();
      setEvento(e as EventoInstalar);
    };
    const depois = () => setInstalado(true);
    window.addEventListener("beforeinstallprompt", antes);
    window.addEventListener("appinstalled", depois);
    return () => {
      window.removeEventListener("beforeinstallprompt", antes);
      window.removeEventListener("appinstalled", depois);
    };
  }, []);

  if (instalado) return null;

  if (evento) {
    return (
      <button
        type="button"
        className="button button--secondary button--sm"
        onClick={async () => {
          await evento.prompt();
          await evento.userChoice;
          setEvento(null);
        }}
      >
        Instalar o app no celular
      </button>
    );
  }

  if (ehIphone()) {
    return <p className="footer__dica">No iPhone: toque em Compartilhar e depois em "Adicionar à Tela de Início".</p>;
  }
  return null;
}
