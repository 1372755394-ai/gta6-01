import { garage,safehouse,taxiStand,district } from './city.js';
import { objective } from './missions.js';
import { clamp } from './random.js';
import { fill,circle,sign,paintStreets,paintLot,paintTree,paintBuilding,paintContainer } from './city-art.js';
import { paintCar,paintPerson } from './entities-art.js';
import { paintHUD } from './hud.js';

const places=[
  {x:2390,y:2222,name:'CENTRAL PARK'}, {x:2800,y:2649,name:'DOYLE PLAZA'},
  {x:4378,y:3517,name:'SALTGLASS TERMINAL'}, {x:4450,y:2075,name:'MIRAFLOR BEACH'}
];
function marker(c,q,color,time,label) {
  const ring=22+6*Math.sin(time*4);
  c.fillStyle=color+'27';
  c.beginPath();
  c.arc(q.x,q.y,ring,0,7);
  c.fill();
  c.strokeStyle=color;
  c.lineWidth=1.6;
  c.stroke();
  c.save();
  c.translate(q.x,q.y-23+Math.sin(time*3)*4);
  c.rotate(Math.PI/4);
  fill(c,'#28383e',-7,-7,14,14);
  fill(c,color,-5,-5,10,10);
  c.restore();
  if (label) {
    fill(c,'#1e3036db',q.x-41,q.y+32,82,17);
    sign(c,label,q.x,q.y+44,'#f8edd5',9);
  }
}

export function render(c,s) {
  const p=s.player;
  const title=s.screen==='title' || s.screen==='help';
  const zoom=title?.83:s.zoom??(p.car?1.03:1.22);
  const x=title?4035:p.x, y=title?3535:p.y;
  const camera=s.camera;
  camera.x+=(x-camera.x)*.15;
  camera.y+=(y-camera.y)*.15;
  camera.z=zoom;
  const shake=s.shake;
  const tx=640+Math.sin(s.visualTime*94)*shake, ty=360+Math.cos(s.visualTime*79)*shake;
  camera.tx=tx;
  camera.ty=ty;
  const visible=(x,y,pad=90)=>Math.abs(x-camera.x)<640/zoom+pad && Math.abs(y-camera.y)<360/zoom+pad;
  fill(c,'#6a9f95',0,0,1280,720);
  c.save();
  c.translate(tx,ty);
  c.scale(zoom,zoom);
  c.translate(-camera.x,-camera.y);
  paintStreets(c,s,visible);
  for (const lot of s.city.lots) if (visible(lot.x,lot.y,285)) paintLot(c,lot);
  for (const place of places) if (visible(place.x,place.y)) sign(c,place.name,place.x,place.y,'#eee5c6aa',13);
  for (const b of s.city.buildings) if (visible(b.x,b.y,150)) paintBuilding(c,b);
  for (const b of s.city.containers) if (visible(b.x,b.y)) paintContainer(c,b);
  for (const t of s.city.trees) if (visible(t.x,t.y,40)) paintTree(c,t);
  for (const v of s.cars) if (v.role!=='departed' && visible(v.x,v.y,60)) paintCar(c,v,s.visualTime);
  for (const n of s.people) if (visible(n.x,n.y,22)) paintPerson(c,n,s.visualTime);
  if (!title && !p.car) paintPerson(c,p,s.visualTime,true);
  for (const item of s.pickups) if (visible(item.x,item.y,18)) {
    const color={cash:'#99f6b4',armor:'#89d9f0',health:'#ffa589',ammo:'#f6d77b'}[item.type];
    circle(c,'#253e47',item.x,item.y,9);
    sign(c,{cash:'$',health:'+',armor:'◆',ammo:'↑'}[item.type],item.x,item.y+4,color,12);
  }
  if (!title) {
    const [,target]=objective(s);
    if (visible(garage.x,garage.y) && target!==garage) marker(c,garage,'#93e4c1',s.visualTime,'GARAGE');
    if (visible(safehouse.x,safehouse.y) && target!==safehouse) marker(c,safehouse,'#93e4c1',s.visualTime,'SAFEHOUSE');
    const taxi=s.fare?.target??taxiStand;
    if (visible(taxi.x,taxi.y)) marker(c,taxi,'#8af4ef',s.visualTime,'TAXI');
    if (target && visible(target.x,target.y)) marker(c,target,'#ffd586',s.visualTime);
  }
  for (const b of s.bullets) if (visible(b.x,b.y)) {
    c.strokeStyle=b.friendly?'#fff5b9':'#ff9774';
    c.lineWidth=2;
    c.beginPath();
    c.moveTo(b.x,b.y);
    c.lineTo(b.x-Math.cos(b.a)*18,b.y-Math.sin(b.a)*18);
    c.stroke();
  }
  for (const f of s.effects) if (visible(f.x,f.y)) {
    c.globalAlpha=clamp(f.ttl/f.life,0,1)*.78;
    circle(c,f.color,f.x,f.y,f.size*(1.2-f.ttl/f.life*.5));
  }
  c.globalAlpha=1;
  c.restore();

  const light=c.createLinearGradient(0,0,1280,720);
  light.addColorStop(0,'#ffcc7d25');
  light.addColorStop(.55,'#f5ba6312');
  light.addColorStop(1,'#10384932');
  fill(c,light,0,0,1280,720);
  const edge=c.createRadialGradient(640,360,270,640,360,740);
  edge.addColorStop(0,'#162c3300');
  edge.addColorStop(1,'#12272d61');
  fill(c,edge,0,0,1280,720);
  if (s.time<s.hurtUntil) fill(c,'#f0392724',0,0,1280,720);
  if (!title) paintHUD(c,s,district(p));
}
