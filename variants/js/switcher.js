/**
 * Floating variant switcher — shared across all design concepts.
 */
(() => {
  "use strict";
  const path = location.pathname.replace(/\\/g, "/");
  const parts = path.split("/").filter(Boolean);
  const here = parts[parts.length - 1] || "";
  const inVariants = path.includes("/variants");
  const isHub = inVariants && (here === "variants" || here === "index.html" || here === "");
  const items = [
    { href: "../index.html", label: "Основной", id: "main" },
    { href: "index.html", label: "Хаб", id: "hub" },
    { href: "magazine.html", label: "01 Журнал", id: "magazine" },
    { href: "cinema.html", label: "02 Кино", id: "cinema" },
    { href: "glass.html", label: "03 Glass", id: "glass" },
    { href: "story.html", label: "04 Story", id: "story" },
    { href: "kinetic.html", label: "05 Kinetic", id: "kinetic" },
  ];

  const bar = document.createElement("aside");
  bar.className = "v-switch";
  bar.setAttribute("aria-label", "Варианты оформления");
  bar.innerHTML =
    '<div class="v-switch__label">Варианты</div><div class="v-switch__list"></div>';
  const list = bar.querySelector(".v-switch__list");
  items.forEach((it) => {
    const a = document.createElement("a");
    a.href = it.href;
    a.textContent = it.label;
    const on =
      (it.id === "hub" && isHub) ||
      (it.id === "main" && !inVariants) ||
      (it.href === here);
    if (on) a.classList.add("is-on");
    list.appendChild(a);
  });
  document.body.appendChild(bar);
})();
