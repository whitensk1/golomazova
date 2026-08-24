/**
 * «Поймай коррупционера» — лёгкий кликер.
 * Абстрактные фигуры, без портретов и намёков на личности.
 */
(() => {
  "use strict";

  const canvas = document.getElementById("stage");
  const overlay = document.getElementById("overlay");
  const startBtn = document.getElementById("start-btn");
  const scoreEl = document.getElementById("score");
  const timeEl = document.getElementById("time");
  const bestEl = document.getElementById("best");
  const titleEl = document.getElementById("overlay-title");
  const textEl = document.getElementById("overlay-text");
  if (!canvas || !startBtn) return;

  const ctx = canvas.getContext("2d");
  const DURATION = 30;
  const BEST_KEY = "golomazova-catch-best";

  let running = false;
  let score = 0;
  let timeLeft = DURATION;
  let entities = [];
  let particles = [];
  let lastTs = 0;
  let spawnAcc = 0;
  let raf = 0;
  let timerId = 0;

  const best = Number(localStorage.getItem(BEST_KEY) || 0);
  bestEl.textContent = String(best);

  const resize = () => {
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(320, Math.floor(rect.width));
    const h = Math.max(220, Math.floor(rect.height));
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
  };

  const rand = (a, b) => a + Math.random() * (b - a);

  const spawn = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const corrupt = Math.random() > 0.28;
    const r = rand(22, 36);
    entities.push({
      x: rand(r + 8, w - r - 8),
      y: rand(r + 8, h - r - 8),
      r,
      vx: rand(-40, 40),
      vy: rand(-40, 40),
      life: rand(2.2, 3.6),
      age: 0,
      corrupt,
      wobble: rand(0, Math.PI * 2),
    });
  };

  const burst = (x, y, ok) => {
    for (let i = 0; i < 10; i++) {
      particles.push({
        x,
        y,
        vx: rand(-120, 120),
        vy: rand(-140, 40),
        life: rand(0.35, 0.7),
        age: 0,
        color: ok ? "#00a098" : "#f5a623",
      });
    }
  };

  const drawEntity = (e) => {
    const fade = Math.max(0, 1 - e.age / e.life);
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(e.x, e.y + Math.sin(e.wobble) * 3);

    if (e.corrupt) {
      // серый силуэт + портфель
      ctx.fillStyle = "#4a5560";
      ctx.beginPath();
      ctx.ellipse(0, 6, e.r * 0.7, e.r * 0.85, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#2d343c";
      ctx.beginPath();
      ctx.arc(0, -e.r * 0.45, e.r * 0.38, 0, Math.PI * 2);
      ctx.fill();
      // briefcase
      ctx.fillStyle = "#8b5a2b";
      ctx.fillRect(-e.r * 0.55, e.r * 0.15, e.r * 1.1, e.r * 0.55);
      ctx.strokeStyle = "#f5a623";
      ctx.lineWidth = 2;
      ctx.strokeRect(-e.r * 0.55, e.r * 0.15, e.r * 1.1, e.r * 0.55);
      // $ hint abstract
      ctx.fillStyle = "#f5a623";
      ctx.font = "bold " + Math.floor(e.r * 0.45) + "px Inter,sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("₽", 0, e.r * 0.42);
    } else {
      // честный — бирюзовый щит
      ctx.fillStyle = "#00a098";
      ctx.beginPath();
      ctx.arc(0, 0, e.r * 0.85, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#7ac143";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, e.r * 0.85, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.font = "bold " + Math.floor(e.r * 0.9) + "px Inter,sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("✓", 0, 1);
    }
    ctx.restore();
  };

  const drawBg = () => {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#102226");
    g.addColorStop(1, "#0a1416");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(0,160,152,0.12)";
    ctx.lineWidth = 1;
    for (let x = 40; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 40; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  };

  const tick = (ts) => {
    if (!running) return;
    if (!lastTs) lastTs = ts;
    const dt = Math.min(0.05, (ts - lastTs) / 1000);
    lastTs = ts;

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    spawnAcc += dt;
    const spawnEvery = Math.max(0.35, 0.85 - score * 0.008);
    while (spawnAcc >= spawnEvery) {
      spawnAcc -= spawnEvery;
      spawn();
    }

    entities.forEach((e) => {
      e.age += dt;
      e.wobble += dt * 4;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      if (e.x < e.r || e.x > w - e.r) e.vx *= -1;
      if (e.y < e.r || e.y > h - e.r) e.vy *= -1;
    });
    entities = entities.filter((e) => e.age < e.life);

    particles.forEach((p) => {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 180 * dt;
    });
    particles = particles.filter((p) => p.age < p.life);

    drawBg();
    entities.forEach(drawEntity);
    particles.forEach((p) => {
      ctx.globalAlpha = 1 - p.age / p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    raf = requestAnimationFrame(tick);
  };

  const endGame = () => {
    running = false;
    cancelAnimationFrame(raf);
    clearInterval(timerId);
    const prev = Number(localStorage.getItem(BEST_KEY) || 0);
    if (score > prev) {
      localStorage.setItem(BEST_KEY, String(score));
      bestEl.textContent = String(score);
    }
    titleEl.textContent = score >= 12 ? "Прозрачность побеждает!" : "Раунд окончен";
    textEl.textContent =
      "Счёт: " + score + ". Рекорд: " + Math.max(score, prev) + ". Сыграем ещё?";
    startBtn.textContent = "Ещё раз";
    overlay.classList.remove("is-hidden");
  };

  const startGame = () => {
    score = 0;
    timeLeft = DURATION;
    entities = [];
    particles = [];
    spawnAcc = 0;
    lastTs = 0;
    scoreEl.textContent = "0";
    timeEl.textContent = String(DURATION);
    overlay.classList.add("is-hidden");
    running = true;
    resize();
    for (let i = 0; i < 4; i++) spawn();
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(tick);
    clearInterval(timerId);
    timerId = setInterval(() => {
      timeLeft -= 1;
      timeEl.textContent = String(Math.max(0, timeLeft));
      if (timeLeft <= 0) endGame();
    }, 1000);
  };

  const pointer = (clientX, clientY) => {
    if (!running) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.clientWidth;
    const y = ((clientY - rect.top) / rect.height) * canvas.clientHeight;

    let hit = -1;
    for (let i = entities.length - 1; i >= 0; i--) {
      const e = entities[i];
      const dx = e.x - x;
      const dy = e.y - y;
      if (dx * dx + dy * dy <= e.r * e.r) {
        hit = i;
        break;
      }
    }
    if (hit < 0) return;
    const e = entities[hit];
    entities.splice(hit, 1);
    if (e.corrupt) {
      score += 1;
      burst(e.x, e.y, true);
    } else {
      score = Math.max(0, score - 2);
      burst(e.x, e.y, false);
    }
    scoreEl.textContent = String(score);
  };

  startBtn.addEventListener("click", startGame);
  canvas.addEventListener("pointerdown", (ev) => {
    pointer(ev.clientX, ev.clientY);
  });

  window.addEventListener("resize", () => {
    resize();
    if (!running) {
      drawBg();
    }
  });

  resize();
  drawBg();
})();
