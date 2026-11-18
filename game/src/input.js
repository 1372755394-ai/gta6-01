export function bindInput(canvas) {
  const input = {keys:new Set(), pressed:new Set(), mouse:{x:640,y:360,down:false}, click:false};
  window.addEventListener('keydown', event => {
    if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code)) event.preventDefault();
    if (!event.repeat) input.pressed.add(event.code);
    input.keys.add(event.code);
  });
  window.addEventListener('keyup', event => input.keys.delete(event.code));
  window.addEventListener('blur', () => {
    input.keys.clear();
    input.pressed.clear();
    input.mouse.down = false;
  });
  canvas.addEventListener('pointermove', event => {
    const box = canvas.getBoundingClientRect();
    input.mouse.x = (event.clientX-box.left)*canvas.width/box.width;
    input.mouse.y = (event.clientY-box.top)*canvas.height/box.height;
  });
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    input.mouse.down = true;
    input.click = true;
  });
  window.addEventListener('pointerup', () => { input.mouse.down = false; });
  return input;
}
