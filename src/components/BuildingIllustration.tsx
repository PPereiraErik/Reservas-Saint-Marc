/**
 * Ilustração do condomínio usada no banner enquanto não há foto própria.
 * Prédios de quatro andares com telhado de duas águas e faixas em cinza-esverdeado,
 * nas cores da fachada. Propositalmente genérica: não identifica o endereço.
 */

const FLOORS = [0, 1, 2, 3];

function Building({
  x,
  width,
  top,
  base,
  columns,
}: {
  x: number;
  width: number;
  top: number;
  base: number;
  /** Posições (relativas) das faixas verticais escuras. */
  columns: number[];
}) {
  const floorHeight = (base - top) / 4;
  const roofPeak = top - width * 0.16;
  const windowsPerFloor = Math.max(2, Math.round(width / 95));
  const gap = width / (windowsPerFloor + 1);

  return (
    <g>
      <rect x={x} y={top} width={width} height={base - top} fill="var(--art-wall)" />
      {columns.map((c) => (
        <rect key={c} x={x + c * width - 16} y={top} width={32} height={base - top} fill="var(--art-column)" />
      ))}
      {FLOORS.map((f) => {
        const y = top + f * floorHeight + floorHeight * 0.22;
        return (
          <g key={f}>
            {Array.from({ length: windowsPerFloor }, (_, i) => {
              const wx = x + gap * (i + 1) - 17;
              return (
                <g key={i}>
                  <rect x={wx} y={y} width={34} height={floorHeight * 0.5} rx={2} fill="var(--art-window)" />
                  <path d={`M${wx + 17} ${y}v${floorHeight * 0.5}`} stroke="var(--art-frame)" strokeWidth={2} />
                </g>
              );
            })}
            {f > 0 && (
              <g>
                <rect
                  x={x + width * 0.08}
                  y={top + f * floorHeight + floorHeight * 0.62}
                  width={width * 0.3}
                  height={floorHeight * 0.26}
                  fill="var(--art-balcony)"
                />
                <rect
                  x={x + width * 0.08}
                  y={top + f * floorHeight + floorHeight * 0.62}
                  width={width * 0.3}
                  height={4}
                  fill="var(--art-wall)"
                />
              </g>
            )}
          </g>
        );
      })}
      <path
        d={`M${x - 18} ${top + 4} L${x + width / 2} ${roofPeak} L${x + width + 18} ${top + 4} Z`}
        fill="var(--art-roof)"
      />
      <rect x={x - 18} y={top} width={width + 36} height={8} fill="var(--art-trim)" />
    </g>
  );
}

function Palm({ x, base, height }: { x: number; base: number; height: number }) {
  const topY = base - height;
  const leaves = [-70, -35, 0, 35, 70, 110, -110];
  return (
    <g>
      <path d={`M${x} ${base} C${x - 6} ${base - height * 0.5} ${x + 8} ${topY + 30} ${x} ${topY}`} stroke="var(--art-trunk)" strokeWidth={9} fill="none" strokeLinecap="round" />
      {leaves.map((angle) => (
        <ellipse
          key={angle}
          cx={x}
          cy={topY - 2}
          rx={52}
          ry={10}
          fill="var(--art-leaf)"
          transform={`rotate(${angle} ${x} ${topY}) translate(38 0)`}
        />
      ))}
    </g>
  );
}

export function BuildingIllustration() {
  const ground = 430;
  return (
    <svg
      className="building-art"
      viewBox="0 -40 1000 540"
      preserveAspectRatio="xMidYMax slice"
      role="img"
      aria-label="Ilustração dos prédios do condomínio"
    >
      <defs>
        <linearGradient id="art-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--art-sky-top)" />
          <stop offset="1" stopColor="var(--art-sky-bottom)" />
        </linearGradient>
      </defs>
      <rect y="-40" width="1000" height="560" fill="url(#art-sky)" />

      <Building x={100} width={270} top={170} base={ground} columns={[0.08, 0.62]} />
      <Building x={500} width={390} top={120} base={ground} columns={[0.06, 0.5, 0.94]} />

      <Palm x={440} base={ground + 10} height={190} />
      <Palm x={950} base={ground + 10} height={150} />

      {/* Grade da frente */}
      <rect x="0" y={ground - 34} width="1000" height="4" fill="var(--art-fence)" />
      {Array.from({ length: 84 }, (_, i) => (
        <rect key={i} x={i * 12} y={ground - 34} width="4" height="38" fill="var(--art-fence)" />
      ))}

      {/* Muro baixo, cerca viva e calçada */}
      <rect x="0" y={ground} width="1000" height="26" fill="var(--art-wall-low)" />
      {[60, 250, 420, 640, 820, 960].map((cx) => (
        <ellipse key={cx} cx={cx} cy={ground - 16} rx={62} ry={44} fill="var(--art-hedge)" />
      ))}
      <rect x="0" y={ground + 26} width="1000" height={520 - ground - 26} fill="var(--art-ground)" />
    </svg>
  );
}
