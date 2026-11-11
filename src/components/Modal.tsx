import { useEffect, useId, useRef, type ReactNode } from "react";
import { Icon } from "./Icon";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  children: ReactNode;
}

/** Abre como modal nativo; se o navegador não souber (ou falhar), abre do jeito simples, sem travar. */
function abrirDialogo(dialog: HTMLDialogElement) {
  try {
    if (typeof dialog.showModal !== "function") throw new Error("sem showModal");
    dialog.showModal();
  } catch {
    dialog.setAttribute("open", "");
    dialog.classList.add("modal--simples");
  }
}

function fecharDialogo(dialog: HTMLDialogElement) {
  try {
    if (typeof dialog.close !== "function") throw new Error("sem close");
    dialog.close();
  } catch {
    dialog.removeAttribute("open");
  }
  dialog.classList.remove("modal--simples");
}

/**
 * Janela modal usando o elemento nativo <dialog>, que já cuida do foco,
 * da tecla Esc e da acessibilidade. No celular aparece como painel inferior.
 */
export function Modal({ open, onClose, title, description, children }: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) abrirDialogo(dialog);
    if (!open && dialog.open) fecharDialogo(dialog);
  }, [open]);

  // Navegadores sem <dialog> completo (iPhone antigo, navegador de WhatsApp/Instagram): o Esc e o scroll
  // são tratados aqui, para a janela nunca prender a tela.
  useEffect(() => {
    const dialog = ref.current;
    if (!open || !dialog || typeof dialog.showModal === "function") return;
    const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", aoTeclar);
    document.documentElement.classList.add("modal-aberto");
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.documentElement.classList.remove("modal-aberto");
    };
  }, [open, onClose]);

  return (
    <dialog
      ref={ref}
      className="modal"
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        // Clique fora do conteúdo (no fundo escurecido) fecha o modal.
        if (e.target === ref.current) onClose();
      }}
    >
      {open && (
        <div className="modal__body">
          <header className="modal__header">
            <div>
              <h2 id={titleId} className="modal__title">
                {title}
              </h2>
              {description && <p className="modal__description">{description}</p>}
            </div>
            <button type="button" className="icon-button" onClick={onClose} aria-label="Fechar">
              <Icon name="x" />
            </button>
          </header>
          {children}
        </div>
      )}
    </dialog>
  );
}
