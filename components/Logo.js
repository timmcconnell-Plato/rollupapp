'use client';

// RollUp — lowercase wordmark beside a solid green bowl mark (white emblem disc).
// `markOnly` renders just the bowl, for favicons / small spots.
export default function Logo({ height = 28, markOnly = false }) {
  const pjs = { fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif", fontWeight: 800 };
  if (markOnly) {
    return (
      <svg viewBox="0 0 84 84" height={height} width={height} role="img" aria-label="RollUp" style={{ display: 'block' }}>
        <circle cx="42" cy="42" r="42" fill="var(--green)" />
        <circle cx="57" cy="42" r="15" fill="#fff" />
      </svg>
    );
  }
  const w = (height * 252) / 84;
  return (
    <svg viewBox="0 0 252 84" height={height} width={w} role="img" aria-label="rollup" style={{ display: 'block' }}>
      <circle cx="42" cy="42" r="42" fill="var(--green)" />
      <circle cx="57" cy="42" r="15" fill="#fff" />
      <text x="100" y="45" textAnchor="start" dominantBaseline="middle" fill="var(--green)" fontSize="50" letterSpacing="-2" style={pjs}>rollup</text>
    </svg>
  );
}
