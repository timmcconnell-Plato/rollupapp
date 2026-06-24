// Green-space coordinate system — the one place pixels become metres.
// Jack = origin (0,0), metres. +x right of the line of play, -x left;
// +y beyond the jack (long), -y short of the jack (toward the mat).
// Ranges are ILLUSTRATIVE and flagged for Domain Lead confirmation.

export const RINK = {
  vbW: 300, vbH: 440,
  playX0: 30, playX1: 270,
  playY0: 20, playY1: 420,
  jackFrac: 0.30,
  HALF_WIDTH_M: 2.5,
  LONG_M: 1.5,
  SHORT_M: 5.0,
};

export function jackPx() {
  return {
    x: (RINK.playX0 + RINK.playX1) / 2,
    y: RINK.playY0 + (RINK.playY1 - RINK.playY0) * RINK.jackFrac,
  };
}

export function pxToMetres(px, py) {
  const j = jackPx();
  const x = ((px - j.x) / (RINK.playX1 - RINK.playX0)) * (RINK.HALF_WIDTH_M * 2);
  const y = py < j.y
    ? ((j.y - py) / (j.y - RINK.playY0)) * RINK.LONG_M
    : -((py - j.y) / (RINK.playY1 - j.y)) * RINK.SHORT_M;
  return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 };
}

export function metresToPx(x, y) {
  const j = jackPx();
  const px = j.x + (x / (RINK.HALF_WIDTH_M * 2)) * (RINK.playX1 - RINK.playX0);
  const py = y >= 0
    ? j.y - (y / RINK.LONG_M) * (j.y - RINK.playY0)
    : j.y + (-y / RINK.SHORT_M) * (RINK.playY1 - j.y);
  return { x: px, y: py };
}

export function decode(s) {
  const ax = Math.abs(s.x), ay = Math.abs(s.y);
  const lp = ay <= 0.25 ? 'on length' : (s.y < 0 ? (ay > 1.6 ? 'well short' : 'short') : (ay > 0.5 ? 'well long' : 'long'));
  const np = ax <= 0.18 ? 'on line' : (ax > 0.6 ? 'well ' : 'slightly ') + (s.x > 0 ? 'right' : 'left');
  const hand = s.hand === 'forehand' ? 'Forehand' : 'Backhand';
  return `${hand} — ${lp}, ${np}.`;
}
