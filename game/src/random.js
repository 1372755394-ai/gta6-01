export function random(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}
export const clamp = (x, min, max) => Math.max(min, Math.min(max, x));
export const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
export const point = (x, y) => ({x, y});
export const angleTo = (a, b) => Math.atan2(b.y - a.y, b.x - a.x);
export const angleDelta = (a, b) => Math.atan2(Math.sin(b-a), Math.cos(b-a));
