/** Cadastro de moradores no modo local (localStorage). A senha é guardada só como hash com sal. */
import type { Morador, MoradorCadastrado, MoradorInput } from "../types";
import { createId } from "../utils/id";
import { MSG_SENHA_INCORRETA, hashSenha, novoSal, validateMorador, validatePin } from "../utils/moradores";
import { ReservationError } from "./errors";
import { readJSON, writeJSON } from "./storage";

const KEY = "moradores";

interface Registro extends Morador {
  id: string;
  sal: string;
  hash: string;
  criadoEm: string;
}

function ler(): Registro[] {
  const salvos = readJSON<Registro[]>(KEY);
  return Array.isArray(salvos) ? salvos : [];
}

const mesmaUnidade = (r: Morador, bloco: string, apto: string) => r.bloco === bloco && r.apartamento === apto.trim();
const publico = (r: Registro): Morador => ({ nome: r.nome, telefone: r.telefone, bloco: r.bloco, apartamento: r.apartamento });

function conferir(bloco: string, apto: string, pin: string): Registro {
  const registro = ler().find((r) => mesmaUnidade(r, bloco, apto));
  if (!registro || registro.hash !== hashSenha(pin, registro.sal)) throw new ReservationError(MSG_SENHA_INCORRETA);
  return registro;
}

export async function cadastrarMorador(input: MoradorInput): Promise<Morador> {
  const erro = Object.values(validateMorador(input))[0] ?? validatePin(input.pin);
  if (erro) throw new ReservationError(erro);
  const atuais = ler();
  if (atuais.some((r) => mesmaUnidade(r, input.bloco, input.apartamento))) {
    throw new ReservationError("Este apartamento já tem cadastro. Entre com a sua senha.");
  }
  const sal = novoSal();
  const novo: Registro = {
    id: createId(),
    nome: input.nome.trim(),
    telefone: input.telefone,
    bloco: input.bloco,
    apartamento: input.apartamento.trim(),
    sal,
    hash: hashSenha(input.pin, sal),
    criadoEm: new Date().toISOString(),
  };
  writeJSON(KEY, [...atuais, novo]);
  return publico(novo);
}

export async function entrarMorador(bloco: string, apartamento: string, pin: string): Promise<Morador> {
  return publico(conferir(bloco, apartamento, pin));
}

export async function atualizarMorador(bloco: string, apartamento: string, pin: string, dados: { nome: string; telefone: string }): Promise<Morador> {
  const atual = conferir(bloco, apartamento, pin);
  const erro = Object.values(validateMorador({ ...dados, bloco: atual.bloco, apartamento: atual.apartamento }))[0];
  if (erro) throw new ReservationError(erro);
  const novo = { ...atual, nome: dados.nome.trim(), telefone: dados.telefone };
  writeJSON(KEY, ler().map((r) => (r.id === atual.id ? novo : r)));
  return publico(novo);
}

export async function listarMoradores(): Promise<MoradorCadastrado[]> {
  return ler()
    .map((r) => ({ id: r.id, ...publico(r), criadoEm: r.criadoEm }))
    .sort((a, b) => a.bloco.localeCompare(b.bloco, "pt-BR") || Number(a.apartamento) - Number(b.apartamento));
}

export async function removerMorador(id: string): Promise<void> {
  writeJSON(KEY, ler().filter((r) => r.id !== id));
}

export function limparMoradoresSync(): void {
  writeJSON(KEY, []);
}
