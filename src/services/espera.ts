import { MODO_DEMO } from "../config";
import * as local from "./espera.local";
import * as remote from "./espera.remote";

const impl = MODO_DEMO ? local : remote;

export const getEspera = impl.getEspera;
export const joinWaitlist = impl.joinWaitlist;
export const removeEspera = impl.removeEspera;
