export type Point = { x: number; y: number };

/**
 * Converte valores em pontos num retângulo. x distribuído igualmente, ou proporcional a `xs` quando
 * informado (ex.: dias desde o primeiro treino); um único ponto fica no centro.
 * y invertido (maior valor no topo). Se todos forem iguais, a linha fica no meio.
 */
export const buildPoints = (values: number[], width: number, height: number, pad = { left: 0, right: 0, top: 0, bottom: 0 }, xs?: number[]): Point[] => {
  if (values.length === 0) return [];
  const innerW = Math.max(0, width - pad.left - pad.right);
  const innerH = Math.max(0, height - pad.top - pad.bottom);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;
  const xMin = xs ? Math.min(...xs) : 0;
  const xRange = xs ? Math.max(...xs) - xMin : values.length - 1;
  const xOf = (index: number) => (xs ? xs[index] - xMin : index);
  return values.map((value, index) => ({
    x: pad.left + (values.length === 1 || xRange === 0 ? innerW / 2 : (innerW * xOf(index)) / xRange),
    y: pad.top + (range === 0 ? innerH / 2 : innerH * (1 - (value - min) / range)),
  }));
};

/** Comprimento total de uma polilinha. */
export const polylineLength = (points: Point[]) => {
  let total = 0;
  for (let i = 1; i < points.length; i += 1) total += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
  return total;
};

export const linePath = (points: Point[]) => points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');

/** Caminho fechado da área sob a linha até `baseline`. */
export const areaPath = (points: Point[], baseline: number) => {
  if (points.length === 0) return '';
  const first = points[0];
  const last = points[points.length - 1];
  return `${linePath(points)} L${last.x.toFixed(2)} ${baseline} L${first.x.toFixed(2)} ${baseline} Z`;
};
