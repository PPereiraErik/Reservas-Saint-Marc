import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

/**
 * Rede de segurança: se uma tela der erro, o menu continua funcionando e o morador
 * vê uma mensagem com saída, em vez de uma página travada ou em branco.
 */
export class ErrorBoundary extends Component<Props, { erro: boolean }> {
  state = { erro: false };

  static getDerivedStateFromError() {
    return { erro: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Erro na tela:", error);
  }

  render() {
    if (!this.state.erro) return this.props.children;
    return (
      <div className="container">
        <div className="notice notice--danger" role="alert">
          <div>
            <p className="notice__title">Algo deu errado nesta tela</p>
            <p>Seus dados estão seguros. Volte ao início ou recarregue a página para tentar de novo.</p>
            <div className="button-row">
              <a className="button button--primary" href="#/" onClick={() => this.setState({ erro: false })}>
                Voltar ao início
              </a>
              <button type="button" className="button button--secondary" onClick={() => window.location.reload()}>
                Recarregar a página
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
