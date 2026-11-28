const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// --- размер мира фиксирован ---
const W = 800;
const H = 450;
canvas.width = W;
canvas.height = H;

function resize() {
  const scale = Math.min(window.innerWidth / W, window.innerHeight / H);
  canvas.style.width = W * scale + "px";
  canvas.style.height = H * scale + "px";
}
window.addEventListener("resize", resize);
resize();

// --- комнаты ---
// obstacles: fx это доля ширины экрана, y, w, h в пикселях
// left / right: номер комнаты, куда ведёт край экрана (null = стена)
const rooms = [
  {
    bg: "#c9d6e8", left: null, right: 1,
    obstacles: [
      { fx: 0.30, y: 120, w: 90, h: 90, color: "#7a5230" },
      { fx: 0.55, y: 280, w: 140, h: 40, color: "#5a6b7d" },
    ],
  },
  {
    bg: "#e8d3a8", left: 0, right: null,
    obstacles: [
      { fx: 0.20, y: 60,  w: 60,  h: 150, color: "#7a5230" },
      { fx: 0.50, y: 220, w: 120, h: 120, color: "#5a6b7d" },
    ],
  },
];
let current = 0;

// --- управление ---
const keys = {};
window.addEventListener("keydown", (e) => {
  keys[e.code] = true;
  if (e.code === "Space") e.preventDefault();
});
window.addEventListener("keyup", (e) => { keys[e.code] = false; });

// --- экранные кнопки ---
document.querySelectorAll(".btn").forEach((btn) => {
  const code = btn.dataset.key;
  const press = (e) => { e.preventDefault(); keys[code] = true; };
  const release = (e) => { e.preventDefault(); keys[code] = false; };
  btn.addEventListener("pointerdown", press);
  btn.addEventListener("pointerup", release);
  btn.addEventListener("pointercancel", release);
  btn.addEventListener("pointerleave", release);
});
window.addEventListener("contextmenu", (e) => e.preventDefault());

const startPoint = { x: 60, y: 200 };
const hero = { x: startPoint.x, y: startPoint.y, w: 28, h: 40 };
const speed = 210;

function hits(x, y, o) {
  const ox = o.fx * W;
  return x + hero.w > ox && x < ox + o.w && y + hero.h > o.y && y < o.y + o.h;
}
 
let last = performance.now();

function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.05); // секунд с прошлого кадра
  last = now;

  const room = rooms[current];

  // направление движения
  let dx = 0, dy = 0;
  if (keys["KeyD"]) dx += 1;
  if (keys["KeyA"]) dx -= 1;
  if (keys["KeyS"]) dy += 1;
  if (keys["KeyW"]) dy -= 1;
  if (dx !== 0 && dy !== 0) { dx *= 0.7071; dy *= 0.7071; } // по диагонали не быстрее

  // двигаем по осям отдельно, чтобы можно было скользить вдоль стен
  let nx = hero.x + dx * speed * dt;
  if (!room.obstacles.some(o => hits(nx, hero.y, o))) hero.x = nx;

  let ny = hero.y + dy * speed * dt;
  if (!room.obstacles.some(o => hits(hero.x, ny, o))) hero.y = ny;

  // верх и низ: стены
  if (hero.y < 0) hero.y = 0;
  if (hero.y + hero.h > H) hero.y = H - hero.h;

  // левый край
  if (hero.x < 0) {
    if (room.left !== null) {
      current = room.left;
      hero.x = W - hero.w - 1;
    } else {
      hero.x = 0;
    }
  }

  // правый край
  if (hero.x + hero.w > W) {
    if (room.right !== null) {
      current = room.right;
      hero.x = 1;
    } else {
      hero.x = W - hero.w;
    }
  }

  // страховка: если что-то пошло не так, вернуть на старт
  if (Number.isNaN(hero.x) || Number.isNaN(hero.y) ||
      hero.x < -100 || hero.x > W + 100 || hero.y < -100 || hero.y > H + 100) {
    hero.x = startPoint.x;
    hero.y = startPoint.y;
  }

  // рисование
  const r = rooms[current];
  ctx.fillStyle = r.bg;
  ctx.fillRect(0, 0, W, H);

  for (const o of r.obstacles) {
    ctx.fillStyle = o.color;
    ctx.fillRect(o.fx * W, o.y, o.w, o.h);
  }

  ctx.fillStyle = "#891496";
  ctx.fillRect(hero.x, hero.y, hero.w, hero.h);

  requestAnimationFrame(loop);
}

requestAnimationFrame(loop);