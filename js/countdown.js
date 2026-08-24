/**
 * Countdown to Belokurikha city council elections — 20 Sep 2026.
 * Source: city council appointed EDG 20.09.2026; Altai multi-day voting 18–20.09.2026.
 */
(() => {
  "use strict";
  const daysEl = document.getElementById("cd-days");
  const hoursEl = document.getElementById("cd-hours");
  const minsEl = document.getElementById("cd-mins");
  const secsEl = document.getElementById("cd-secs");
  if (!daysEl) return;

  // End of election day Belokurikha (local) — start of 20 Sep 2026 Asia/Barnaul ≈ UTC+7
  const TARGET = new Date("2026-09-20T00:00:00+07:00").getTime();

  const pad = (n) => String(Math.max(0, n)).padStart(2, "0");

  const tick = () => {
    const now = Date.now();
    let diff = Math.max(0, TARGET - now);
    const days = Math.floor(diff / 86400000);
    diff -= days * 86400000;
    const hours = Math.floor(diff / 3600000);
    diff -= hours * 3600000;
    const mins = Math.floor(diff / 60000);
    diff -= mins * 60000;
    const secs = Math.floor(diff / 1000);

    daysEl.textContent = String(days);
    hoursEl.textContent = pad(hours);
    minsEl.textContent = pad(mins);
    secsEl.textContent = pad(secs);

    if (TARGET - now <= 0) {
      daysEl.textContent = "0";
      const note = document.querySelector(".countdown-note");
      if (note) note.textContent = "День голосования в Белокурихе — 20 сентября 2026.";
    }
  };

  tick();
  setInterval(tick, 1000);
})();
