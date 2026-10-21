/* Progressive, non-blocking motion. Never touches catalog data or administrator. */
(() => {
  'use strict';
  const hero = document.querySelector('.hero.elegance-motion-hero');
  if (!hero) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const revealSections = [...document.querySelectorAll('main > .section-box, main > .promo-grid, main > .trust-row')];
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.dataset.premiumReveal = 'shown';
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -6% 0px', threshold: 0.06 });
    for (const section of revealSections) {
      section.classList.add('premium-reveal');
      if (section.getBoundingClientRect().top < window.innerHeight * .94) {
        section.dataset.premiumReveal = 'shown';
      } else {
        section.dataset.premiumReveal = 'pending';
        observer.observe(section);
      }
    }
  }
  // Pointer parallax is desktop-only, compositor-only and capped at 10 CSS pixels.
  const pointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  if (!pointer.matches || reduceMotion.matches) return;
  let frame = 0;
  const setPosition = (x, y) => {
    if (frame) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      hero.style.setProperty('--hero-shift-x', x + 'px');
      hero.style.setProperty('--hero-shift-y', y + 'px');
      frame = 0;
    });
  };
  hero.addEventListener('pointermove', event => {
    if (reduceMotion.matches) return;
    const rect = hero.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = ((event.clientX - rect.left) / rect.width - .5) * -20;
    const y = ((event.clientY - rect.top) / rect.height - .5) * -14;
    setPosition(Math.round(x * 10) / 10, Math.round(y * 10) / 10);
  }, { passive: true });
  hero.addEventListener('pointerleave', () => setPosition(0, 0), { passive: true });
  reduceMotion.addEventListener?.('change', () => setPosition(0, 0));
})();
