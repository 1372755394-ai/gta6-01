import { ROADS } from './city.js';

export function fill(c,color,x,y,w,h) {
  c.fillStyle=color;
  c.fillRect(x,y,w,h);
}
export function polygon(c,color,points) {
  c.fillStyle=color;
  c.beginPath();
  points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));
  c.closePath();
  c.fill();
}
export function circle(c,color,x,y,r) {
  c.fillStyle=color;
  c.beginPath();
  c.arc(x,y,r,0,Math.PI*2);
  c.fill();
}

export function paintStreets(c,s,visible) {
  fill(c,'#b1a791',0,0,4800,4800);
  fill(c,'#e8ca8e',4266,0,534,4800);
  fill(c,'#efda9f',4425,0,85,4800);
  fill(c,'#3c9e9a',4530,0,270,4800);
  fill(c,'#71c7af',4504,0,42,4800);
  for (let x=4520;x<4800;x+=20) {
    c.lineWidth=x%40?1:3;
    c.strokeStyle=x%40?'#c8ead05c':'#a6ded060';
    c.beginPath();
    for (let y=0;y<=4800;y+=18) {
      const px=x+Math.sin(y*.025+s.visualTime*.9+x*.05)*5;
      if (!y) c.moveTo(px,y);
      else c.lineTo(px,y);
    }
    c.stroke();
  }
  paintCoast(c,visible);
  for (const road of ROADS) {
    fill(c,'#797a74',road-64,136,128,4128);
    fill(c,'#797a74',136,road-64,4128,128);
    fill(c,'#5e6464',road-60,136,120,4128);
    fill(c,'#5e6464',136,road-60,4128,120);
  }
  for (const road of ROADS) {
    for (let i=0;i<ROADS.length-1;i++) {
      const start=ROADS[i]+63;
      if (visible(start,road,385)) paintLane(c,start,road,false);
      if (visible(road,start,385)) paintLane(c,road,start,true);
    }
  }
  for (const x of ROADS) for (const y of ROADS) {
    if (!visible(x,y,110)) continue;
    for (let n=-42;n<47;n+=12) {
      fill(c,'#c6c5aa',x+n,y-61,6,13);
      fill(c,'#c6c5aa',x+n,y+48,6,13);
      fill(c,'#c6c5aa',x-61,y+n,13,6);
      fill(c,'#c6c5aa',x+48,y+n,13,6);
    }
    fill(c,'#343f40',x+55,y+54,6,12);
    fill(c,Math.floor(s.visualTime/5+x/400+y/400)%2?'#ffc076':'#66e3a2',x+56,y+55,3,3);
  }
}


function paintCoast(c,visible) {
  for (const y of [3370,3635,3900,4165]) {
    if (!visible(4530,y,260)) continue;
    fill(c,'#274e526a',4458,y+7,205,34);
    fill(c,'#858875',4455,y,207,32);
    fill(c,'#d4bf94',4455,y,207,4);
    for (let x=4470;x<4660;x+=13) fill(c,'#605f522f',x,y+4,1,26);
    for (const x of [4554,4632]) {
      fill(c,'#4e7777',x-15,y+43,44,75);
      polygon(c,'#e5d6a8',[[x-11,y+56],[x+5,y+39],[x+20,y+56],[x+20,y+108],[x-11,y+108]]);
      fill(c,'#f9e6bd',x-7,y+73,24,27);
      fill(c,'#67868a',x-5,y+76,20,9);
    }
  }
  for (let y=465;y<3020;y+=137) {
    if (!visible(4450,y,70)) continue;
    for (const [x,dy,color] of [[4401,0,'#dc866d'],[4447,38,'#5d9f99'],[4477,-13,'#eab668']]) {
      circle(c,'#645b3d38',x+6,y+dy+5,12);
      circle(c,color,x,y+dy,11);
      circle(c,'#fff3cc',x,y+dy,4);
      fill(c,'#f0e0af',x+8,y+dy+9,5,12);
    }
  }
}

function paintLane(c,x,y,vertical) {
  c.save();
  c.translate(x,y);
  if (vertical) c.rotate(Math.PI/2);
  fill(c,'#b29e67',0,-2,274,1);
  fill(c,'#b29e67',0,2,274,1);
  fill(c,'#909385',0,43,274,1);
  fill(c,'#909385',0,-43,274,1);
  for (let j=6;j<262;j+=29) {
    fill(c,'#c5c6b8',j,20,12,1);
    fill(c,'#c5c6b8',j,-20,12,1);
  }
  for (let j=20;j<270;j+=63) {
    fill(c,'#4e5759',j,-38,8,3);
    fill(c,'#737b78',j+15,34,11,1);
  }
  c.restore();
}

export function paintLot(c,b) {
  const {x,y,w}=b;
  fill(c,'#5a5b54',x-1,y-1,w+2,w+3);
  fill(c,b.port?'#8e9c94':b.park?'#b8bb7e':b.shade>.5?'#cabea7':'#beb4a0',x,y,w,w);
  for (let n=14;n<w;n+=14) {
    fill(c,'#554f3e23',x+n,y,1,15);
    fill(c,'#554f3e23',x+n,y+w-14,1,14);
    fill(c,'#554f3e23',x,y+n,14,1);
    fill(c,'#554f3e23',x+w-14,y+n,14,1);
  }
  if (b.park) {
    fill(c,'#7a9b6c',x+18,y+18,w-36,w-36);
    fill(c,'#d0c396',x+18,y+w/2-8,w-36,16);
    fill(c,'#d0c396',x+w/2-8,y+18,16,w-36);
    circle(c,'#d8cea7',x+w/2,y+w/2,46);
    circle(c,'#427a79',x+w/2,y+w/2,30);
    circle(c,'#87c5b5',x+w/2,y+w/2,23);
    circle(c,'#e1efd0',x+w/2,y+w/2,6);
    sign(c,'CENTRAL PARK',x+w/2,y+w-21,'#253e35');
  }
  if (b.port) {
    for (let i=0;i<6;i++) {
      fill(c,'#cabe86',x+20,y+14+i*44,227,1);
    }
    fill(c,'#5b6b67',x+238,y+8,4,w-16);
    fill(c,'#5b6b67',x+248,y+8,4,w-16);
  }
}

const roofs=['#dec38f','#e5b6a4','#9eb4a7','#c9876c','#c7cbbc','#9abfc0','#dfa57d'];
const walls=['#9e8662','#976963','#607d75','#95584b','#76827c','#547c83','#9e7052'];
export function paintBuilding(c,b) {
  const {x,y,w,h,rise,tone,kind}=b;
  const rx=x-rise*.39, ry=y-rise*.66;
  polygon(c,'#242e3350',[[rx,ry],[x+w+rise*.7,y+rise*.49],[x+w+rise*.7,y+h+rise*.82],[x+rise*.6,y+h+rise*.82],[x,y+h]]);
  polygon(c,walls[tone],[[rx,ry+h],[rx+w,ry+h],[x+w,y+h],[x,y+h]]);
  polygon(c,'#3c5053',[[rx+w,ry],[rx+w,ry+h],[x+w,y+h],[x+w,y]]);
  for (let floor=8;floor<rise*.64;floor+=9) {
    for (let offset=8;offset<w-7;offset+=13) {
      fill(c,kind==='tower'?'#a5dbd5':'#293c3fd9',rx+offset+floor*.59,ry+h+floor,7,4);
    }
  }
  fill(c,roofs[tone],rx,ry,w,h);
  fill(c,'#fff2c8a1',rx,ry,w,2);
  fill(c,'#fff2c895',rx,ry,2,h);
  fill(c,'#3f4c4977',rx+5,ry+h-8,w-11,2);
  fill(c,'#3f4c494f',rx+w-8,ry+5,2,h-11);
  if (kind==='block') {
    fill(c,'#394c4b36',rx+w*.58,ry+13,w*.27,h*.29);
    fill(c,'#e3d4ae',rx+w*.56,ry+10,w*.23,h*.23);
    for (let j=0;j<4;j++) fill(c,'#6c797164',rx+w*.59,ry+13+j*3,w*.16,1);
    fill(c,'#566c625d',rx+10,ry+h*.58,w*.26,h*.22);
    fill(c,'#eee4c0',rx+9,ry+h*.55,w*.22,h*.19);
    return;
  }
  if (kind==='tower') {
    fill(c,'#5d8793',rx+8,ry+8,w-16,h-16);
    fill(c,'#b4d3ca',rx+12,ry+12,w-24,h-24);
    fill(c,'#69969d',rx+31,ry+26,w-62,h-50);
    fill(c,'#bedace',rx+36,ry+31,w-72,h-60);
    circle(c,'#fbe6ad',rx+w/2,ry+h/2,18);
    sign(c,'D',rx+w/2,ry+h/2+5,'#254954',17);
    sign(c,'DOYLE TOWER',rx+w/2,ry+h-8,'#284951',11);
  } else {
    fill(c,kind==='garage'?'#394849':'#526b56',rx+7,ry+9,w-14,26);
    sign(c,kind==='garage'?'REYES GARAGE':'CASA LOMA',rx+w/2,ry+26,'#fff0c2',11);
  }
}

export function sign(c,label,x,y,color,size=10) {
  c.fillStyle=color;
  c.textAlign='center';
  c.font=`800 ${size}px system-ui`;
  c.fillText(label,x,y);
  c.textAlign='left';
}

const cargo=['#bd7258','#638f95','#ddb16d','#9a615c','#789480','#ddb98d'];
export function paintContainer(c,b) {
  const {x,y,w,h,tone}=b;
  fill(c,'#263f4359',x+3,y+3,w+4,h+5);
  fill(c,'#4b5550',x,y+h-3,w,h*.27);
  fill(c,cargo[tone],x-3,y-5,w,h);
  fill(c,'#f5dfb272',x-3,y-5,w,1);
  for (let i=1;i<12;i++) fill(c,'#333e3b45',x-3+i*4.7,y-2,1,h-7);
  fill(c,'#fce7b3',x+2,y,7,4);
}

export function paintTree(c,t) {
  const {x,y,size,palm,tone}=t;
  c.save();
  c.translate(x,y);
  c.scale(size/13,size/13);
  c.fillStyle='#2a40364d';
  c.beginPath();
  c.ellipse(11,10,palm?16:18,9,.5,0,7);
  c.fill();
  if (palm) {
    fill(c,'#715d3e',-1,-12,3,15);
    c.translate(-4,-12);
    for (let i=0;i<8;i++) {
      c.rotate(.786);
      polygon(c,i%3===0?'#9cac62':tone>.5?'#4a7652':'#356950',[[0,0],[5,-3],[11,-3],[17,2],[11,1],[7,3],[4,1]]);
    }
    circle(c,'#b0aa63',0,0,2.4);
  } else {
    circle(c,'#375f49',0,-4,12);
    circle(c,'#568158',-4,-8,9);
    circle(c,'#7a945c',-6,-11,6);
  }
  c.restore();
}
