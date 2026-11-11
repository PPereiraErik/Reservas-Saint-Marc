import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { applyA11y } from "./hooks/useA11y";
import { aplicarEvento } from "./temas/aplicar";
import "./styles/base.css";
import "./styles/layout.css";
import "./styles/components.css";
import "./styles/pages.css";
import "./styles/eventos.css";
import "./styles/a11y.css";

// Aplica acessibilidade e tema de data antes da primeira tela, para não piscar.
applyA11y();
aplicarEvento();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Instalação como app e uso sem sinal (só em site publicado com https; no desenvolvimento fica desligado).
if (import.meta.env.PROD && "serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
}
