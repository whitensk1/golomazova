/**
 * Magazine variant: scroll-reveal, ink underlines, project reel drag, contact form.
 */
(() => {
  "use strict";

  const reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* —— Scroll reveal + ink —— */
  const reveals = document.querySelectorAll(".reveal");
  if (reduce) {
    reveals.forEach((el) => el.classList.add("is-in"));
  } else if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-in"));
  }

  /* —— Nav current section —— */
  const navLinks = Array.from(
    document.querySelectorAll('.nav a[href^="#"]:not(.nav-mark)')
  );
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  const setActive = (id) => {
    navLinks.forEach((a) => {
      a.classList.toggle("is-on", a.getAttribute("href") === "#" + id);
    });
  };

  if ("IntersectionObserver" in window && sections.length) {
    const spy = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible && visible.target.id) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -50% 0px", threshold: [0.1, 0.3, 0.6] }
    );
    sections.forEach((s) => spy.observe(s));
  }

  /* —— Horizontal project reel —— */
  const reelRoot = document.querySelector("[data-reel]");
  const view = reelRoot && reelRoot.querySelector(".reel-view");
  const track = reelRoot && reelRoot.querySelector(".reel-track");
  if (reelRoot && view && track) {
    const bar = reelRoot.querySelector("[data-reel-bar]");
    const prev = document.querySelector("[data-reel-prev]");
    const next = document.querySelector("[data-reel-next]");
    const cards = Array.from(track.querySelectorAll(".card"));

    const maxScroll = () =>
      Math.max(0, view.scrollWidth - view.clientWidth);

    const cardStep = () => {
      const card = cards[0];
      if (!card) return Math.round(view.clientWidth * 0.8);
      const styles = getComputedStyle(track);
      const gap = parseFloat(styles.columnGap || styles.gap) || 16;
      return Math.round(card.getBoundingClientRect().width + gap);
    };

    const update = () => {
      const max = maxScroll();
      const left = view.scrollLeft;
      const ratio = max > 1 ? left / max : 0;
      if (bar) bar.style.width = (8 + ratio * 92).toFixed(1) + "%";
      if (prev) prev.disabled = left <= 4;
      if (next) next.disabled = left >= max - 4;
    };

    const go = (dir) => {
      view.scrollBy({
        left: dir * cardStep(),
        behavior: reduce ? "auto" : "smooth",
      });
    };

    if (prev) prev.addEventListener("click", () => go(-1));
    if (next) next.addEventListener("click", () => go(1));
    view.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });

    view.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      }
    });

    /* Mouse drag; touch uses native pan-x */
    let dragging = false;
    let moved = false;
    let startX = 0;
    let startLeft = 0;

    view.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "touch") return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      startLeft = view.scrollLeft;
      view.classList.add("is-dragging");
      try {
        view.setPointerCapture(e.pointerId);
      } catch (_) {
        /* older Safari */
      }
    });

    view.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 3) moved = true;
      view.scrollLeft = startLeft - dx;
    });

    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      view.classList.remove("is-dragging");
      if (e && e.pointerId != null) {
        try {
          view.releasePointerCapture(e.pointerId);
        } catch (_) {
          /* already released */
        }
      }
    };

    view.addEventListener("pointerup", endDrag);
    view.addEventListener("pointercancel", endDrag);
    view.addEventListener("lostpointercapture", () => {
      dragging = false;
      view.classList.remove("is-dragging");
    });

    view.addEventListener(
      "click",
      (e) => {
        if (moved) e.preventDefault();
      },
      true
    );

    update();
  }

  /* —— Contact form (static Pages: copy + VK) —— */
  const form = document.getElementById("contact-form");
  const status = document.getElementById("cf-status");
  if (!form) return;

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
    const plain =
      "Имя: " + name + "\nКонтакт: " + contact + "\n\n" + message;

    if (MAIL_TO) {
      window.location.href =
        "mailto:" + MAIL_TO + "?subject=" + subject + "&body=" + body;
      show("Открываю почтовый клиент…");
      return;
    }

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
})();
