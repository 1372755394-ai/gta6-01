import { loadGame } from './save.js';

const help=`<dl class="controls">
<dt>W A S D</dt><dd>Walk, accelerate, reverse and steer</dd>
<dt>E</dt><dd>Enter, jack or exit a vehicle</dd>
<dt>Space / Shift</dt><dd>Handbrake / sprint on foot</dd>
<dt>Mouse / F</dt><dd>Aim and fire pistol / punch</dd>
<dt>R</dt><dd>Pick up a crate or taxi passenger</dd>
<dt>Q / M / Esc</dt><dd>Save / toggle audio / pause</dd>
</dl>`;

export function drawScreen(overlay,s,actions) {
  const page=s.screen;
  if (page==='play') {
    overlay.innerHTML='';
    overlay.classList.remove('active');
    return;
  }
  overlay.classList.add('active');
  const buttons=[];
  let body='';
  if (page==='title') {
    body=`<p class="kicker">A Solmar Bay story</p><h1><span>Solmar</span><span>Bay</span></h1>
      <p class="subtitle">Vice &amp; Velocity</p>
      <p class="copy">You owe Reyes Garage fifty grand. Run the bay, work the docks and find out who owns the debt.</p>`;
    buttons.push(['New game',actions.start]);
    const saved=loadGame();
    if (saved) buttons.push(['Continue',()=>actions.start(saved)]);
    buttons.push(['How to play',()=>actions.switchTo('help')]);
  } else if (page==='help') {
    body=`<p class="kicker">Solmar Bay</p><h2>How to play</h2>${help}`;
    buttons.push(['Back',()=>actions.switchTo('title')]);
  } else if (page==='pause') {
    body=`<p class="kicker">Solmar Bay</p><h2>Paused</h2>${help}`;
    buttons.push(['Resume',()=>actions.switchTo('play')],['Save game',actions.save],['Title screen',()=>actions.switchTo('title')]);
  } else if (page==='complete') {
    body=`<p class="kicker">Garage debt cleared</p><h2>Paid in full</h2>
      <p class="copy">Ina puts the shop keys on the counter. Doyle’s account is closed. Reyes Garage opens tomorrow, and your name is on the lease.</p>`;
    buttons.push(['Free roam',()=>actions.switchTo('play')],['Title screen',()=>actions.switchTo('title')]);
  } else {
    const busted=page==='busted';
    body=`<p class="kicker">${busted?'SBPD custody':'Solmar Bay emergency'}</p><h2>${busted?'Busted':'Wasted'}</h2>
      <p class="copy">Reyes can get you back on your feet. Your current job starts over.</p>`;
    buttons.push(['Retry job',actions.retry],['Title screen',()=>actions.switchTo('title')]);
  }
  overlay.innerHTML=`<section class="menu">${body}<div class="actions"></div></section>`;
  for (const [name,callback] of buttons) {
    const button=document.createElement('button');
    button.textContent=name;
    button.addEventListener('click',()=>{
      const result=callback();
      if (name==='Save game') button.textContent=result?'Saved':'Save unavailable';
    });
    overlay.querySelector('.actions').append(button);
  }
}
