const key='solmar-bay-save-v1';

export function loadGame() {
  try {
    const data=JSON.parse(localStorage.getItem(key));
    if (!data || !Number.isInteger(data.chapter) || data.chapter<0 || data.chapter>6) return null;
    return data;
  } catch {
    return null;
  }
}

export function saveGame(s) {
  try {
    const p=s.player;
    const data={chapter:s.chapter,cash:s.cash,debt:s.debt,hp:p.hp,armor:p.armor,ammo:p.ammo,
      x:p.x,y:p.y,a:p.a,car:p.car && {model:p.car.model,hp:p.car.hp,contract:!!p.car.contract}};
    localStorage.setItem(key,JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
