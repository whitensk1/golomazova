/**
 * Cinematic night — spotlight, Ken Burns, chapter fades, form.
 */
(() => {
  "use strict";

  const reduceMq = window.matchMedia
    ? window.matchMedia("(prefers-reduced-motion: reduce)")
    : { matches: false, addEventListener() {} };
  let reduce = !!reduceMq.matches;
  if (reduce) document.documentElement.classList.add("is-reduce");
  reduceMq.addEventListener?.("change", (e) => {
    reduce = e.matches;
    document.documentElement.classList.toggle("is-reduce", reduce);
  });

  const finePointer = window.matchMedia
    ? window.matchMedia("(hover: hover) and (pointer: fine)").matches
    : window.innerWidth > 900;

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* —— Film grain (static tile, optional flicker) —— */
  const grain = document.getElementById("grain");
  if (grain && grain.getContext) {
    const g = document.createElement("canvas");
    g.width = 160;
    g.height = 160;
    const gx = g.getContext("2d");
    const img = gx.createImageData(160, 160);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 90 + Math.random() * 80;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    gx.putImageData(img, 0, 0);
    const ctx = grain.getContext("2d");
    const paint = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      grain.width = Math.max(1, Math.floor(w * dpr));
      grain.height = Math.max(1, Math.floor(h * dpr));
      grain.style.width = w + "px";
      grain.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const pat = ctx.createPattern(g, "repeat");
      ctx.globalAlpha = 1;
      ctx.fillStyle = pat;
      ctx.fillRect(0, 0, w, h);
    };
    paint();
    window.addEventListener("resize", paint, { passive: true });
  }

  /* —— Pointer / spotlight / cursor —— */
  const stage = document.getElementById("spot-stage");
  const portrait = document.getElementById("portrait");
  const rim = portrait ? portrait.querySelector(".portrait__rim") : null;
  const cursor = document.querySelector(".cursor");

  let mx = 0.62;
  let my = 0.32;
  let tx = mx;
  let ty = my;
  let cx = window.innerWidth * 0.7;
  let cy = window.innerHeight * 0.4;
  let cxt = cx;
  let cyt = cy;
  let hot = false;
  let hasPointer = false;

  if (finePointer && cursor && !reduce) {
    document.body.classList.add("has-cursor");
  }

  const onMove = (e) => {
    hasPointer = true;
    cxt = e.clientX;
    cyt = e.clientY;
    const t = e.target;
    hot = !!(t && t.closest && t.closest("a, button, .pill, .frame, .social-btn"));
    if (!stage) return;
    const r = stage.getBoundingClientRect();
    if (r.width < 8 || r.height < 8) return;
    mx = clamp((e.clientX - r.left) / r.width, 0, 1);
    my = clamp((e.clientY - r.top) / r.height, 0, 1);
  };

  window.addEventListener("pointermove", onMove, { passive: true });
  window.addEventListener(
    "pointerdown",
    (e) => {
      if (e.pointerType === "touch") onMove(e);
    },
    { passive: true }
  );
  document.addEventListener("mouseleave", () => {
    hasPointer = false;
  });

  /* —— Chapters —— */
  const chapters = Array.from(document.querySelectorAll("[data-chapter]"));
  const navLinks = Array.from(document.querySelectorAll("[data-nav]"));
  const takeId = document.getElementById("take-id");
  const takeName = document.getElementById("take-name");
  const fades = Array.from(document.querySelectorAll(".js-fade"));
  let activeChapter = "";

  const setChapter = (id, n, label) => {
    if (id === activeChapter) return;
    activeChapter = id;
    document.body.dataset.chapter = id;
    navLinks.forEach((a) => {
      a.classList.toggle("is-on", a.getAttribute("data-nav") === id);
    });
    if (takeId) takeId.textContent = n || "01";
    if (takeName) takeName.textContent = label || "";
  };

  const sceneOpacity = (el) => {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight || 800;
    const top = r.top;
    const bot = r.bottom;
    if (bot <= 0 || top >= vh) return 0;
    const fadeIn = clamp(1 - top / (vh * 0.42), 0, 1);
    const fadeOut = clamp((bot - vh * 0.12) / (vh * 0.5), 0, 1);
    return Math.min(fadeIn, fadeOut);
  };

  const updateScenes = () => {
    const vh = window.innerHeight || 800;
    let best = chapters[0];
    let bestScore = -1;
    chapters.forEach((ch) => {
      const r = ch.getBoundingClientRect();
      const visible = Math.min(r.bottom, vh) - Math.max(r.top, 0);
      const score = visible / Math.max(1, Math.min(r.height, vh));
      if (score > bestScore) {
        bestScore = score;
        best = ch;
      }
    });
    if (best) {
      setChapter(best.dataset.chapter, best.dataset.n, best.dataset.label);
    }

    fades.forEach((el) => {
      if (reduce) {
        el.style.opacity = "1";
        el.style.transform = "none";
        return;
      }
      const o = sceneOpacity(el);
      el.style.opacity = o.toFixed(3);
      el.style.transform = "translate3d(0," + ((1 - o) * 18).toFixed(1) + "px,0)";
    });

    document.body.classList.toggle("is-scrolled", (window.pageYOffset || 0) > 40);

    if (portrait && !reduce) {
      const intro = document.getElementById("intro");
      if (intro) {
        const ir = intro.getBoundingClientRect();
        const p = clamp(-ir.top / Math.max(intro.offsetHeight, 1), 0, 1);
        if (stage) {
          stage.style.transform = "translate3d(0," + (p * 22).toFixed(1) + "px,0)";
        }
      }
    }
  };

  const frames = Array.from(document.querySelectorAll(".frame"));
  const updateFrames = () => {
    const vh = window.innerHeight || 800;
    frames.forEach((fr) => {
      const r = fr.getBoundingClientRect();
      const mid = r.top + r.height * 0.45;
      const on = mid > vh * 0.12 && mid < vh * 0.78;
      fr.classList.toggle("is-on", on);
    });
  };

  /* —— Magnetic buttons —— */
  const magnets = finePointer
    ? Array.from(document.querySelectorAll(".js-magnet"))
    : [];
  const magnetTick = () => {
    if (reduce || !hasPointer) return;
    magnets.forEach((el) => {
      const r = el.getBoundingClientRect();
      const cx0 = r.left + r.width / 2;
      const cy0 = r.top + r.height / 2;
      const dx = cxt - cx0;
      const dy = cyt - cy0;
      const dist = Math.hypot(dx, dy);
      if (dist < 90) {
        const t = (1 - dist / 90) * 8;
        el.style.transform = "translate(" + (dx / 12) * (t / 8) + "px," + (dy / 12) * (t / 8) + "px)";
      } else {
        el.style.transform = "";
      }
    });
  };

  /* —— rAF loop —— */
  let ticking = false;
  const loop = () => {
    ticking = false;
    const k = reduce ? 1 : 0.085;
    tx = lerp(tx, mx, k);
    ty = lerp(ty, my, k);
    if (stage) {
      stage.style.setProperty("--spot-x", (tx * 100).toFixed(2) + "%");
      stage.style.setProperty("--spot-y", (ty * 100).toFixed(2) + "%");
      if (hasPointer && !reduce) {
        const r = stage.getBoundingClientRect();
        const over =
          cxt >= r.left && cxt <= r.right && cyt >= r.top && cyt <= r.bottom;
        stage.style.setProperty("--spot-r", over ? "48%" : "36%");
      }
    }
    if (rim && finePointer && !reduce && hasPointer) {
      const rx = (ty - 0.5) * -7;
      const ry = (tx - 0.5) * 9;
      rim.style.transform = "rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg)";
    } else if (rim) {
      rim.style.transform = "";
    }

    if (cursor && document.body.classList.contains("has-cursor")) {
      cursor.style.opacity = hasPointer ? "1" : "0";
      cx = lerp(cx, cxt, reduce ? 1 : 0.22);
      cy = lerp(cy, cyt, reduce ? 1 : 0.22);
      cursor.style.transform = "translate(" + cx.toFixed(1) + "px," + cy.toFixed(1) + "px)";
      cursor.classList.toggle("is-hot", hot);
    }

    updateScenes();
    updateFrames();
    magnetTick();
  };

  const requestLoop = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(loop);
  };

  window.addEventListener("scroll", requestLoop, { passive: true });
  window.addEventListener("resize", requestLoop, { passive: true });
  requestAnimationFrame(loop);

  let idleOn = !reduce;
  if (!reduce) {
    const idle = () => {
      if (!idleOn) return;
      if (!document.hidden) requestLoop();
      requestAnimationFrame(idle);
    };
    requestAnimationFrame(idle);
  }
  document.addEventListener("visibilitychange", () => {
    idleOn = !reduce && !document.hidden;
  });

  /* —— Contact form (static Pages: mailto / VK) —— */
  const form = document.getElementById("contact-form");
  const status = document.getElementById("cf-status");
  const MAIL_TO = "";
  const show = (text, isError) => {
    if (!status) return;
    status.textContent = text;
    status.classList.add("is-on");
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
})();
