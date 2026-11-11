import { useEffect, useState } from "react";

/**
 * Roteamento simples baseado no hash da URL (ex.: #/admin).
 * Funciona em qualquer hospedagem estática (GitHub Pages, Vercel, Netlify)
 * e até abrindo o arquivo HTML direto no navegador, sem configurar servidor.
 *
 * A rota também é guardada na memória: em prévias isoladas (dentro de um app, iframe
 * sem permissão) o endereço da página não pode mudar, e mesmo assim a navegação funciona.
 */

export type RoutePath = "/" | "/reservar" | "/cadastro" | "/entrar" | "/admin" | "/admin/reservas" | "/admin/moradores";

const ROUTES: RoutePath[] = ["/", "/reservar", "/cadastro", "/entrar", "/admin", "/admin/reservas", "/admin/moradores"];

export interface Route {
  path: RoutePath | "404";
  params: URLSearchParams;
}

function parse(raw: string): Route {
  const [pathname, query = ""] = (raw.replace(/^#/, "") || "/").split("?");
  const path = ROUTES.includes(pathname as RoutePath) ? (pathname as RoutePath) : "404";
  return { path, params: new URLSearchParams(query) };
}

function hashAtual(): string {
  try {
    return window.location.hash;
  } catch {
    return "";
  }
}

let atual: Route = parse(hashAtual());
const ouvintes = new Set<(r: Route) => void>();

function definir(raw: string) {
  atual = parse(raw);
  ouvintes.forEach((fn) => fn(atual));
  try {
    window.scrollTo({ top: 0 });
  } catch {
    // Sem rolagem programática: não faz falta.
  }
}

export function navigate(path: RoutePath, params?: Record<string, string>) {
  const query = params ? `?${new URLSearchParams(params).toString()}` : "";
  const destino = `${path}${query}`;
  definir(destino);
  try {
    // Mantém o endereço em dia (botão Voltar do navegador, links copiados).
    if (hashAtual() !== `#${destino}`) window.history.pushState(null, "", `#${destino}`);
  } catch {
    // Prévia isolada: o endereço não muda, a navegação continua pela memória.
  }
}

/** Todo link "#/rota" do site passa por aqui, sem depender de o navegador mudar o endereço. */
function interceptarLinks(e: MouseEvent) {
  if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  const alvo = e.target instanceof Element ? e.target.closest("a[href^='#/']") : null;
  if (!alvo || alvo.getAttribute("target") === "_blank") return;
  e.preventDefault();
  const destino = (alvo.getAttribute("href") ?? "#/").slice(1);
  definir(destino);
  try {
    if (hashAtual() !== `#${destino}`) window.history.pushState(null, "", `#${destino}`);
  } catch {
    // Prévia isolada: segue só pela memória.
  }
}

if (typeof document !== "undefined") document.addEventListener("click", interceptarLinks);

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(atual);

  useEffect(() => {
    const aoMudar = (r: Route) => setRoute(r);
    ouvintes.add(aoMudar);
    // Botão Voltar/Avançar do navegador e mudança manual do endereço.
    const aoMudarHash = () => definir(hashAtual());
    window.addEventListener("hashchange", aoMudarHash);
    window.addEventListener("popstate", aoMudarHash);
    setRoute(atual);
    return () => {
      ouvintes.delete(aoMudar);
      window.removeEventListener("hashchange", aoMudarHash);
      window.removeEventListener("popstate", aoMudarHash);
    };
  }, []);

  return route;
}
