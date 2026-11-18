import { ROADS, walk, clearSight } from './city.js';
import { distance, angleTo } from './random.js';

export function populatePeople(rng) {
  const people=[];
  for (const y of ROADS) for (const x of ROADS) {
    for (let side=0;side<2;side++) {
      const offset=82+rng()*225;
      people.push({x:x+offset,y:y+(side?71:-71),a:side?0:Math.PI,role:'civilian',hp:35,tone:Math.floor(rng()*6),fear:0});
    }
  }
  return people;
}

function movePerson(s,n,a,speed,dt) {
  n.a=a;
  walk(s.city,n,Math.cos(a)*speed*dt,Math.sin(a)*speed*dt);
}

export function updatePeople(s,dt) {
  const p=s.player;
  for (const n of s.people) {
    if (n.hp<=0) continue;
    const d=distance(n,p);
    if (n.role==='civilian') {
      n.fear=Math.max(0,n.fear-dt);
      if ((s.time-s.lastShot<.55 && d<290) || (Math.abs(p.car?.speed??0)>125 && d<125)) n.fear=2.9;
      if (p.car && d<22 && Math.abs(p.car.speed)>75) {
        n.hp=0;
        p.car.speed*=.89;
        s.crime(1.45);
        s.effect(n.x,n.y,'dust',9);
        continue;
      }
      const a=n.fear>0 && d<420 ? angleTo(p,n) : n.a;
      const oldX=n.x, oldY=n.y;
      movePerson(s,n,a,n.fear>0?113:29+n.tone*3,dt);
      if (oldX===n.x && oldY===n.y) n.a+=Math.PI;
      continue;
    }
    if (d>570) continue;
    const a=angleTo(n,p);
    if (n.role==='officer') {
      movePerson(s,n,a,124,dt);
      if (!p.car && d<22) s.bust+=dt;
      continue;
    }
    if (d>165 || !clearSight(s.city,n,p)) movePerson(s,n,a,n.role==='boss'?105:78,dt);
    else n.a=a;
    if (d<350 && s.time>(n.fireAt??0) && clearSight(s.city,n,p)) {
      n.fireAt=s.time+(n.role==='boss'?.38:1.05)+s.rng()*.7;
      s.fire(n,a+(s.rng()-.5)*.16,false);
    }
  }
}

export function updateOnFoot(s,dt) {
  const p=s.player;
  if (p.car) return;
  const k=s.input.keys;
  const dx=Number(k.has('KeyD'))-Number(k.has('KeyA'));
  const dy=Number(k.has('KeyS'))-Number(k.has('KeyW'));
  const speed=k.has('ShiftLeft')?230:154;
  if (dx || dy) {
    const length=Math.hypot(dx,dy);
    walk(s.city,p,dx/length*speed*dt,dy/length*speed*dt);
    p.a=Math.atan2(dy,dx);
  }
}
