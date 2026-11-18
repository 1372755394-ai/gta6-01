import { buildCity,spawn,blocked } from './city.js';
import { random } from './random.js';
import { bindInput } from './input.js';
import { car,drive,populateCars,requestVehicle,updateTraffic } from './vehicles.js';
import { populatePeople,updateOnFoot,updatePeople } from './people.js';
import { raiseHeat,updatePolice } from './police.js';
import { effect,fire,updateCombat } from './combat.js';
import { prepareJob,updateJobs } from './missions.js';
import { saveGame } from './save.js';
import { makeAudio } from './audio.js';
import { render } from './render.js';
import { drawScreen } from './screens.js';
import { stage } from './shots.js';

const canvas=document.querySelector('canvas'), overlay=document.querySelector('#overlay');
const context=canvas.getContext('2d',{alpha:false});
const input=bindInput(canvas);
const audio=makeAudio();
const city=buildCity();
export let state;
let previousScreen;

function createState(saved) {
  const rng=random(390657);
  const s={
    city,input,rng,screen:'title',time:0,visualTime:0,shake:0,hurtUntil:0,lastShot:-20,
    camera:{x:4035,y:3535,z:1,tx:640,ty:360},
    player:{...spawn,a:0,hp:100,armor:35,ammo:36,car:null,attackAt:0},
    cash:0,debt:50000,chapter:0,heat:0,stars:0,lastSeen:0,bust:0,
    dispatches:0,nextDispatch:0,fareIndex:0,
    cars:populateCars(rng),people:populatePeople(rng),bullets:[],effects:[],
    pickups:[{x:1284,y:1848,type:'ammo'},{x:2226,y:1421,type:'health'},{x:2208,y:1425,type:'armor'}],
    sound:audio.play,
    effect:(...args)=>effect(s,...args),
    fire:(...args)=>fire(s,...args),
    crime:amount=>raiseHeat(s,amount),
    restoreContract(){
      const v=car(1180,1838,0);
      v.contract=true;
      s.cars.push(v);
    }
  };
  if (saved) {
    for (const key of ['cash','debt','chapter']) s[key]=saved[key];
    for (const key of ['x','y','a','hp','armor','ammo']) {
      if (Number.isFinite(saved[key])) s.player[key]=saved[key];
    }
    if (blocked(city,s.player.x,s.player.y,8)) Object.assign(s.player,spawn);
    if (saved.car && Number.isInteger(saved.car.model) && saved.car.model>=0 && saved.car.model<8) {
      const v=car(s.player.x,s.player.y,s.player.a,saved.car.model,'player');
      v.hp=Math.max(10,saved.car.hp);
      v.contract=saved.car.contract;
      if (v.contract) s.cars=s.cars.filter(other=>!other.contract);
      s.cars.push(v);
      s.player.car=v;
    }
  }
  prepareJob(s);
  return s;
}

function switchTo(page) {
  state.screen=page;
  if (page==='play') input.mouse.down=false;
}
function start(saved) {
  posed=false;
  audio.start();
  state=createState(saved);
  Object.assign(state.camera,{x:state.player.x,y:state.player.y});
  switchTo('play');
}
function save() {
  const result=saveGame(state);
  state.news={title:result?'GAME SAVED':'SAVE UNAVAILABLE',
    text:result?'Job progress and position recorded.':'Browser storage could not be written.',until:state.time+3};
  return result;
}
function retry() {
  const {chapter,cash,debt}=state;
  start({chapter,cash,debt});
}
const actions={start,save,retry,switchTo};

function update(s,dt) {
  if (input.pressed.has('KeyM')) {
    const enabled=audio.toggle();
    s.news={title:enabled?'AUDIO ON':'AUDIO MUTED',text:'M to toggle audio',until:s.time+2.5};
  }
  if (input.pressed.has('Escape')) {
    if (s.screen==='play') switchTo('pause');
    else if (s.screen==='pause') switchTo('play');
    else if (s.screen==='help') switchTo('title');
  }
  if (s.screen==='title' && input.pressed.has('Enter')) {start();return;}
  if (s.screen==='title' || s.screen==='help') {
    s.visualTime+=dt;
    updateTraffic(s,dt,s.visualTime);
    updatePeople(s,dt);
    return;
  }
  if (s.screen!=='play') return;
  s.time+=dt;
  s.visualTime+=dt;
  s.shake*=Math.exp(-10*dt);
  s.bust=Math.max(0,s.bust-dt*.5);
  if (input.pressed.has('KeyE')) requestVehicle(s);
  if (s.input.mouse.down && !s.player.car) {
    const cam=s.camera;
    s.aim=Math.atan2(cam.y+(input.mouse.y-cam.ty)/cam.z-s.player.y,cam.x+(input.mouse.x-cam.tx)/cam.z-s.player.x);
  }
  updateOnFoot(s,dt);
  drive(s,dt);
  updateTraffic(s,dt);
  updatePolice(s,dt);
  updatePeople(s,dt);
  updateCombat(s,dt);
  if (s.player.hp<=0) s.screen='wasted';
  else if (s.bust>1.12) s.screen='busted';
  else {
    updateJobs(s);
    if (input.pressed.has('KeyQ')) save();
  }
}

state=createState();
const key=new URLSearchParams(location.search).get('shot');
let posed=stage(state,key);
let last=performance.now();
function frame(now) {
  const dt=Math.min(.034,(now-last)/1000);
  last=now;
  if (posed && (input.pressed.size || input.click)) {
    posed=false;
    if (key!=='title') audio.start();
  }
  if (!posed) update(state,dt);
  input.pressed.clear();
  input.click=false;
  audio.step(state);
  render(context,state);
  if (state.screen!==previousScreen) {
    drawScreen(overlay,state,actions);
    previousScreen=state.screen;
  }
  window.__gameReady=true;
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
