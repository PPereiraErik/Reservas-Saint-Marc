import { useState, type KeyboardEvent } from "react";
import { Field } from "../components/ReservationForm";
import { Icon } from "../components/Icon";
import { useToast } from "../components/Toast";
import { useMorador } from "../hooks/useMorador";
import { navigate } from "../hooks/useRoute";
import { friendlyError } from "../utils/errors";
import { PIN_MAX, PIN_MIN, validateMorador, validatePin } from "../utils/moradores";
import { maskPhone } from "../utils/phone";
import { BLOCOS, type FieldErrors } from "../utils/rules";

type Modo = "cadastro" | "entrar";

const apenasNumeros = (v: string, max: number) => v.replace(/\D/g, "").slice(0, max);

/** Enter dentro de um campo envia o formulário (o envio nativo pode estar bloqueado em prévias). */
const enviarNoEnter = (acao: () => void) => (ev: KeyboardEvent) => {
  if (ev.key === "Enter" && (ev.target as HTMLElement).tagName === "INPUT") {
    ev.preventDefault();
    acao();
  }
};

export function CadastroPage() {
  const { morador } = useMorador();
  return (
    <div className="container container--narrow">
      {morador ? <MinhaConta /> : <Acesso />}
    </div>
  );
}

/** Cadastro novo ou entrada de quem já tem cadastro. */
function Acesso() {
  const { cadastrar, entrar } = useMorador();
  const toast = useToast();
  const [modo, setModo] = useState<Modo>("cadastro");
  const [form, setForm] = useState({ nome: "", telefone: "", bloco: BLOCOS[0], apartamento: "", pin: "", pin2: "" });
  const [errors, setErrors] = useState<FieldErrors & { pin?: string; pin2?: string }>({});
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  const update = (campo: keyof typeof form, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }));
    setErrors((prev) => ({ ...prev, [campo]: undefined }));
    setErro("");
  };

  const trocar = (novo: Modo) => {
    setModo(novo);
    setErrors({});
    setErro("");
  };

  const enviar = async () => {
    if (enviando) return;
    const found: FieldErrors & { pin?: string; pin2?: string } =
      modo === "cadastro"
        ? validateMorador(form)
        : (({ apartamento }) => (/^\d{1,4}$/.test(apartamento.trim()) ? {} : { apartamento: "Informe o número do apartamento (só números)." }))(form);
    const pinErro = validatePin(form.pin);
    if (pinErro) found.pin = pinErro;
    if (modo === "cadastro" && !pinErro && form.pin !== form.pin2) found.pin2 = "As senhas não são iguais.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setEnviando(true);
    try {
      if (modo === "cadastro") {
        await cadastrar({ nome: form.nome.trim(), telefone: form.telefone, bloco: form.bloco, apartamento: form.apartamento.trim(), pin: form.pin });
        toast("success", "Cadastro salvo.", "Seus dados já aparecem nas próximas reservas.");
      } else {
        await entrar(form.bloco, form.apartamento, form.pin);
        toast("success", "Você entrou na sua conta.");
      }
    } catch (error) {
      setErro(friendlyError(error, "Não foi possível concluir. Tente novamente."));
      setEnviando(false);
    }
  };

  return (
    <div className="card cadastro-card">
      <span className="login-card__icon">
        <Icon name="user" />
      </span>
      <h1 className="login-card__title">Cadastro do morador</h1>
      <p className="muted">
        Cadastre os dados do seu apartamento uma vez e eles ficam salvos: nas próximas reservas, nome e telefone já vêm preenchidos.
      </p>

      <div className="segmented" role="group" aria-label="Escolha uma opção">
        <button type="button" className={`segmented__item${modo === "cadastro" ? " is-active" : ""}`} aria-pressed={modo === "cadastro"} onClick={() => trocar("cadastro")}>
          Criar cadastro
        </button>
        <button type="button" className={`segmented__item${modo === "entrar" ? " is-active" : ""}`} aria-pressed={modo === "entrar"} onClick={() => trocar("entrar")}>
          Já tenho cadastro
        </button>
      </div>

      <form className="form" onSubmit={(e) => { e.preventDefault(); void enviar(); }} onKeyDown={enviarNoEnter(() => void enviar())} noValidate>
        {modo === "cadastro" && (
          <>
            <Field label="Nome completo" error={errors.nome}>
              {(props) => <input {...props} className="input" value={form.nome} onChange={(e) => update("nome", e.target.value)} placeholder="Maria Silva" autoComplete="name" maxLength={100} />}
            </Field>
            <Field label="Telefone (WhatsApp)" error={errors.telefone}>
              {(props) => <input {...props} type="tel" className="input" value={form.telefone} onChange={(e) => update("telefone", maskPhone(e.target.value))} placeholder="(47) 99999-9999" autoComplete="tel-national" inputMode="tel" maxLength={15} />}
            </Field>
          </>
        )}
        <div className="form__row">
          <Field label="Bloco" error={errors.bloco}>
            {(props) => (
              <select {...props} className="input" value={form.bloco} onChange={(e) => update("bloco", e.target.value)}>
                {BLOCOS.map((b) => <option key={b}>{b}</option>)}
              </select>
            )}
          </Field>
          <Field label="Apartamento" error={errors.apartamento}>
            {(props) => <input {...props} className="input" value={form.apartamento} onChange={(e) => update("apartamento", apenasNumeros(e.target.value, 4))} placeholder="101" inputMode="numeric" maxLength={4} />}
          </Field>
        </div>
        <Field label={`Senha (${PIN_MIN} a ${PIN_MAX} números)`} error={errors.pin} hint={modo === "cadastro" ? "Guarde esta senha" : undefined}>
          {(props) => <input {...props} type="password" className="input" value={form.pin} onChange={(e) => update("pin", apenasNumeros(e.target.value, PIN_MAX))} inputMode="numeric" autoComplete={modo === "cadastro" ? "new-password" : "current-password"} maxLength={PIN_MAX} />}
        </Field>
        {modo === "cadastro" && (
          <Field label="Repita a senha" error={errors.pin2}>
            {(props) => <input {...props} type="password" className="input" value={form.pin2} onChange={(e) => update("pin2", apenasNumeros(e.target.value, PIN_MAX))} inputMode="numeric" autoComplete="new-password" maxLength={PIN_MAX} />}
          </Field>
        )}
        {erro && (
          <p className="field__error" role="alert">
            <Icon name="alert" size={14} />
            {erro}
          </p>
        )}
        <button type="button" className="button button--primary button--block" onClick={() => void enviar()} disabled={enviando}>
          {enviando ? "Aguarde..." : modo === "cadastro" ? "Salvar cadastro" : "Entrar"}
        </button>
      </form>
      <p className="small muted">Cada apartamento tem um cadastro. A senha protege os seus dados: sem ela ninguém vê o seu nome e telefone.</p>
    </div>
  );
}

/** Dados do morador identificado, com opção de atualizar nome e telefone. */
function MinhaConta() {
  const { morador, atualizar, sair } = useMorador();
  const toast = useToast();
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ nome: morador?.nome ?? "", telefone: morador?.telefone ?? "", pin: "" });
  const [errors, setErrors] = useState<FieldErrors & { pin?: string }>({});
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  if (!morador) return null;

  const salvar = async () => {
    if (enviando) return;
    const found: FieldErrors & { pin?: string } = validateMorador({ ...form, bloco: morador.bloco, apartamento: morador.apartamento });
    delete found.bloco;
    delete found.apartamento;
    const pinErro = validatePin(form.pin);
    if (pinErro) found.pin = pinErro;
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setEnviando(true);
    try {
      await atualizar(form.pin, { nome: form.nome.trim(), telefone: form.telefone });
      toast("success", "Dados atualizados.");
      setEditando(false);
      setForm((p) => ({ ...p, pin: "" }));
    } catch (error) {
      setErro(friendlyError(error, "Não foi possível atualizar. Tente novamente."));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="card cadastro-card">
      <span className="login-card__icon">
        <Icon name="user" />
      </span>
      <h1 className="login-card__title">Minha conta</h1>
      <p className="muted">Estes dados já vêm preenchidos quando você reserva o salão.</p>

      <dl className="conta-dados">
        <div><dt>Nome</dt><dd>{morador.nome}</dd></div>
        <div><dt>Telefone</dt><dd>{morador.telefone}</dd></div>
        <div><dt>Unidade</dt><dd>Apto {morador.apartamento}, {morador.bloco}</dd></div>
      </dl>

      {editando ? (
        <form className="form" onSubmit={(e) => { e.preventDefault(); void salvar(); }} onKeyDown={enviarNoEnter(() => void salvar())} noValidate>
          <Field label="Nome completo" error={errors.nome}>
            {(props) => <input {...props} className="input" value={form.nome} onChange={(e) => { setForm({ ...form, nome: e.target.value }); setErro(""); }} maxLength={100} autoComplete="name" />}
          </Field>
          <Field label="Telefone (WhatsApp)" error={errors.telefone}>
            {(props) => <input {...props} type="tel" className="input" value={form.telefone} onChange={(e) => { setForm({ ...form, telefone: maskPhone(e.target.value) }); setErro(""); }} inputMode="tel" maxLength={15} autoComplete="tel-national" />}
          </Field>
          <Field label="Sua senha (para confirmar)" error={errors.pin}>
            {(props) => <input {...props} type="password" className="input" value={form.pin} onChange={(e) => { setForm({ ...form, pin: apenasNumeros(e.target.value, PIN_MAX) }); setErro(""); }} inputMode="numeric" maxLength={PIN_MAX} autoComplete="current-password" />}
          </Field>
          {erro && (
            <p className="field__error" role="alert">
              <Icon name="alert" size={14} />
              {erro}
            </p>
          )}
          <div className="form__footer">
            <button type="button" className="button button--secondary" onClick={() => setEditando(false)}>Cancelar</button>
            <button type="button" className="button button--primary" onClick={() => void salvar()} disabled={enviando}>{enviando ? "Salvando..." : "Salvar alterações"}</button>
          </div>
        </form>
      ) : (
        <div className="button-row">
          <button type="button" className="button button--primary" onClick={() => navigate("/reservar")}>
            <Icon name="calendarCheck" size={18} /> Reservar o salão
          </button>
          <button type="button" className="button button--secondary" onClick={() => setEditando(true)}>Atualizar dados</button>
          <button type="button" className="button button--ghost" onClick={() => { sair(); toast("info", "Você saiu da sua conta."); }}>
            <Icon name="logOut" size={18} /> Sair
          </button>
        </div>
      )}
    </div>
  );
}
