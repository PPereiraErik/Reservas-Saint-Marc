/** Regras do cadastro de moradores (as mesmas que o banco aplica no modo conectado). */
import { isValidPhone } from "./phone";
import { BLOCOS, type FieldErrors } from "./rules";

export const PIN_MIN = 4;
export const PIN_MAX = 6;

export function isValidPin(pin: string): boolean {
  return new RegExp(`^\\d{${PIN_MIN},${PIN_MAX}}$`).test(pin);
}

export interface DadosMorador {
  nome: string;
  telefone: string;
  bloco: string;
  apartamento: string;
}

/** Valida nome, telefone e unidade. Cada campo com problema recebe uma mensagem. */
export function validateMorador(dados: DadosMorador): FieldErrors {
  const errors: FieldErrors = {};
  const nome = dados.nome.trim();
  if (nome.length < 3) errors.nome = "Informe seu nome completo.";
  else if (nome.length > 100) errors.nome = "O nome pode ter no máximo 100 caracteres.";
  if (!isValidPhone(dados.telefone)) errors.telefone = "Informe um telefone com DDD, por exemplo (47) 99999-9999.";
  if (!BLOCOS.includes(dados.bloco)) errors.bloco = "Escolha o seu bloco.";
  if (!/^\d{1,4}$/.test(dados.apartamento.trim())) errors.apartamento = "Informe o número do apartamento (só números).";
  return errors;
}

export function validatePin(pin: string): string | undefined {
  return isValidPin(pin) ? undefined : `A senha deve ter de ${PIN_MIN} a ${PIN_MAX} números.`;
}

export const MSG_SENHA_INCORRETA = "Bloco, apartamento ou senha incorretos.";
export const MSG_BLOQUEADO = "Muitas tentativas erradas. Aguarde 15 minutos e tente de novo.";

/** Hash SHA-256 em JavaScript puro (funciona em qualquer contexto, mesmo sem HTTPS). */
export function sha256(texto: string): string {
  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da, 0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070, 0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ]);
  const bytes = new TextEncoder().encode(texto);
  const comprimento = bytes.length;
  const total = (((comprimento + 9 + 63) >> 6) << 6);
  const dados = new Uint8Array(total);
  dados.set(bytes);
  dados[comprimento] = 0x80;
  const visao = new DataView(dados.buffer);
  visao.setUint32(total - 4, comprimento * 8, false);
  visao.setUint32(total - 8, Math.floor((comprimento * 8) / 0x100000000), false);
  const h = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const w = new Uint32Array(64);
  const rotr = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  for (let i = 0; i < total; i += 64) {
    for (let t = 0; t < 16; t++) w[t] = visao.getUint32(i + t * 4, false);
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
      const s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, hh] = h;
    for (let t = 0; t < 64; t++) {
      const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K[t] + w[t]) >>> 0;
      const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      hh = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    h[0] += a; h[1] += b; h[2] += c; h[3] += d; h[4] += e; h[5] += f; h[6] += g; h[7] += hh;
  }
  return Array.from(h, (x) => x.toString(16).padStart(8, "0")).join("");
}

/** Sal aleatório para o hash de uma senha. */
export function novoSal(): string {
  const bytes = new Uint8Array(16);
  try {
    crypto.getRandomValues(bytes);
  } catch {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Hash com sal e repetições (modo local; no modo conectado quem guarda a senha é o banco). */
export function hashSenha(senha: string, sal: string): string {
  let h = sha256(`${sal}:${senha}`);
  for (let i = 0; i < 2000; i++) h = sha256(`${sal}:${h}`);
  return h;
}
