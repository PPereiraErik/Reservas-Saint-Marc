import { MODO_DEMO } from "../config";
import * as local from "./moradores.local";
import * as remote from "./moradores.remote";

const impl = MODO_DEMO ? local : remote;

export const cadastrarMorador = impl.cadastrarMorador;
export const entrarMorador = impl.entrarMorador;
export const atualizarMorador = impl.atualizarMorador;
export const listarMoradores = impl.listarMoradores;
export const removerMorador = impl.removerMorador;
