import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

export function LoadingState({ text = "Carregando..." }: { text?: string }) {
  return (
    <div className="state" role="status">
      <span className="spinner" aria-hidden="true" />
      <p className="state__text">{text}</p>
    </div>
  );
}

interface EmptyStateProps {
  icon?: IconName;
  title: string;
  text?: string;
  action?: ReactNode;
}

export function EmptyState({ icon = "inbox", title, text, action }: EmptyStateProps) {
  return (
    <div className="state">
      <span className="state__icon">
        <Icon name={icon} />
      </span>
      <p className="state__title">{title}</p>
      {text && <p className="state__text">{text}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ onRetry, onReset }: { onRetry: () => void; onReset?: () => void }) {
  return (
    <div className="state" role="alert">
      <span className="state__icon state__icon--error">
        <Icon name="alert" />
      </span>
      <p className="state__title">Não foi possível carregar as reservas.</p>
      <p className="state__text">
        {onReset
          ? "Tente novamente. Se o problema continuar, apague os dados guardados neste navegador."
          : "Confira a conexão com a internet e tente novamente."}
      </p>
      <div className="button-row">
        <button type="button" className="button button--secondary" onClick={onRetry}>
          Tentar novamente
        </button>
        {onReset && (
          <button type="button" className="button button--ghost" onClick={onReset}>
            Apagar dados deste navegador
          </button>
        )}
      </div>
    </div>
  );
}
