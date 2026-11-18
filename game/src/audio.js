export function makeAudio() {
  let ctx, bus, engine, motor, siren, sirenLevel, beat=0, nextBeat=0, enabled=true;
  function tone(freq,end,seconds,volume,type='triangle',at=ctx.currentTime) {
    const osc=ctx.createOscillator(), gain=ctx.createGain();
    osc.type=type;
    osc.frequency.setValueAtTime(freq,at);
    osc.frequency.exponentialRampToValueAtTime(end,at+seconds);
    gain.gain.setValueAtTime(volume,at);
    gain.gain.exponentialRampToValueAtTime(.0001,at+seconds);
    osc.connect(gain).connect(bus);
    osc.start(at);
    osc.stop(at+seconds+.005);
  }
  function start() {
    if (!ctx) {
      ctx=new AudioContext();
      bus=ctx.createGain();
      bus.gain.value=.57;
      bus.connect(ctx.destination);
      engine=ctx.createOscillator();
      engine.type='triangle';
      motor=ctx.createGain();
      motor.gain.value=0;
      engine.connect(motor).connect(bus);
      engine.start();
      siren=ctx.createOscillator();
      sirenLevel=ctx.createGain();
      sirenLevel.gain.value=0;
      siren.connect(sirenLevel).connect(bus);
      siren.start();
    }
    if (ctx.state==='suspended') ctx.resume().catch(()=>{});
  }
  function step(s) {
    if (!ctx) return;
    const now=ctx.currentTime, active=s.screen==='play';
    const speed=Math.abs(s.player.car?.speed??0);
    engine.frequency.setTargetAtTime(43+speed*.27,now,.08);
    motor.gain.setTargetAtTime(active&&s.player.car?.hp>0?.075:0,now,.08);
    const nearest=s.cars.reduce((d,v)=>v.role==='police'&&v.hp>0?Math.min(d,Math.hypot(v.x-s.player.x,v.y-s.player.y)):d,700);
    siren.frequency.setTargetAtTime(565+215*Math.sin(now*8),now,.04);
    sirenLevel.gain.setTargetAtTime(active&&s.stars?.035*(1-nearest/700):0,now,.08);
    if (!active) return;
    if (now+.06<nextBeat) return;
    nextBeat=Math.max(now,nextBeat);
    const bass=[55,55,65.4,49,55,73.4,65.4,49][beat%8];
    if (beat%4===0) tone(bass*2,bass,.22,.13,'sine',nextBeat);
    if (beat%4===2) tone(bass,bass,.25,.052,'triangle',nextBeat);
    if (beat%2===1) tone(1100,410,.06,.025,'square',nextBeat);
    if (beat%8===6) tone(bass*6,bass*5,.13,.028,'triangle',nextBeat);
    beat++;
    nextBeat+=.16;
  }
  function play(kind) {
    if (!ctx) return;
    if (kind==='reward') {
      tone(392,440,.19,.12);
      tone(587,660,.24,.095,'triangle',ctx.currentTime+.12);
    } else if (kind==='blast') tone(110,23,.62,.24,'sawtooth');
    else if (kind==='shot' || kind==='enemy') tone(190,47,.11,kind==='shot'?.18:.075,'square');
    else tone(95,34,.13,.12,'triangle');
  }
  return {start,step,play,toggle(){
    enabled=!enabled;
    if (bus) bus.gain.setTargetAtTime(enabled?.57:0,ctx.currentTime,.08);
    return enabled;
  }};
}
