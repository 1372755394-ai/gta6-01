import { ROADS, blocked, walk } from './city.js';
import { clamp, distance, angleTo, angleDelta } from './random.js';

export const models = [
  ['Vela R6',365,340,2.9,'#f07453',53,25],
  ['Paloma S2',323,292,3.4,'#4bc2ae',48,23],
  ['Brine GT',395,305,2.45,'#e7bd49',55,26],
  ['Rook Courier',270,212,2.2,'#88aabd',57,27],
  ['Marimba LX',296,235,2.7,'#db8797',55,25],
  ['Arroyo 4X',284,255,2.4,'#c6cbb4',53,29],
  ['Firecrest 9',408,355,2.7,'#e8e1d8',51,25],
  ['Sunline Cab',309,265,3.05,'#f3bc43',55,25]
];

export function car(x,y,a,model=0,role='parked') {
  return {x,y,a,model,role,speed:0,hp:100,trail:0};
}

export function populateCars(rng) {
  const cars = [car(1180,1838,0),car(1455,2182,0,7)];
  cars[0].contract = true;
  for (let row=0;row<10;row++) for (let col=0;col<10;col++) {
    if (rng()<.7) cars.push(car(ROADS[col]+117+rng()*158,ROADS[row]+46,0,Math.floor(rng()*8)));
    if (rng()<.7) cars.push(car(ROADS[col]+25,ROADS[row]+100+rng()*180,Math.PI/2,Math.floor(rng()*8),'traffic'));
    if (rng()<.66) cars.push(car(ROADS[col]+85+rng()*210,ROADS[row]+25,0,Math.floor(rng()*8),'traffic'));
    if (rng()<.4) cars.push(car(ROADS[col]+103+rng()*172,ROADS[row]-25,Math.PI,Math.floor(rng()*8),'traffic'));
  }
  return cars;
}

export function requestVehicle(s) {
  const p=s.player;
  if (p.car) {
    const v=p.car;
    const exits=[1,-1].map(side => ({x:v.x-Math.sin(v.a)*37*side,y:v.y+Math.cos(v.a)*37*side}));
    const exit=exits.find(q=>!blocked(s.city,q.x,q.y,8));
    if (!exit) return;
    Object.assign(p,exit,{car:null});
    v.role='parked';
    v.speed=0;
    return;
  }
  const candidates=s.cars.filter(v=>v.hp>0 && distance(v,p)<53).sort((a,b)=>distance(a,p)-distance(b,p));
  const v=candidates[0];
  if (!v) return;
  if (v.role==='traffic' || v.role==='police') {
    s.people.push({x:p.x,y:p.y,a:v.a+Math.PI,role:'civilian',hp:40,fear:9,tone:2});
    s.crime(v.role==='police'?1.5:.55);
  } else if (!v.used && !v.contract && v.model!==7) {
    s.crime(.22);
  }
  v.used=true;
  v.role='player';
  p.car=v;
  Object.assign(p,{x:v.x,y:v.y,a:v.a});
}

function moveCar(s,v,dt) {
  const x=v.x+Math.cos(v.a)*v.speed*dt, y=v.y+Math.sin(v.a)*v.speed*dt;
  if (blocked(s.city,x,y,15)) {
    if (Math.abs(v.speed)>85 && v.role==='player') {
      v.hp-=Math.abs(v.speed)*.085;
      s.effect(v.x,v.y,'spark',9);
      s.sound('hit');
      s.shake=6;
    }
    v.speed *= -.26;
    return;
  }
  v.x=x;
  v.y=y;
}

export function drive(s,dt) {
  const p=s.player, v=p.car, keys=s.input.keys;
  if (!v) return;
  const [,max,accel,grip]=models[v.model];
  const gas=Number(keys.has('KeyW'))-Number(keys.has('KeyS'));
  const steer=Number(keys.has('KeyD'))-Number(keys.has('KeyA'));
  const brake=keys.has('Space');
  v.speed=clamp(v.speed+gas*accel*dt,-max*.38,max);
  v.speed*=Math.exp(-(brake?3.3:gas?.22:1.5)*dt);
  v.a+=steer*grip*Math.min(1,Math.abs(v.speed)/95)*Math.sign(v.speed)*(brake?1.55:1)*dt;
  moveCar(s,v,dt);
  for (const other of s.cars) {
    if (other===v || other.hp<=0 || distance(v,other)>29) continue;
    if (Math.abs(v.speed-other.speed)>45 && s.time>(v.impact??0)) {
      const impact=Math.abs(v.speed-other.speed)*.055+3;
      v.hp-=impact;
      other.hp-=impact*1.3;
      v.speed*=.63;
      v.impact=s.time+.28;
      s.effect((v.x+other.x)/2,(v.y+other.y)/2,'spark',12);
      s.sound('hit');
    }
    walk(s.city,other,Math.cos(v.a)*Math.sign(v.speed)*90*dt,Math.sin(v.a)*Math.sign(v.speed)*90*dt,15);
  }
  if ((brake || v.hp<39 || s.time-v.impact<.22) && Math.abs(v.speed)>38 && s.time>v.trail) {
    s.effect(v.x-Math.cos(v.a)*22,v.y-Math.sin(v.a)*22,'smoke',2);
    v.trail=s.time+.045;
  }
  Object.assign(p,{x:v.x,y:v.y,a:v.a});
}

export function updateTraffic(s,dt,clock=s.time) {
  for (const v of s.cars) {
    if (v.role!=='traffic' || v.hp<=0) continue;
    if (v.y>4238) {v.y=175;continue;}
    if (v.x>4238) {v.x=175;continue;}
    if (v.x<165) {v.x=4218;continue;}
    const axis=Math.abs(Math.cos(v.a))>.5 ? v.x : v.y;
    const crossing=((axis-200)%400+400)%400;
    const backwards=Math.cos(v.a)<-.5;
    const red=Math.floor(clock/5+Math.round((axis-200)/400))%2===Number(Math.abs(Math.sin(v.a))>.5);
    const aheadX=v.x+Math.cos(v.a)*38, aheadY=v.y+Math.sin(v.a)*38;
    const near=distance(v,s.player)<240 && s.cars.some(other=>other!==v && Math.hypot(other.x-aheadX,other.y-aheadY)<24);
    const stop=near || (red && (backwards ? crossing>70 && crossing<96 : crossing>305 && crossing<330));
    v.speed+=( (stop?0:95+v.model*5)-v.speed)*Math.min(1,dt*2);
    moveCar(s,v,dt);
  }
}

export function chaseCar(s,v,target,dt) {
  const desired=angleTo(v,target);
  const turn=angleDelta(v.a,desired);
  v.a+=clamp(turn,-2.95*dt,2.95*dt);
  const max=210+s.stars*27;
  v.speed+=(max*(1-.68*Math.min(1,Math.abs(turn)))-v.speed)*Math.min(1,dt*2.1);
  moveCar(s,v,dt);
}
