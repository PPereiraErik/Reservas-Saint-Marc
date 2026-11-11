import { useEffect } from "react";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Layout } from "./components/Layout";
import { ToastProvider } from "./components/Toast";
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { MoradorProvider } from "./hooks/useMorador";
import { ReservationsProvider } from "./hooks/useReservations";
import { navigate, useRoute, type Route } from "./hooks/useRoute";
import { CadastroPage } from "./pages/CadastroPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { MoradoresPage } from "./pages/MoradoresPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ReservationsPage } from "./pages/ReservationsPage";
import { ReservePage } from "./pages/ReservePage";

/** Quem já está logado e abre #/entrar vai direto para o dashboard. */
function RedirectToDashboard() {
  useEffect(() => navigate("/admin"), []);
  return null;
}

function CurrentPage({ route }: { route: Route }) {
  const { user } = useAuth();
  const isAdminPage = route.path === "/admin" || route.path === "/admin/reservas" || route.path === "/admin/moradores";

  // Páginas administrativas exigem login; depois de entrar, a página pedida aparece.
  if (isAdminPage && !user) return <LoginPage />;

  switch (route.path) {
    case "/":
      return <HomePage />;
    case "/reservar":
      return <ReservePage initialDate={route.params.get("data")} />;
    case "/cadastro":
      return <CadastroPage />;
    case "/entrar":
      return user ? <RedirectToDashboard /> : <LoginPage />;
    case "/admin":
      return <DashboardPage />;
    case "/admin/reservas":
      return <ReservationsPage />;
    case "/admin/moradores":
      return <MoradoresPage />;
    default:
      return <NotFoundPage />;
  }
}

export function App() {
  const route = useRoute();

  return (
    <ToastProvider>
      <AuthProvider>
        <MoradorProvider>
          <ReservationsProvider>
            <Layout route={route}>
              <ErrorBoundary key={route.path}>
                <CurrentPage route={route} />
              </ErrorBoundary>
            </Layout>
          </ReservationsProvider>
        </MoradorProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
