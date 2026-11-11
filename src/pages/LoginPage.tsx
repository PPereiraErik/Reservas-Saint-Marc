import { useState } from "react";
import { Icon } from "../components/Icon";
import { useToast } from "../components/Toast";
import { MODO_DEMO } from "../config";
import { useAuth } from "../hooks/useAuth";
import { SENHA_MIN, existeAdmin } from "../services/auth";

/**
 * Entrada da administração. No modo local, enquanto não existe uma conta, a mesma tela cria a
 * conta do administrador (e-mail e senha). Depois disso, só essa conta entra.
 */
export function LoginPage() {
  const { login, criarConta } = useAuth();
  const toast = useToast();
  const criando = MODO_DEMO && !existeAdmin();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const limpar = () => setError("");

  const handleSubmit = async () => {
    if (submitting) return;
    if (!email.trim() || !senha) {
      setError("Preencha o e-mail e a senha.");
      return;
    }
    if (criando) {
      if (senha.length < SENHA_MIN) {
        setError(`A senha deve ter pelo menos ${SENHA_MIN} caracteres.`);
        return;
      }
      if (senha !== confirmar) {
        setError("As senhas não são iguais.");
        return;
      }
    }
    setSubmitting(true);
    try {
      if (criando) await criarConta(email, senha);
      else await login(email, senha);
      toast("success", criando ? "Conta de administrador criada." : "Bem-vindo à área administrativa.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar.");
      setSubmitting(false);
    }
  };

  return (
    <div className="container container--narrow">
      <div className="card login-card">
        <span className="login-card__icon">
          <Icon name="lock" />
        </span>
        <h1 className="login-card__title">{criando ? "Criar conta de administrador" : "Área administrativa"}</h1>
        <p className="muted">
          {criando
            ? "Defina o e-mail e a senha do administrador. Só esta conta poderá entrar na área administrativa."
            : "Entre para aprovar e gerenciar as reservas do salão."}
        </p>

        <form
          className="form"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
          onKeyDown={(ev) => {
            const alvo = ev.target as HTMLElement;
            if (ev.key === "Enter" && alvo.tagName === "INPUT") {
              ev.preventDefault();
              void handleSubmit();
            }
          }}
          noValidate
        >
          <div className="field">
            <label htmlFor="login-email">E-mail</label>
            <input
              id="login-email"
              type="email"
              className="input"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                limpar();
              }}
              autoComplete="username"
              placeholder="seu@email.com"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "login-erro" : undefined}
            />
          </div>
          <div className="field">
            <label htmlFor="login-senha">{criando ? `Senha (mínimo ${SENHA_MIN} caracteres)` : "Senha"}</label>
            <input
              id="login-senha"
              type="password"
              className="input"
              value={senha}
              onChange={(e) => {
                setSenha(e.target.value);
                limpar();
              }}
              autoComplete={criando ? "new-password" : "current-password"}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "login-erro" : undefined}
            />
          </div>
          {criando && (
            <div className="field">
              <label htmlFor="login-confirmar">Repita a senha</label>
              <input
                id="login-confirmar"
                type="password"
                className="input"
                value={confirmar}
                onChange={(e) => {
                  setConfirmar(e.target.value);
                  limpar();
                }}
                autoComplete="new-password"
              />
            </div>
          )}
          {error && (
            <p id="login-erro" className="field__error" role="alert">
              <Icon name="alert" size={14} />
              {error}
            </p>
          )}
          <button type="button" onClick={() => void handleSubmit()} className="button button--primary button--block" disabled={submitting}>
            {submitting ? (criando ? "Criando..." : "Entrando...") : criando ? "Criar conta e entrar" : "Entrar"}
          </button>
        </form>

        <p className="small muted">
          {MODO_DEMO
            ? "Modo local: a conta fica guardada neste navegador. Para uso real, conecte o banco de dados (veja a documentação)."
            : "Acesso restrito à administração do condomínio."}
        </p>
      </div>
    </div>
  );
}
