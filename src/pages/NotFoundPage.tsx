export function NotFoundPage() {
  return (
    <div className="container container--narrow not-found">
      <p className="not-found__code">404</p>
      <h1 className="page-header__title">Página não encontrada</h1>
      <p className="muted">O endereço acessado não existe.</p>
      <a href="#/" className="button button--primary">
        Voltar ao início
      </a>
    </div>
  );
}
