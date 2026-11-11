import { MODO_DEMO } from "../config";
import * as local from "./bloqueios.local";
import * as remote from "./bloqueios.remote";

const impl = MODO_DEMO ? local : remote;

export const getBloqueios = impl.getBloqueios;
export const addBloqueio = impl.addBloqueio;
export const removeBloqueio = impl.removeBloqueio;
