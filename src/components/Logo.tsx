/** Marca do Reservas Saint-Marc: o telhado de duas águas do prédio sobre um calendário. */
export function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <rect width="40" height="40" rx="12" fill="var(--color-primary)" />
      <path d="M9 18.5 20 10l11 8.5" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="12.5" y="19.5" width="15" height="11.5" rx="2.5" fill="none" stroke="#fff" strokeWidth="2.2" />
      <path d="M12.5 24h15" stroke="#fff" strokeWidth="2.2" />
      <circle cx="23.5" cy="27.4" r="1.6" fill="#fff" />
    </svg>
  );
}
