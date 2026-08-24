/**
 * Kinetic Brutal / Type Lab — scramble, magnetic type, stamps.
 */
(() => {
  "use strict";

  const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
  const coarseMq = window.matchMedia("(pointer: coarse)");
  const reduced = () => reduceMq.matches;
  const coarse = () => coarseMq.matches;

  const GLYPHS = "АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЫЬЭЮЯ0123456789#%/*";
  const KEEP = /[\s·—\-–.,:/]/;

  /* —— Text scramble / decode —— */
  const attachScramble = (el) => {
    const original = (el.dataset.original || el.textContent || "").trim();
    el.dataset.original = original;
    const measure = () => {
      el.style.minWidth = "";
      const w = el.getBoundingClientRect().width;
      if (w > 0) el.style.minWidth = Math.ceil(w) + "px";
    };
    measure();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);

    const run = () => {
      if (reduced() || el._busy) return;
      el._busy = true;
      el.classList.add("is-scrambling");
      const chars = Array.from(original);
      const len = chars.length;
      const start = performance.now();
      const duration = Math.min(720, 42 * len + 220);

      const step = (now) => {
        if (reduced()) {
          el.textContent = original;
          el.classList.remove("is-scrambling");
          el._busy = false;
          return;
        }
        const t = Math.min(1, (now - start) / duration);
        const revealed = Math.floor(t * (len + 1));
        let out = "";
        for (let i = 0; i < len; i++) {
          const ch = chars[i];
          if (KEEP.test(ch) || i < revealed) out += ch;
          else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        el.textContent = out;
        if (t < 1) {
          el._raf = requestAnimationFrame(step);
        } else {
          el.textContent = original;
          el.classList.remove("is-scrambling");
          el._busy = false;
        }
      };
      el._raf = requestAnimationFrame(step);
    };

    el.addEventListener("pointerenter", run);
    el.addEventListener("focus", run);
  };

  document.querySelectorAll("[data-scramble]").forEach(attachScramble);

  /* —— Magnetic headings —— */
  const attachMagnetic = (el) => {
    const strength = Number(el.getAttribute("data-magnetic")) || 22;
    const state = { el, strength, tx: 0, ty: 0, cx: 0, cy: 0, hover: false, running: false };

    const loop = () => {
      if (reduced() || coarse()) {
        el.style.transform = "";
        state.running = false;
        return;
      }
      const ease = 0.16;
      state.cx += (state.tx - state.cx) * ease;
      state.cy += (state.ty - state.cy) * ease;
      el.style.transform =
        "translate3d(" + state.cx.toFixed(2) + "px," + state.cy.toFixed(2) + "px,0)";
      if (Math.abs(state.tx - state.cx) > 0.08 || Math.abs(state.ty - state.cy) > 0.08 || state.hover) {
        requestAnimationFrame(loop);
      } else {
        el.style.transform = "";
        state.running = false;
      }
    };

    el.addEventListener("pointerenter", () => {
      el.style.willChange = "transform";
    });
    el.addEventListener("pointermove", (e) => {
      if (reduced() || coarse()) return;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - (r.left + r.width / 2)) / Math.max(r.width / 2, 1);
      const y = (e.clientY - (r.top + r.height / 2)) / Math.max(r.height / 2, 1);
      state.tx = Math.max(-1, Math.min(1, x)) * state.strength;
      state.ty = Math.max(-1, Math.min(1, y)) * state.strength;
      state.hover = true;
      if (!state.running) {
        state.running = true;
        requestAnimationFrame(loop);
      }
    });
    el.addEventListener("pointerleave", () => {
      state.tx = 0;
      state.ty = 0;
      state.hover = false;
      el.style.willChange = "";
      if (!state.running) {
        state.running = true;
        requestAnimationFrame(loop);
      }
    });
  };

  document.querySelectorAll("[data-magnetic]").forEach(attachMagnetic);

  /* —— Hero spotlight follows cursor —— */
  const hero = document.querySelector(".k-hero");
  if (hero) {
    let hx = 72, hy = 38, ticking = false;
    const paint = () => {
      ticking = false;
      hero.style.setProperty("--hx", hx.toFixed(2) + "%");
      hero.style.setProperty("--hy", hy.toFixed(2) + "%");
    };
    hero.addEventListener("pointermove", (e) => {
      if (reduced() || coarse()) return;
      const r = hero.getBoundingClientRect();
      hx = ((e.clientX - r.left) / r.width) * 100;
      hy = ((e.clientY - r.top) / r.height) * 100;
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(paint);
      }
    });
  }

  /* —— Nav current section —— */
  const navLinks = Array.from(document.querySelectorAll(".k-nav-links a[href^='#']"));
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  const setOn = (id) => {
    navLinks.forEach((a) => {
      const on = a.getAttribute("href") === "#" + id;
      a.classList.toggle("is-on", on);
      if (on) a.setAttribute("aria-current", "location");
      else a.removeAttribute("aria-current");
    });
  };

  if ("IntersectionObserver" in window && sections.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (vis && vis.target.id) setOn(vis.target.id);
      },
      { rootMargin: "-28% 0px -55% 0px", threshold: [0.1, 0.25, 0.5] }
    );
    sections.forEach((s) => spy.observe(s));
  }

  /* —— Contact form (static Pages: mailto / VK) —— */
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
      const body = encodeURIComponent(
        "Имя: " + name + "\nКонтакт: " + contact + "\n\n" + message
      );
      const plain = "Имя: " + name + "\nКонтакт: " + contact + "\n\n" + message;

      if (MAIL_TO) {
        window.location.href = "mailto:" + MAIL_TO + "?subject=" + subject + "&body=" + body;
        show("Открываю почтовый клиент…");
        return;
      }

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
})();
