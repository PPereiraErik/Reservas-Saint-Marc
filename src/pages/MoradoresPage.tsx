import { useCallback, useEffect, useMemo, useState } from "react";
import { EmptyState, LoadingState } from "../components/Feedback";
import { Icon } from "../components/Icon";
import { useToast } from "../components/Toast";
import { listarMoradores, removerMorador } from "../services/moradores";
import type { MoradorCadastrado } from "../types";
import { friendlyError } from "../utils/errors";
import { phoneLink, whatsappLink } from "../utils/phone";

const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/** Cadastros dos moradores vistos pela administração (a senha nunca aparece). */
export function MoradoresPage() {
  const toast = useToast();
  const [lista, setLista] = useState<MoradorCadastrado[] | null>(null);
  const [falhou, setFalhou] = useState(false);
  const [busca, setBusca] = useState("");
  const [ocupado, setOcupado] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setFalhou(false);
    try {
      setLista(await listarMoradores());
    } catch (error) {
      setFalhou(true);
      toast("error", friendlyError(error, "Não foi possível carregar os cadastros."));
    }
  }, [toast]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const filtrada = useMemo(() => {
    if (!lista) return [];
    const q = normalizar(busca);
    if (!q) return lista;
    const digitos = q.replace(/\D/g, "");
    return lista.filter(
      (m) =>
        normalizar(m.nome).includes(q) ||
        normalizar(`apto ${m.apartamento} ${m.bloco}`).includes(q) ||
        (digitos.length > 0 && m.telefone.replace(/\D/g, "").includes(digitos)),
    );
  }, [lista, busca]);

  const remover = async (m: MoradorCadastrado) => {
    if (!window.confirm(`Remover o cadastro de ${m.nome} (Apto ${m.apartamento}, ${m.bloco})? A pessoa poderá se cadastrar de novo.`)) return;
    setOcupado(m.id);
    try {
      await removerMorador(m.id);
      toast("success", "Cadastro removido.");
      await carregar();
    } catch (error) {
      toast("error", friendlyError(error, "Não foi possível remover. Tente novamente."));
    } finally {
      setOcupado(null);
    }
  };

  return (
    <div className="container">
      <header className="page-header">
        <div>
          <h1 className="page-header__title">Moradores</h1>
          <p className="page-header__text">Cadastros feitos pelos moradores, um por apartamento.</p>
        </div>
        <button type="button" className="button button--ghost" onClick={() => void carregar()}>
          <Icon name="refresh" size={18} /> Atualizar
        </button>
      </header>

      {lista === null && !falhou && <LoadingState text="Carregando cadastros..." />}
      {falhou && lista === null && (
        <div className="state" role="alert">
          <p className="state__title">Não foi possível carregar os cadastros.</p>
          <button type="button" className="button button--secondary" onClick={() => void carregar()}>Tentar novamente</button>
        </div>
      )}

      {lista && lista.length === 0 && (
        <EmptyState icon="user" title="Nenhum cadastro ainda." text="Quando um morador se cadastrar na aba Cadastro, ele aparece aqui." />
      )}

      {lista && lista.length > 0 && (
        <>
          <div className="card filters">
            <label className="search">
              <span className="sr-only">Buscar moradores</span>
              <Icon name="search" size={18} />
              <input type="search" className="input" placeholder="Nome, apartamento, bloco ou telefone" value={busca} onChange={(e) => setBusca(e.target.value)} />
            </label>
          </div>
          <p className="muted small">{filtrada.length} de {lista.length} cadastros</p>
          <ul className="espera__lista moradores-lista">
            {filtrada.map((m) => (
              <li key={m.id} className="espera__item">
                <div className="espera__info">
                  <strong>{m.nome}</strong>
                  <span className="muted">Apto {m.apartamento}, {m.bloco} · {m.telefone}</span>
                </div>
                <div className="espera__acoes">
                  <a className="button button--secondary button--sm" href={phoneLink(m.telefone)}>
                    <Icon name="phone" size={16} /> Ligar
                  </a>
                  <a className="button button--secondary button--sm" href={whatsappLink(m.telefone)} target="_blank" rel="noopener noreferrer">
                    <Icon name="message" size={16} /> WhatsApp
                  </a>
                  <button type="button" className="button button--ghost-danger button--sm" disabled={ocupado === m.id} onClick={() => void remover(m)}>
                    <Icon name="trash" size={16} /> Remover
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
