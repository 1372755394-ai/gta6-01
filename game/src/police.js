import { ROADS, safehouse, clearSight } from './city.js';
import { distance, angleTo, clamp } from './random.js';
import { car, chaseCar } from './vehicles.js';

export function raiseHeat(s,amount) {
  s.heat=clamp(s.heat+amount,0,5);
  s.stars=Math.ceil(s.heat);
  s.lastSeen=s.time;
}

const nearestRoad = n => ROADS.reduce((best,road)=>Math.abs(road-n)<Math.abs(best-n)?road:best);

export function dispatch(s,count,spread=0) {
  while (s.cars.filter(v=>v.role==='police' && v.hp>0).length<count) {
    const p=s.player, i=s.dispatches++;
    const side=i%4;
    const x=side<2 ? nearestRoad(p.x+(side===0?-385:385)) : nearestRoad(p.x);
    const y=side>=2 ? nearestRoad(p.y+(side===2?-385:385)) : nearestRoad(p.y);
    const v=car(x+(side<2?spread:0),y+(side>=2?spread:0),angleTo({x,y},p),4,'police');
    s.cars.push(v);
  }
}

export function updatePolice(s,dt) {
  const p=s.player;
  if (!s.stars) {
    s.cars=s.cars.filter(v=>v.role!=='police');
    s.people=s.people.filter(n=>n.role!=='officer');
    return;
  }
  const units=s.cars.filter(v=>v.role==='police' && v.hp>0);
  const safe=distance(p,safehouse)<103;
  if (!safe && units.some(v=>distance(v,p)<260 && clearSight(s.city,v,p))) s.lastSeen=s.time;
  if (s.time-s.lastSeen>(safe?1.2:8)) s.heat=Math.max(0,s.heat-dt*(safe?.9:.1));
  s.stars=Math.ceil(s.heat);
  if (!s.stars) return;
  if (!safe && s.time>s.nextDispatch) {
    dispatch(s,s.stars+1);
    s.nextDispatch=s.time+4.8;
  }
  for (const v of units) {
    const d=distance(v,p);
    if (d>950 && !safe) {v.role='departed';continue;}
    const officer=s.people.find(n=>n.patrol===v && n.hp>0);
    if (safe || (!p.car && officer)) {v.speed=0;continue;}
    if (!p.car && d<92 && clearSight(s.city,v,p)) {
      s.people.push({x:v.x,y:v.y,a:v.a,role:'officer',hp:70,tone:0,patrol:v});
      v.speed=0;
      continue;
    }
    const target=clearSight(s.city,v,p) ? p : route(v,p,s.city);
    chaseCar(s,v,target,dt);
    if (p.car && d<37 && s.time>(v.ramAt??0)) {
      p.car.hp-=5+s.stars*2;
      p.car.speed*=.8;
      v.speed*=.46;
      v.ramAt=s.time+.8;
      s.effect(p.x,p.y,'spark',12);
      s.sound('hit');
      s.shake=9;
    }
  }
}

function route(v,p,city) {
  const x=nearestRoad(v.x), y=nearestRoad(v.y);
  const tx=nearestRoad(p.x), ty=nearestRoad(p.y);
  if (Math.abs(v.x-x)>42 && Math.abs(v.y-y)>42) return {x,y};
  const candidates=[{x:tx,y},{x,y:ty}]
    .filter(q=>distance(v,q)>48 && clearSight(city,v,q));
  return candidates.sort((a,b)=>distance(a,p)-distance(b,p))[0] ?? {x,y};
}
