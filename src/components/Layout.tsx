import { useRef, type ReactNode } from "react";
import { CONDOMINIO, MODO_DEMO } from "../config";
import { useAuth } from "../hooks/useAuth";
import { useMorador } from "../hooks/useMorador";
import { useReservations } from "../hooks/useReservations";
import type { Route, RoutePath } from "../hooks/useRoute";
import { openA11yPanel } from "../hooks/useA11y";
import { useTheme } from "../hooks/useTheme";
import { InstalarApp } from "./InstalarApp";
import { A11yPanel } from "./A11yPanel";
import { EventoFaixa } from "./Evento";
import { Icon, type IconName } from "./Icon";
import { Logo } from "./Logo";
import { useToast } from "./Toast";

interface NavItem {
  path: RoutePath;
  label: string;
  icon: IconName;
}

const PUBLIC_NAV: NavItem[] = [
  { path: "/", label: "Início", icon: "home" },
  { path: "/reservar", label: "Reservar", icon: "calendarCheck" },
];

const CADASTRO_ITEM: NavItem = { path: "/cadastro", label: "Cadastro", icon: "user" };

const ADMIN_NAV: NavItem[] = [
  { path: "/admin", label: "Painel", icon: "grid" },
  { path: "/admin/reservas", label: "Reservas", icon: "list" },
  { path: "/admin/moradores", label: "Moradores", icon: "building" },
];

const LOGIN_ITEM: NavItem = { path: "/entrar", label: "Administração", icon: "lock" };

/**
 * Estrutura da página: cabeçalho fixo no topo e, no celular,
 * uma barra de abas na parte de baixo (como nos apps de reserva).
 */
export function Layout({ route, children }: { route: Route; children: ReactNode }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { morador } = useMorador();
  const { reservas } = useReservations();
  const toast = useToast();
  const mainRef = useRef<HTMLElement>(null);

  const pendentes = reservas.filter((r) => r.status === "pendente").length;
  const cadastro = { ...CADASTRO_ITEM, label: morador ? "Minha conta" : "Cadastro" };
  const items = user ? [...PUBLIC_NAV, cadastro, ...ADMIN_NAV] : [...PUBLIC_NAV, cadastro, LOGIN_ITEM];

  const handleLogout = async () => {
    await logout();
    toast("info", "Você saiu da área administrativa.");
  };

  const isActive = (path: RoutePath) =>
    route.path === path || (path === "/entrar" && (route.path === "/admin" || route.path === "/admin/reservas" || route.path === "/admin/moradores"));

  const renderLink = (item: NavItem, variant: "top" | "tab") => {
    const active = isActive(item.path);
    const showBadge = item.path === "/admin/reservas" && user && pendentes > 0;
    return (
      <li key={item.path}>
        <a
          href={`#${item.path}`}
          className={`${variant === "top" ? "nav-link" : "tab-link"}${active ? " is-active" : ""}`}
          aria-current={active ? "page" : undefined}
        >
          {variant === "tab" && <Icon name={item.icon} size={22} />}
          <span>{item.label}</span>
          {showBadge && (
            <span className="nav-badge">
              {pendentes}
              <span className="sr-only"> pendentes</span>
            </span>
          )}
        </a>
      </li>
    );
  };

  return (
    <div className="app">
      {/* O roteamento usa o hash da URL, então o link pula para o conteúdo sem mudar o endereço. */}
      <a
        href="#conteudo"
        className="skip-link"
        onClick={(e) => {
          e.preventDefault();
          mainRef.current?.focus();
        }}
      >
        Pular para o conteúdo
      </a>

      <EventoFaixa />

      <header className="header">
        <div className="header__inner">
          <a href="#/" className="brand" aria-label={`${CONDOMINIO.sistema}, início`}>
            <Logo size={34} />
            <span className="brand__text">
              <span className="brand__name">{CONDOMINIO.nome}</span>
              <span className="brand__tagline">Reservas do salão de festas</span>
            </span>
          </a>

          <nav className="header__nav" aria-label="Páginas">
            <ul>{items.map((item) => renderLink(item, "top"))}</ul>
          </nav>

          <div className="header__actions">
            {MODO_DEMO && (
              <span className="demo-pill" title="Os dados ficam salvos apenas neste navegador.">
                Modo local
              </span>
            )}
            <button
              type="button"
              className="icon-button icon-button--round"
              onClick={openA11yPanel}
              aria-label="Abrir opções de acessibilidade"
              title="Acessibilidade"
            >
              <Icon name="accessibility" size={18} />
            </button>
            <button
              type="button"
              className="icon-button icon-button--round"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Ativar tema claro" : "Ativar tema escuro"}
              title={theme === "dark" ? "Tema claro" : "Tema escuro"}
            >
              <Icon name={theme === "dark" ? "sun" : "moon"} size={18} />
            </button>
            {user && (
              <button type="button" className="button button--secondary button--sm header__logout" onClick={handleLogout}>
                <Icon name="logOut" size={16} />
                Sair
              </button>
            )}
          </div>
        </div>
      </header>

      <main id="conteudo" ref={mainRef} tabIndex={-1} className="page" key={route.path}>
        {children}
      </main>

      <footer className="footer">
        <p>
          {MODO_DEMO
            ? `${CONDOMINIO.sistema}, projeto de portfólio de Erik Pinheiro. Neste modo os dados ficam salvos apenas neste navegador.`
            : `${CONDOMINIO.sistema}. Desenvolvido por Erik Pinheiro.`}
        </p>
        <InstalarApp />
      </footer>

      <nav className="tabbar" aria-label="Navegação rápida">
        <ul>{items.map((item) => renderLink(item, "tab"))}</ul>
      </nav>

      <A11yPanel />
    </div>
  );
}
