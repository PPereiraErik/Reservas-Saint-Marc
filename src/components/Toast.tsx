import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";
import { Icon } from "./Icon";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  type: ToastType;
  title: string;
  description?: string;
}

type ShowToast = (type: ToastType, title: string, description?: string) => void;

const ToastContext = createContext<ShowToast | null>(null);
const DURATION_MS = 5000;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const show = useCallback<ShowToast>(
    (type, title, description) => {
      const id = nextId.current++;
      setToasts((list) => [...list.slice(-2), { id, type, title, description }]);
      window.setTimeout(() => dismiss(id), DURATION_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`}>
            <Icon name={t.type === "success" ? "check" : t.type === "error" ? "alert" : "info"} />
            <div className="toast__text">
              <p className="toast__title">{t.title}</p>
              {t.description && <p className="toast__description">{t.description}</p>}
            </div>
            <button
              type="button"
              className="icon-button icon-button--sm"
              onClick={() => dismiss(t.id)}
              aria-label="Fechar aviso"
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const show = useContext(ToastContext);
  if (!show) throw new Error("useToast precisa estar dentro de <ToastProvider>");
  return show;
}
