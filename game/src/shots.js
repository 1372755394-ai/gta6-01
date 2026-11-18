import { car } from './vehicles.js';
import { prepareJob, spawnCrew } from './missions.js';
import { docks } from './city.js';
import { angleTo } from './random.js';

const presets={
  title(s) {
    s.screen='title';
    Object.assign(s.camera,{x:4035,y:3535});
  },
  chase(s) {
    stageDriver(s,2170,1824,0,1,291);
    s.chapter=3;
    s.cash=3250;
    s.debt=36000;
    prepareJob(s);
    s.notice=null;
    s.job.phase=1;
    s.job.remaining=31;
    s.job.deadline=31;
    s.crime(2.7);
    for (const [x,y,a] of [[2101,1780,.39],[2053,1834,-.14],[2191,1650,1.75],[1975,1818,.03]]) {
      const unit=car(x,y,a,4,'police');
      unit.speed=240;
      s.cars.push(unit);
    }
    s.effect(2133,1825,'smoke',16);
    s.effect(2091,1805,'spark',9);
    s.effect(2145,1838,'dust',12);
  },
  drive(s) {
    stageDriver(s,2700,2582,0,0,202);
    s.chapter=1;
    s.cash=500;
    s.debt=47500;
    prepareJob(s);
    s.notice=null;
    s.cars.push(car(2810,2625,Math.PI,7,'traffic'),car(2590,2685,Math.PI/2,3,'traffic'));
  },
  mission(s) {
    s.chapter=2;
    s.cash=1450;
    s.debt=43000;
    prepareJob(s);
    s.job.phase=1;
    Object.assign(s.player,{x:4116,y:3640,a:.25,armor:62,ammo:29});
    s.zoom=1.25;
    spawnCrew(s);
    for (const [i,n] of s.people.filter(n=>n.job).entries()) {
      const a=angleTo(n,s.player);
      n.a=a;
      if (i<3) s.bullets.push({x:n.x+Math.cos(a)*24,y:n.y+Math.sin(a)*24,a,owner:n,friendly:false,ttl:.7});
    }
    s.fire(s.player,.25,true);
    s.bullets[0].x=docks.x-55;
    s.cars.push(car(4080,3705,-.15,5,'wreck'),car(4242,3743,1.5,3));
    const wreck=s.cars.at(-2);
    wreck.hp=0;
    wreck.wreck=true;
    s.effect(wreck.x,wreck.y,'smoke',26);
    s.effect(wreck.x+5,wreck.y,'blast',14);
    s.pickups.push({x:4140,y:3674,type:'ammo'});
  }
};

function stageDriver(s,x,y,a,model,speed) {
  const v=car(x,y,a,model,'player');
  v.speed=speed;
  s.cars.push(v);
  Object.assign(s.player,{x,y,a,car:v});
  s.zoom=1.09;
}

export function stage(s,key) {
  if (!Object.hasOwn(presets,key)) return false;
  s.screen='play';
  s.visualTime=14.52;
  presets[key](s);
  if (key!=='title') Object.assign(s.camera,{x:s.player.x,y:s.player.y});
  return true;
}
