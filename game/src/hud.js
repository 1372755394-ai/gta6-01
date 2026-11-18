import { ROADS,garage,safehouse,taxiStand } from './city.js';
import { jobs,objective } from './missions.js';
import { models } from './vehicles.js';
import { fill,circle,polygon } from './city-art.js';
import { clamp, distance } from './random.js';

const paper='#fff1d5', sand='#ffd58e', mint='#9bdfc5', slate='#12262eea';
const money=n=>'$'+n.toLocaleString('en-US');

function text(c,label,x,y,size=14,color=paper,weight=600,align='left') {
  c.font=`${weight} ${size}px system-ui`;
  c.fillStyle=color;
  c.textAlign=align;
  c.fillText(label,x,y);
  c.textAlign='left';
}
function panel(c,x,y,w,h,accent='#759f91') {
  fill(c,slate,x,y,w,h);
  fill(c,accent,x,y,w,2);
}
function bar(c,x,y,w,value,color) {
  fill(c,'#435751',x,y,w,5);
  fill(c,color,x,y,w*clamp(value/100,0,1),5);
}
function compass(c,s,target,x,y) {
  if (!target) return;
  const a=Math.atan2(target.y-s.player.y,target.x-s.player.x);
  c.save();
  c.translate(x,y);
  c.rotate(a);
  polygon(c,sand,[[8,0],[-6,-5],[-3,0],[-6,5]]);
  c.restore();
}

function minimap(c,s,target) {
  const x=24,y=478,w=224,h=203,p=s.player;
  panel(c,x,y,w,h,mint);
  text(c,'SOLMAR BAY',x+12,y+20,11,mint,850);
  text(c,'N ↑',x+w-12,y+20,11,paper,800,'right');
  c.save();
  c.beginPath();
  c.rect(x+7,y+28,w-14,h-35);
  c.clip();
  const cx=x+w/2,cy=y+111, scale=.218;
  c.translate(cx,cy);
  c.scale(scale,scale);
  c.translate(-p.x,-p.y);
  fill(c,'#263b3d',p.x-520,p.y-410,1040,820);
  fill(c,'#418989',4530,0,270,4800);
  for (const r of ROADS) {
    fill(c,'#5d6e67',r-51,140,102,4120);
    fill(c,'#5d6e67',140,r-51,4120,102);
  }
  fill(c,'#507d61',1870,1870,260,260);
  for (const q of [safehouse,garage]) circle(c,'#94bba6',q.x,q.y,14);
  const taxi=s.fare?.target??taxiStand;
  circle(c,'#6eede0',taxi.x,taxi.y,17);
  for (const v of s.cars) if (v.role==='police' && v.hp>0) circle(c,'#7bbcff',v.x,v.y,14);
  for (const n of s.people) if (n.job && n.hp>0) circle(c,'#ff8977',n.x,n.y,13);
  if (target) {
    const dx=clamp(target.x-p.x,-435,435),dy=clamp(target.y-p.y,-320,320);
    polygon(c,sand,[[p.x+dx,p.y+dy-22],[p.x+dx+22,p.y+dy],[p.x+dx,p.y+dy+22],[p.x+dx-22,p.y+dy]]);
  }
  c.translate(p.x,p.y);
  c.rotate(p.a);
  polygon(c,'#fff8dc',[[31,0],[-17,-19],[-9,0],[-17,19]]);
  c.restore();
}

export function paintHUD(c,s,area) {
  const p=s.player,[task,target]=objective(s), job=jobs[s.chapter];
  panel(c,24,23,225,111);
  const clock=(17*60+42+Math.floor(s.visualTime/3))%1440;
  text(c,area.toUpperCase(),37,45,11,mint,850);
  text(c,`${String(Math.floor(clock/60)).padStart(2,'0')}:${String(clock%60).padStart(2,'0')}`,236,45,11,paper,800,'right');
  text(c,money(s.cash),37,77,23,paper,800);
  text(c,'GARAGE DEBT',236,64,9,'#c2d3c6',800,'right');
  text(c,money(s.debt),236,81,15,sand,800,'right');
  text(c,'HP',37,105,10,paper,850);
  text(c,'ARMOR',109,105,10,paper,850);
  text(c,`${p.ammo} AMMO`,236,110,11,paper,800,'right');
  bar(c,37,113,60,p.hp,'#f18e79');
  bar(c,109,113,60,p.armor,'#82ccd7');

  panel(c,385,23,510,66,sand);
  text(c,job?`JOB 0${s.chapter+1}  /  ${job.title.toUpperCase()}`:'FREE ROAM',402,46,10,sand,850);
  text(c,task,402,70,15,paper,740);
  if (target && distance(target,p)>70) {
    compass(c,s,target,870,45);
    text(c,`${Math.round(distance(target,p))} m`,878,71,11,mint,800,'right');
  }

  panel(c,1019,23,237,75,s.stars?'#f29a84':'#79998b');
  text(c,s.stars?'SBPD  /  ACTIVE PURSUIT':'SBPD  /  STATUS CLEAR',1033,46,10,s.stars?'#ffab95':mint,850);
  for (let i=0;i<5;i++) text(c,i<s.stars?'★':'☆',1032+i*43,78,24,i<s.stars?sand:'#a8b5a8',650);

  if (s.notice?.until>s.time) {
    panel(c,24,151,294,93,'#e89b84');
    text(c,s.notice.who,37,174,11,'#ffb5a1',850);
    const words=s.notice.text.split(' ');
    let line='', y=195;
    for (const word of words) {
      c.font='600 12px system-ui';
      if (line && c.measureText(line+' '+word).width>268) {
        text(c,line,37,y,12);
        line=word;
        y+=17;
      } else line+=(line?' ':'')+word;
    }
    text(c,line,37,y,12);
  }

  if (s.news?.until>s.time) {
    panel(c,459,554,362,61,mint);
    text(c,s.news.title,640,577,12,mint,850,'center');
    text(c,s.news.text,640,599,13,paper,700,'center');
  }
  minimap(c,s,target);
  const nearby=!p.car && s.cars.some(v=>v.hp>0 && distance(v,p)<53);
  const driving=p.car;
  if (nearby) text(c,'E   ENTER VEHICLE',640,653,13,paper,850,'center');
  if (distance(s.fare?.target??taxiStand,p)<85 && p.car?.model===7) {
    text(c,s.fare?'STOP TO DROP OFF':'R   PICK UP FARE',640,653,13,mint,850,'center');
  }
  panel(c,1028,551,228,130,driving?sand:mint);
  if (driving) {
    const model=models[p.car.model], speed=Math.abs(p.car.speed);
    text(c,model[0].toUpperCase(),1042,574,11,sand,850);
    text(c,String(Math.round(speed*.42)).padStart(2,'0'),1041,624,45,paper,800);
    text(c,'KM/H',1141,618,11,mint,850);
    bar(c,1042,641,199,p.car.hp,'#ffd08b');
    text(c,'E EXIT    /    SPACE BRAKE',1042,662,10,paper,750);
  } else {
    text(c,'ON FOOT',1042,575,11,mint,850);
    text(c,'F',1042,606,14,sand,850);
    text(c,'Fists',1077,606,13);
    text(c,'LMB',1042,631,13,sand,850);
    text(c,'Pistol',1077,631,13);
    text(c,'SHIFT',1042,656,11,sand,850);
    text(c,'Sprint',1100,656,13);
  }
  text(c,'ESC  PAUSE     Q  SAVE     M  AUDIO',640,699,11,'#f8edd5',800,'center');
}
