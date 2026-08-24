/**
 * Parallax: text leaves faster; portrait object lingers, then fades.
 */
(() => {
  "use strict";
  const figure = document.querySelector('[data-parallax="figure"]');
  const copy = document.querySelector('[data-parallax="copy"]');
  if (!figure || !copy) return;

  const reduce =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) return;

  let ticking = false;

  const update = () => {
    ticking = false;
    const y = window.pageYOffset || document.documentElement.scrollTop || 0;
    const vh = window.innerHeight || 800;

    // Text: moves away quicker + fades
    const copyY = y * 0.55;
    const copyFade = Math.max(0, 1 - y / (vh * 0.65));
    copy.style.transform = "translate3d(0," + copyY.toFixed(1) + "px,0)";
    copy.style.opacity = String(copyFade);

    // Portrait object: slower drift, fades later
    const figY = y * 0.22;
    const figFade = Math.max(0, 1 - y / (vh * 1.15));
    figure.style.transform = "translate3d(0," + figY.toFixed(1) + "px,0)";
    figure.style.opacity = String(figFade);
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();
})();
