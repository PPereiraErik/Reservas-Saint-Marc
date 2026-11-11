import { REGRAS_SALAO } from "../config";

/** Lista das regras do salão (editável em src/config.ts). */
export function RegrasSalao() {
  if (REGRAS_SALAO.length === 0) return null;
  return (
    <ul className="regras">
      {REGRAS_SALAO.map((regra) => (
        <li key={regra}>{regra}</li>
      ))}
    </ul>
  );
}
