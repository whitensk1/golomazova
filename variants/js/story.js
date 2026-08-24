/**
 * Horizontal journey: wheel → x-scroll on desktop, snap chapters,
 * arrows + swipe, progress + dots. Vertical fallback on small screens.
 */
(() => {
  "use strict";

  const track = document.querySelector(".js-track");
  const panels = [...document.querySelectorAll(".panel")];
  const dots = [...document.querySelectorAll(".dot")];
  const prevBtn = document.querySelector(".js-prev");
  const nextBtn = document.querySelector(".js-next");
  const fill = document.querySelector(".progress__fill");
  const progress = document.querySelector(".progress");
  const ticks = document.querySelector(".progress__ticks");
  const live = document.getElementById("chapter-live");
  const mq = window.matchMedia("(max-width: 768px)");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

  if (!track || !panels.length) return;

  const last = panels.length - 1;
  let index = 0;
  let ticking = false;
  let dragging = false;
  let dragStart = 0;
  let dragScroll = 0;
  let hashLock = false;

  if (ticks) {
    ticks.innerHTML = panels.map(() => "<i></i>").join("");
  }

  const isVertical = () => mq.matches;
  const motion = () => (reduce.matches ? "auto" : "smooth");
  const isField = (el) =>
    el && el.closest && el.closest("input, textarea, select, [contenteditable='true']");

  const currentIndex = () => {
    const pos = isVertical() ? track.scrollTop : track.scrollLeft;
    let best = 0;
    let dist = Infinity;
    panels.forEach((p, i) => {
      const start = isVertical() ? p.offsetTop : p.offsetLeft;
      const d = Math.abs(start - pos);
      if (d < dist) {
        dist = d;
        best = i;
      }
    });
    return best;
  };

  const goTo = (i, behavior) => {
    i = Math.max(0, Math.min(last, i));
    const panel = panels[i];
    const opts = { behavior: behavior || motion() };
    if (isVertical()) track.scrollTo({ top: panel.offsetTop, ...opts });
    else track.scrollTo({ left: panel.offsetLeft, ...opts });
  };

  const setChrome = (i) => {
    index = i;
    const pct = last === 0 ? 100 : (i / last) * 100;
    if (fill) fill.style.width = pct + "%";
    if (progress) progress.setAttribute("aria-valuenow", String(i));

    panels.forEach((p, n) => p.classList.toggle("is-active", n === i));
    dots.forEach((d, n) => {
      d.classList.toggle("is-on", n === i);
      if (n === i) d.setAttribute("aria-current", "true");
      else d.removeAttribute("aria-current");
    });

    if (prevBtn) prevBtn.disabled = i === 0;
    if (nextBtn) nextBtn.disabled = i === last;

    const title = panels[i].getAttribute("data-title") || panels[i].id;
    if (live) live.textContent = "Глава " + (i + 1) + " из " + panels.length + ": " + title;

    const id = panels[i].id;
    if (id && location.hash.slice(1) !== id && !hashLock) {
      history.replaceState(null, "", "#" + id);
    }
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      setChrome(currentIndex());
      ticking = false;
    });
  };

  track.addEventListener("scroll", onScroll, { passive: true });

  window.addEventListener(
    "wheel",
    (e) => {
      if (isVertical() || e.ctrlKey || isField(e.target)) return;
      if (e.target.closest && e.target.closest(".v-switch")) return;
      const panel = e.target.closest && e.target.closest(".panel");
      if (panel && panel.scrollHeight > panel.clientHeight + 8) {
        const atTop = panel.scrollTop <= 0;
        const atBottom = panel.scrollTop + panel.clientHeight >= panel.scrollHeight - 2;
        if (!(atTop && atBottom) && !((atTop && e.deltaY < 0) || (atBottom && e.deltaY > 0))) {
          return;
        }
      }
      let dx = e.deltaX;
      let dy = e.deltaY;
      if (e.deltaMode === 1) {
        dx *= 16;
        dy *= 16;
      } else if (e.deltaMode === 2) {
        dx *= track.clientWidth;
        dy *= track.clientHeight;
      }
      if (Math.abs(dx) >= Math.abs(dy)) return;
      e.preventDefault();
      track.scrollLeft += dy;
    },
    { passive: false }
  );

  const onKey = (e) => {
    if (isField(e.target)) return;
    if (e.key === " " && e.target.closest && e.target.closest("a, button")) return;
    const keys = {
      ArrowRight: 1,
      ArrowDown: 1,
      PageDown: 1,
      " ": 1,
      ArrowLeft: -1,
      ArrowUp: -1,
      PageUp: -1,
    };
    if (e.key === "Home") {
      e.preventDefault();
      goTo(0);
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      goTo(last);
      return;
    }
    const dir = keys[e.key];
    if (!dir) return;
    e.preventDefault();
    goTo(index + dir);
  };
  document.addEventListener("keydown", onKey);

  let touchX = 0;
  let touchY = 0;
  track.addEventListener(
    "touchstart",
    (e) => {
      if (!e.changedTouches[0] || isField(e.target)) return;
      touchX = e.changedTouches[0].clientX;
      touchY = e.changedTouches[0].clientY;
    },
    { passive: true }
  );
  track.addEventListener(
    "touchend",
    (e) => {
      if (!e.changedTouches[0] || isField(e.target) || dragging) return;
      const x = e.changedTouches[0].clientX - touchX;
      const y = e.changedTouches[0].clientY - touchY;
      const absX = Math.abs(x);
      const absY = Math.abs(y);
      if (absX < 56 && absY < 56) return;
      const horizontal = absX > absY;
      if (isVertical() && horizontal) return;
      if (!isVertical() && !horizontal) return;
      const dir = isVertical() ? (y < 0 ? 1 : -1) : x < 0 ? 1 : -1;
      const pos = isVertical() ? track.scrollTop : track.scrollLeft;
      const start = isVertical() ? panels[index].offsetTop : panels[index].offsetLeft;
      if (Math.abs(pos - start) > 24) return;
      goTo(index + dir);
    },
    { passive: true }
  );

  track.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0) return;
    if (e.target.closest("a, button, input, textarea, select, label, .v-switch")) return;
    dragging = true;
    dragStart = isVertical() ? e.clientY : e.clientX;
    dragScroll = isVertical() ? track.scrollTop : track.scrollLeft;
    track.classList.add("is-grabbing");
    track.setPointerCapture(e.pointerId);
  });
  track.addEventListener("pointermove", (e) => {
    if (!dragging) return;
    const now = isVertical() ? e.clientY : e.clientX;
    const next = dragScroll - (now - dragStart);
    if (isVertical()) track.scrollTop = next;
    else track.scrollLeft = next;
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    track.classList.remove("is-grabbing");
    goTo(currentIndex());
  };
  track.addEventListener("pointerup", endDrag);
  track.addEventListener("pointercancel", endDrag);

  dots.forEach((dot) => {
    dot.addEventListener("click", (e) => {
      e.preventDefault();
      const id = dot.getAttribute("data-go");
      const i = panels.findIndex((p) => p.id === id);
      if (i >= 0) goTo(i);
    });
  });

  document.querySelectorAll("[data-go]").forEach((el) => {
    if (el.classList.contains("dot")) return;
    el.addEventListener("click", () => {
      const t = el.getAttribute("data-go");
      const i = /^\d+$/.test(t) ? Number(t) : panels.findIndex((p) => p.id === t);
      if (i >= 0) goTo(i);
    });
  });

  if (prevBtn) prevBtn.addEventListener("click", () => goTo(index - 1));
  if (nextBtn) nextBtn.addEventListener("click", () => goTo(index + 1));

  const fromHash = (behavior) => {
    const id = location.hash.replace("#", "");
    if (!id) return false;
    const i = panels.findIndex((p) => p.id === id);
    if (i < 0) return false;
    hashLock = true;
    goTo(i, behavior || "auto");
    setTimeout(() => {
      hashLock = false;
    }, 400);
    return true;
  };
  window.addEventListener("hashchange", () => fromHash(motion()));

  const onMode = () => {
    document.documentElement.classList.toggle("is-vertical", isVertical());
    goTo(index, "auto");
  };
  if (mq.addEventListener) mq.addEventListener("change", onMode);
  else mq.addListener(onMode);

  let resizeT;
  window.addEventListener("resize", () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => {
      if (isField(document.activeElement)) return;
      goTo(index, "auto");
    }, 120);
  });

  const form = document.getElementById("contact-form");
  const status = document.getElementById("cf-status");
  const MAIL_TO = "";
  const show = (text, isError) => {
    if (!status) return;
    status.textContent = text;
    status.classList.toggle("is-error", !!isError);
  };
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const name = (form.elements.name.value || "").trim();
      const contact = (form.elements.contact.value || "").trim();
      const message = (form.elements.message.value || "").trim();
      if (!name || !contact || !message) {
        show("Заполните все поля.", true);
        return;
      }
      const subject = encodeURIComponent("Сообщение с сайта — " + name);
      const body = encodeURIComponent("Имя: " + name + "\nКонтакт: " + contact + "\n\n" + message);
      if (MAIL_TO) {
        window.location.href = "mailto:" + MAIL_TO + "?subject=" + subject + "&body=" + body;
        show("Открываю почтовый клиент…");
        return;
      }
      const plain = "Имя: " + name + "\nКонтакт: " + contact + "\n\n" + message;
      const copy = () =>
        navigator.clipboard && navigator.clipboard.writeText
          ? navigator.clipboard.writeText(plain)
          : Promise.reject();
      copy()
        .then(() => {
          show("Текст скопирован. Откройте VK и вставьте сообщение.");
          window.open("https://vk.ru/vic_project", "_blank", "noopener");
        })
        .catch(() => {
          show("Напишите в VK — форма пока без почтового ящика.");
          window.open("https://vk.ru/vic_project", "_blank", "noopener");
        });
    });
  }

  document.documentElement.classList.toggle("is-vertical", isVertical());
  if (!fromHash("auto")) setChrome(0);
  else setChrome(currentIndex());
})();
