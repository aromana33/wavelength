const DEG = Math.PI / 180;

/** α в градусах 0…180: левый край дуги → правый, центр окружности внизу. */
export function dialPoint(cx: number, cy: number, R: number, alphaDeg: number) {
  const a = alphaDeg * DEG;
  return {
    x: cx + R * Math.cos(Math.PI - a),
    y: cy - R * Math.sin(Math.PI - a),
  };
}

export function dialSectorPath(
  cx: number,
  cy: number,
  R: number,
  a0: number,
  a1: number,
): string {
  const p0 = dialPoint(cx, cy, R, a0);
  const p1 = dialPoint(cx, cy, R, a1);
  const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
  return [
    `M ${cx} ${cy}`,
    `L ${p0.x} ${p0.y}`,
    `A ${R} ${R} 0 ${large} 0 ${p1.x} ${p1.y}`,
    "Z",
  ].join(" ");
}

/** Угол 0…180 от позиции указателя относительно центра дуги */
export function angleFromClient(
  cx: number,
  cy: number,
  clientX: number,
  clientY: number,
  svg: SVGSVGElement,
): number {
  const pt = svg.createSVGPoint();
  pt.x = clientX;
  pt.y = clientY;
  const ctm = svg.getScreenCTM();
  if (!ctm) return 90;
  const p = pt.matrixTransform(ctm.inverse());
  const dx = p.x - cx;
  const dy = cy - p.y;
  let rad = Math.atan2(dy, dx);
  if (rad < 0) rad += 2 * Math.PI;
  const alpha = Math.PI - rad;
  const deg = (alpha * 180) / Math.PI;
  return Math.min(180, Math.max(0, deg));
}
