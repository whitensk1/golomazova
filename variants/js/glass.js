/**
 * Glass OS — 3D tilt, magnetic CTAs, dock spy, contact.
 * Motion is skipped when the user prefers reduced movement
 * or the pointer is not fine (touch / pen).
 */
(() => {
  "use strict";

  const reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine =
    window.matchMedia && window.matchMedia("(pointer: fine)").matches;

  const dateEl = document.getElementById("os-date");
  if (dateEl) {
    try {
      const text = new Intl.DateTimeFormat("ru-RU", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date());
      dateEl.textContent = text.charAt(0).toUpperCase() + text.slice(1);
    } catch (_) {
      /* keep markup fallback */
    }
  }

  const links = Array.from(document.querySelectorAll(".dock-item[href^='#']"));
  const map = new Map();
  links.forEach((a) => {
    const id = (a.getAttribute("href") || "").slice(1);
    const sec = id ? document.getElementById(id) : null;
    if (sec) map.set(sec, a);
  });

  const setOn = (el) => {
    links.forEach((a) => {
      const on = a === el;
      a.classList.toggle("is-on", on);
      if (on) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  };

  if ("IntersectionObserver" in window && map.size) {
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (vis && map.get(vis.target)) setOn(map.get(vis.target));
      },
      { rootMargin: "-28% 0px -48% 0px", threshold: [0, 0.12, 0.35, 0.6] }
    );
    map.forEach((_, sec) => io.observe(sec));
  }

  const tiltEls = Array.from(document.querySelectorAll("[data-tilt]"));
  if (!reduce && fine && tiltEls.length) {
    tiltEls.forEach((el) => {
      const max = Number(el.getAttribute("data-tilt")) || 8;
      let raf = 0;
      let px = 0.5;
      let py = 0.5;
      let inside = false;

      const apply = () => {
        raf = 0;
        if (!inside) return;
        const rx = (0.5 - py) * max;
        const ry = (px - 0.5) * max;
        el.style.transform =
          "perspective(1100px) rotateX(" +
          rx.toFixed(2) +
          "deg) rotateY(" +
          ry.toFixed(2) +
          "deg)";
        el.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
        el.style.setProperty("--my", (py * 100).toFixed(1) + "%");
      };

      el.addEventListener(
        "pointermove",
        (e) => {
          if (e.pointerType !== "mouse") return;
          const r = el.getBoundingClientRect();
          px = (e.clientX - r.left) / Math.max(1, r.width);
          py = (e.clientY - r.top) / Math.max(1, r.height);
          inside = true;
          if (!raf) raf = requestAnimationFrame(apply);
        },
        { passive: true }
      );

      const reset = () => {
        inside = false;
        el.style.transform = "";
        el.style.removeProperty("--mx");
        el.style.removeProperty("--my");
      };
      el.addEventListener("pointerleave", reset);
      el.addEventListener("pointercancel", reset);
    });
  }

  const mags = Array.from(document.querySelectorAll("[data-magnetic]"));
  if (!reduce && fine && mags.length) {
    mags.forEach((el) => {
      const strength = 0.34;
      const cap = 14;
      let raf = 0;
      let tx = 0;
      let ty = 0;
      let inside = false;

      const apply = () => {
        raf = 0;
        if (!inside) return;
        el.style.transform =
          "translate(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px)";
      };

      el.addEventListener(
        "pointermove",
        (e) => {
          if (e.pointerType !== "mouse") return;
          const r = el.getBoundingClientRect();
          const dx = e.clientX - (r.left + r.width / 2);
          const dy = e.clientY - (r.top + r.height / 2);
          tx = Math.max(-cap, Math.min(cap, dx * strength));
          ty = Math.max(-cap, Math.min(cap, dy * strength));
          inside = true;
          if (!raf) raf = requestAnimationFrame(apply);
        },
        { passive: true }
      );

      const reset = () => {
        inside = false;
        el.style.transform = "";
      };
      el.addEventListener("pointerleave", reset);
      el.addEventListener("pointercancel", reset);
    });
  }

  const form = document.getElementById("contact-form");
  const status = document.getElementById("cf-status");
  if (form) {
    const MAIL_TO = "";
    const show = (text, isError) => {
      if (!status) return;
      status.textContent = text;
      status.classList.add("is-on");
      status.classList.toggle("is-error", !!isError);
    };

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
        window.location.href =
          "mailto:" + MAIL_TO + "?subject=" + subject + "&body=" + body;
        show("Открываю почтовый клиент…");
        return;
      }

      const plain =
        "Имя: " + name + "\nКонтакт: " + contact + "\n\n" + message;
      const copy = () => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          return navigator.clipboard.writeText(plain);
        }
        return Promise.reject();
      };
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
