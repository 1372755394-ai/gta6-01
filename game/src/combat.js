import { blocked } from './city.js';
import { distance } from './random.js';

const life = {spark:.35,smoke:1.35,blast:.78,dust:.65,flash:.13};
const colors={spark:'#fff19c',smoke:'#f4ddc2',blast:'#ffac4d',dust:'#e5a67a',flash:'#fff3b9'};

export function effect(s,x,y,kind,count=1) {
  for (let i=0;i<count;i++) {
    const a=s.rng()*Math.PI*2, speed=s.rng()*(kind==='blast'?150:83);
    s.effects.push({x,y,dx:Math.cos(a)*speed,dy:Math.sin(a)*speed,
      ttl:life[kind]*(.45+s.rng()*.55),life:life[kind],size:2+s.rng()*9,kind,color:colors[kind]});
  }
}

export function fire(s,owner,a,friendly) {
  const x=owner.x+Math.cos(a)*14, y=owner.y+Math.sin(a)*14;
  s.bullets.push({x,y,a,owner,friendly,ttl:friendly?.55:.72});
  effect(s,x,y,'flash',3);
  if (friendly || distance(owner,s.player)<410) {
    s.sound(friendly?'shot':'enemy');
    s.lastShot=s.time;
  }
}

function hurtPlayer(s,amount) {
  const armor=Math.min(s.player.armor,amount);
  s.player.armor-=armor;
  s.player.hp-=amount-armor;
  s.shake=5;
  s.hurtUntil=s.time+.26;
}

function drop(s,n) {
  if (n.role==='civilian') return;
  const types=['cash','ammo','health','armor'];
  s.pickups.push({x:n.x,y:n.y,type:types[Math.floor(s.rng()*4)]});
}

export function updateCombat(s,dt) {
  const p=s.player;
  if (!p.car) {
    if (s.input.pressed.has('KeyF') && s.time>p.attackAt) {
      p.attackAt=s.time+.36;
      p.punchUntil=s.time+.19;
      const target=s.people.find(n=>n.hp>0 && distance(n,p)<31);
      if (target) {
        target.hp-=38;
        if (target.hp<=0) drop(s,target);
        if (target.role==='officer' || target.role==='civilian') s.crime(.8);
        effect(s,target.x,target.y,'spark',5);
      }
      s.sound('hit');
    }
    if (s.input.mouse.down && p.ammo && s.time>p.attackAt) {
      p.attackAt=s.time+.18;
      p.ammo--;
      p.a=s.aim;
      fire(s,p,p.a,true);
    }
  }
  for (const b of s.bullets) {
    const dx=Math.cos(b.a)*dt*680, dy=Math.sin(b.a)*dt*680;
    b.ttl-=dt;
    for (let step=0;step<3 && b.ttl>0;step++) {
      b.x+=dx/3;
      b.y+=dy/3;
      if (blocked(s.city,b.x,b.y)) {
        effect(s,b.x,b.y,'spark',3);
        b.ttl=0;
        break;
      }
      if (b.friendly) {
        const n=s.people.find(n=>n.hp>0 && distance(n,b)<11);
        if (n) {
          n.hp-=32;
          if (n.hp<=0) drop(s,n);
          if (n.role==='officer' || n.role==='civilian') s.crime(.65);
          effect(s,b.x,b.y,'spark',6);
          b.ttl=0;
          break;
        }
      } else if (!p.car && distance(p,b)<10) {
        hurtPlayer(s,b.owner.role==='boss'?15:10);
        b.ttl=0;
        break;
      }
      const vehicle=s.cars.find(v=>v.hp>0 && distance(v,b)<17);
      if (vehicle) {
        vehicle.hp-=b.friendly?15:8;
        effect(s,b.x,b.y,'spark',5);
        b.ttl=0;
      }
    }
  }
  s.bullets=s.bullets.filter(b=>b.ttl>0);
  for (const v of s.cars) {
    if (v.hp>0 || v.wreck) continue;
    v.wreck=true;
    v.speed=0;
    v.role='wreck';
    effect(s,v.x,v.y,'blast',30);
    effect(s,v.x,v.y,'smoke',22);
    if (distance(v,p)<300) s.sound('blast');
    if (p.car===v) {
      p.car=null;
      hurtPlayer(s,48);
      s.shake=13;
    } else if (distance(v,p)<56) hurtPlayer(s,21);
  }
  for (const f of s.effects) {
    f.x+=f.dx*dt;
    f.y+=f.dy*dt;
    f.ttl-=dt;
  }
  s.effects=s.effects.filter(f=>f.ttl>0);
  s.pickups=s.pickups.filter(item=>{
    if (distance(item,p)>23) return true;
    if (item.type==='cash') s.cash+=150;
    if (item.type==='health') p.hp=Math.min(100,p.hp+35);
    if (item.type==='armor') p.armor=Math.min(100,p.armor+35);
    if (item.type==='ammo') p.ammo+=24;
    s.sound('reward');
    return false;
  });
}
