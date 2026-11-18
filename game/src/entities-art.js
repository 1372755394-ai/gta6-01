import { models } from './vehicles.js';
import { fill, polygon, circle, sign } from './city-art.js';

export function paintCar(c,v,time) {
  const [, , , ,paint,l,w]=models[v.model];
  c.save();
  c.translate(v.x,v.y);
  c.rotate(v.a);
  const police=v.role==='police';
  const body=v.wreck?'#4b4541':police?'#e2e4d7':paint;
  if (police) {
    const beat=Math.floor(time*9+v.x)%2;
    for (const [side,color] of [[-1,beat?'#fb5f77':'#6ebdff'],[1,beat?'#6ebdff':'#fb5f77']]) {
      const lamp=c.createRadialGradient(0,side*8,2,0,side*8,47);
      lamp.addColorStop(0,color+'ac');
      lamp.addColorStop(1,color+'00');
      circle(c,lamp,0,side*8,47);
    }
  }
  const shape=[[-l/2,-w/2+4],[-l/2+5,-w/2],[l/2-7,-w/2],[l/2,-w/2+6],[l/2,w/2-6],[l/2-7,w/2],[-l/2+5,w/2],[-l/2,w/2-4]];
  polygon(c,'#202a2f80',shape.map(([x,y])=>[x+5,y+5]));
  for (const x of [-l*.34,l*.27]) for (const y of [-w*.54,w*.39]) fill(c,'#21282a',x,y,10,w*.15);
  polygon(c,body,shape);
  fill(c,'#fff7db8f',-l/2+6,-w/2+1,l-14,2);
  fill(c,'#242b317a',-l/2+6,w/2-3,l-14,2);
  polygon(c,v.wreck?'#292c2a':'#233b46',[[-l*.29,-w*.31],[-l*.22,-w*.42],[l*.15,-w*.42],[l*.28,-w*.31],[l*.28,w*.31],[l*.15,w*.42],[-l*.22,w*.42],[-l*.29,w*.31]]);
  polygon(c,'#6cb1b2',[[l*.14,-w*.36],[l*.25,-w*.29],[l*.25,w*.29],[l*.14,w*.36]]);
  fill(c,body,-l*.16,-w*.31,l*.30,w*.62);
  fill(c,'#fff4ca59',-l*.14,-w*.27,l*.26,2);
  if (!v.wreck) {
    for (const side of [-1,1]) {
      fill(c,'#ffefa9',l/2-3,side*w*.28-2,4,4);
      fill(c,'#e6564a',-l/2,side*w*.3-2,3,4);
    }
  }
  if (police) {
    fill(c,'#28536c',-6,-w/2,9,w);
    fill(c,'#ff6987',-4,-8,6,6);
    fill(c,'#6de3ff',-4,2,6,6);
    sign(c,'SBPD',-13,3,'#253c4c',6);
  } else if (v.model===7) {
    fill(c,'#332e2b',-5,-5,10,10);
    fill(c,'#ffec9a',-4,-3,8,6);
  }
  c.restore();
}

const shirts=['#d9755d','#febc71','#67b9a3','#ded4b3','#b98eb3','#3b727f'];
export function paintPerson(c,n,time,player=false) {
  if (n.hp<=0) {
    c.save();
    c.translate(n.x,n.y);
    c.rotate(n.a+.45);
    fill(c,'#28343785',-9,-4,18,8);
    fill(c,n.job?'#873f4a':'#877c6b',-3,-4,8,7);
    circle(c,'#b08362',7,0,3);
    c.restore();
    return;
  }
  const hostile=n.role==='gang'||n.role==='boss';
  c.save();
  c.translate(n.x,n.y);
  if (hostile || player) {
    c.strokeStyle=hostile?'#ff9884':'#fcdb8a';
    c.lineWidth=1.7;
    c.beginPath();
    c.arc(0,0,n.role==='boss'?16:12,0,7);
    c.stroke();
  }
  c.rotate(n.a);
  const legs=Math.sin(time*(n.fear>0?16:10)+n.x*.04)*2;
  fill(c,'#28353679',-8,-5,20,13);
  fill(c,'#243340',-8+legs,-4,7,3);
  fill(c,'#243340',-8-legs,2,7,3);
  const torso=player?'#ffd38d':hostile?'#ae4e61':n.role==='officer'?'#568cbd':shirts[n.tone%6];
  fill(c,torso,-5,-6,10,12);
  fill(c,'#c79272',2,-7,5,3);
  fill(c,'#c79272',2,4,5,3);
  circle(c,player?'#573838':'#5b4037',2,0,4);
  circle(c,'#d1a181',4,0,2.8);
  if (hostile || player) {
    fill(c,'#272b32',6,-4,n.punchUntil>time?9:7,3);
  }
  c.restore();
}
