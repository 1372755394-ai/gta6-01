import { random, point } from './random.js';

export const SIZE = 4800;
export const GRID = 400;
export const ROADS = Array.from({length: 11}, (_, i) => 200 + i * GRID);
export const garage = point(1310, 1817);
export const safehouse = point(2200, 1442);
export const docks = point(4200, 3660);
export const tower = point(2800, 2620);
export const taxiStand = point(1480, 2182);
export const spawn = point(1150, 1841);
export const districts = ['Coral Heights','Civic Terrace','Miraflor Strand','Cinder Market','Doyle Financial','Saltglass Docks'];
export const district = ({x,y}) => districts[Math.min(2, Math.floor(x/1600)) + (y >= 2400 ? 3 : 0)];

export function buildCity() {
  const rng = random(811923);
  const lots = [];
  const buildings = [];
  const trees = [];
  const containers = [];
  for (let row = 0; row < 10; row++) {
    for (let col = 0; col < 10; col++) {
      const x = ROADS[col] + 66, y = ROADS[row] + 66, w = 268;
      const park = col === 4 && row === 4;
      const port = col === 9 && row >= 7;
      lots.push({x,y,w,park,port,shade: rng()});
      for (let i = 0; i < (park ? 24 : 9); i++) {
        const side = i % 4;
        trees.push({
          x: x + (park ? 20+rng()*228 : side === 0 ? 12 : side === 1 ? 256 : 26+rng()*216),
          y: y + (park ? 20+rng()*228 : side === 2 ? 12 : side === 3 ? 256 : 26+rng()*216),
          size: 9+rng()*8, palm: !park && rng() < .7, tone:rng()
        });
      }
      if (park) continue;
      if (port) {
        for (let i=0;i<12;i++) {
          containers.push({x:x+31+i%3*81,y:y+25+Math.floor(i/3)*58,w:59,h:24,tone:Math.floor(rng()*6)});
        }
        continue;
      }
      for (let i=0;i<4;i++) {
        if (col===2 && row===4 && i===1) continue;
        if (col===5 && row===3 && i===0) continue;
        if (col===6 && row===6) continue;
        const bx=x+29+i%2*115+rng()*10, by=y+30+Math.floor(i/2)*115+rng()*9;
        buildings.push({x:bx,y:by,w:77+rng()*23,h:73+rng()*26,
          rise:12+rng()*(col>=5 && row>=4 ? 44 : 23),tone:Math.floor(rng()*7),kind:'block'});
      }
    }
  }
  buildings.push(
    {x:1262,y:1867,w:100,h:68,rise:20,tone:3,kind:'garage'},
    {x:2266,y:1440,w:87,h:79,rise:18,tone:1,kind:'safe'},
    {x:2748,y:2687,w:119,h:123,rise:105,tone:5,kind:'tower'}
  );
  return {lots,buildings,trees,containers};
}

export function blocked(city, x, y, r=0) {
  if (x-r<18 || y-r<18 || x+r>4540 || y+r>SIZE-18) return true;
  return city.buildings.some(b => x+r>b.x && x-r<b.x+b.w && y+r>b.y && y-r<b.y+b.h)
    || city.containers.some(b => x+r>b.x && x-r<b.x+b.w && y+r>b.y && y-r<b.y+b.h);
}

export function walk(city, unit, dx, dy, radius=7) {
  if (!blocked(city, unit.x+dx, unit.y, radius)) unit.x += dx;
  if (!blocked(city, unit.x, unit.y+dy, radius)) unit.y += dy;
}

export function clearSight(city, a, b) {
  const steps = Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/18);
  for (let i=1;i<steps;i++) {
    if (blocked(city,a.x+(b.x-a.x)*i/steps,a.y+(b.y-a.y)*i/steps)) return false;
  }
  return true;
}
