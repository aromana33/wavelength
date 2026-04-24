/** Углы 0…180: 0 — левый край дуги, 180 — правый, 90 — вверх. */

export type WedgeScore = 0 | 2 | 3 | 4;

/** Сектора от центра «четвёрки»: 2–3–4–3–2 симметрично, в градусах. */
export const WEDGES = {
  half4: 7,
  half3: 7,
  half2: 9,
} as const;

export function clusterHalfWidth(): number {
  return WEDGES.half2 + WEDGES.half3 + WEDGES.half4;
}

export function scoreNeedleVsTarget(
  needle: number,
  targetCenter: number,
): WedgeScore {
  const d = needle - targetCenter;
  const a = Math.abs(d);
  if (a <= WEDGES.half4) return 4;
  if (a <= WEDGES.half4 + WEDGES.half3) return 3;
  if (a <= WEDGES.half4 + WEDGES.half3 + WEDGES.half2) return 2;
  return 0;
}

export function sideGuessIsCorrect(
  guess: "left" | "right",
  targetCenter: number,
  lockedNeedle: number,
): boolean {
  if (targetCenter < lockedNeedle) return guess === "left";
  if (targetCenter > lockedNeedle) return guess === "right";
  return false;
}

/** Случайный угол так, чтобы весь кластер помещался на дуге 0…180 */
export function randomTargetAngle(): number {
  const margin = clusterHalfWidth() + 2;
  return margin + Math.random() * (180 - 2 * margin);
}
