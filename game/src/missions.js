import { garage, docks, tower, safehouse, taxiStand } from './city.js';
import { distance, point } from './random.js';

export const jobs=[
  {title:'Borrowed Time',who:'INA REYES',pay:500,credit:2500,brief:'A Vela is cooling at the curb. Bring it to my garage and we’ll talk about the fifty grand.'},
  {title:'Three Stops',who:'INA REYES',pay:950,credit:4500,brief:'Three parts orders. Get a car. My customers won’t wait forever.'},
  {title:'Saltwater Welcome',who:'MICA VALE',pay:1800,credit:7000,brief:'The Quay Crew bought our mechanic’s ledger. Find them in the freight yard.'},
  {title:'Blue Hour',who:'MICA VALE',pay:2400,credit:8500,brief:'The crew tipped off SBPD. Draw their cars away from the yard for forty-five seconds.'},
  {title:'Manifest Missing',who:'INA REYES',pay:3300,credit:10500,brief:'The ledger points to a crate at the docks. Get it to our safehouse.'},
  {title:'The Doyle Account',who:'INA REYES',pay:5000,credit:17000,brief:'The crate held Doyle’s invoices. He bought our debt with stolen money. Meet him at his tower.'}
];
const parcels=[point(1645,1819),point(1818,2200),point(2200,2233)];
const crate=point(4240,3862);
const fares=[point(1790,2180),point(2200,1786),point(2600,2214),point(2990,2600),point(3400,1840)];

export function prepareJob(s) {
  s.people=s.people.filter(n=>!n.job);
  s.job={phase:0,count:0,deadline:0,remaining:0};
  if (s.chapter===0 && !s.cars.some(v=>v.contract && v.hp>0)) s.restoreContract();
  if (jobs[s.chapter]) {
    const {who,brief}=jobs[s.chapter];
    s.notice={who,text:brief,until:s.time+9};
  }
}

export function spawnCrew(s,boss=false) {
  const p=boss?tower:docks;
  const offsets=boss?[[-28,-74],[30,57],[90,-18]]:[[-35,-89],[37,-54],[-48,81],[45,123],[48,-34]];
  offsets.forEach(([dx,dy],index)=>s.people.push({x:p.x+dx,y:p.y+dy,a:Math.PI,
    role:boss && index===0?'boss':'gang',hp:boss && index===0?290:62,job:true,tone:index%6,fireAt:s.time+.65+index*.27}));
}

export function objective(s) {
  const j=s.job, p=s.player;
  switch (s.chapter) {
    case 0: {
      const v=s.cars.find(v=>v.contract && v.hp>0);
      return p.car?.contract ? ['Deliver the Vela to Reyes Garage',garage] : ['Take the coral Vela R6 · E to enter',v??garage];
    }
    case 1: return j.phase===0 ? ['Get in a car to start the three timed drops',parcels[0]] :
      [`Deliver parcel ${j.count+1} / 3 · ${Math.max(0,Math.ceil(j.deadline-s.time))}s`,parcels[j.count]];
    case 2: return j.phase===0 ? ['Meet the Quay Crew at Saltglass Docks',docks] :
      [`Clear the freight yard · ${s.people.filter(n=>n.job&&n.hp>0).length} remaining`,docks];
    case 3: return j.phase===0 ? ['Get in a car to draw out SBPD',null] :
      [`Stay out of custody · ${Math.ceil(j.remaining)}s`,null];
    case 4: return j.phase===0 ? ['Recover the ledger crate · R on foot',crate] : ['Take the crate to the safehouse',safehouse];
    case 5: return j.phase===0 ? ['Confront Doyle at his tower',tower] :
      j.phase===1 ? ['Defeat Doyle and his guards',tower] : ['Escape to the safehouse and lose SBPD',safehouse];
    default: return ['Explore the bay or pick up a taxi fare',null];
  }
}

function complete(s) {
  const job=jobs[s.chapter];
  s.cash+=job.pay;
  s.debt=Math.max(0,s.debt-job.credit);
  s.news={title:'JOB COMPLETE',text:`+$${job.pay.toLocaleString('en-US')} cash  /  $${job.credit.toLocaleString('en-US')} debt cleared`,until:s.time+5};
  s.sound('reward');
  s.chapter++;
  prepareJob(s);
  if (s.chapter===jobs.length) s.screen='complete';
}

function armPlayer(s) {
  s.player.ammo=Math.max(75,s.player.ammo);
  s.player.armor=Math.max(55,s.player.armor);
}

export function updateJobs(s) {
  const j=s.job, p=s.player, near=(target,r)=>distance(target,p)<r;
  switch (s.chapter) {
    case 0:
      if (!s.cars.some(v=>v.contract && v.hp>0)) {
        s.news={title:'JOB RESTARTED',text:'Reyes found another Vela at the curb.',until:s.time+4};
        prepareJob(s);
      } else if (p.car?.contract && near(garage,43)) complete(s);
      break;
    case 1:
      if (j.phase===0 && p.car) Object.assign(j,{phase:1,count:0,deadline:s.time+52});
      else if (j.phase===1 && s.time>j.deadline) {
        s.news={title:'JOB RESTARTED',text:'The parcels are back at the first stop.',until:s.time+4};
        prepareJob(s);
      } else if (j.phase===1 && p.car && near(parcels[j.count],56) && ++j.count===3) complete(s);
      break;
    case 2:
      if (j.phase===0 && near(docks,190)) {j.phase=1;armPlayer(s);spawnCrew(s);}
      if (j.phase===1 && !s.people.some(n=>n.job&&n.hp>0)) complete(s);
      break;
    case 3:
      if (!j.phase && p.car) {
        j.phase=1;
        j.deadline=s.time+45;
        s.crime(Math.max(0,2.65-s.heat));
      }
      if (j.phase) {
        j.remaining=Math.max(0,j.deadline-s.time);
        if (!j.remaining) complete(s);
      }
      break;
    case 4:
      if (!j.phase && near(crate,230) && !j.guards) {j.guards=true;armPlayer(s);spawnCrew(s);}
      if (!j.phase && !p.car && near(crate,48) && s.input.pressed.has('KeyR')) {
        j.phase=1;
        s.crime(1.8);
      }
      if (j.phase && near(safehouse,65)) complete(s);
      break;
    case 5:
      if (!j.phase && near(tower,175)) {j.phase=1;armPlayer(s);spawnCrew(s,true);}
      if (j.phase===1 && !s.people.some(n=>n.job&&n.hp>0)) {j.phase=2;s.crime(3.3);}
      if (j.phase===2 && near(safehouse,75) && !s.stars) complete(s);
      break;
  }

  if (!s.fare && p.car?.model===7 && near(taxiStand,74) && s.input.pressed.has('KeyR')) {
    s.fare={target:fares[s.fareIndex++%fares.length],car:p.car};
    s.notice={who:'SUNLINE DISPATCH',text:'Passenger aboard. Follow the turquoise pin.',until:s.time+5};
  }
  if (s.fare?.car.hp<=0) s.fare=null;
  if (s.fare && p.car===s.fare.car && near(s.fare.target,38) && Math.abs(p.car.speed)<30) {
    s.cash+=350;
    s.news={title:'FARE COMPLETE',text:'+$350 cash',until:s.time+4};
    s.sound('reward');
    s.fare=null;
  }
}
