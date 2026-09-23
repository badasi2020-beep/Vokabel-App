// Kleine Version des Hausblick-Logos (grünes Haus im pinken Schwung-Ring) fürs UI.
export function BrandMark({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" aria-hidden="true">
      <ellipse cx="256" cy="256" rx="176" ry="150" stroke="#DC4FDB" strokeWidth="34" strokeLinecap="round" transform="rotate(-6 256 256)" />
      <path d="M256 138 L358 224 L332 254 L256 190 L180 254 L154 224 Z" fill="#80B737" />
      <rect x="196" y="220" width="42" height="118" fill="#80B737" />
      <rect x="274" y="220" width="42" height="70" fill="#80B737" />
    </svg>
  );
}
