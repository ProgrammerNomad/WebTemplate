/* ═══════════════════════════════════════════════════
   script.js  -  NexaCode Landing Page
═══════════════════════════════════════════════════ */
"use strict";

/* ─── Marquee clone (seamless loop without duplicate HTML) ─ */
(function() {
  const track = document.getElementById("marquee-track");
  if (track) {
    // Clone the items (not the track element itself) and append into the same track.
    // The CSS animation scrolls -50% so two equal sets = perfect seamless loop.
    const items = Array.from(track.children);
    items.forEach(item => {
      const clone = item.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);
    });
  }
})();

/* ─── Custom Cursor ─────────────────────────────── */
const cursor         = document.getElementById("cursor");
const cursorFollower = document.getElementById("cursor-follower");
let mx = 0, my = 0, fx = 0, fy = 0;
document.addEventListener("mousemove", e => { mx = e.clientX; my = e.clientY; });
(function animateCursor() {
  fx += (mx - fx) * 0.12;
  fy += (my - fy) * 0.12;
  if (cursor) { cursor.style.left = mx + "px"; cursor.style.top = my + "px"; }
  if (cursorFollower) { cursorFollower.style.left = fx + "px"; cursorFollower.style.top = fy + "px"; }
  requestAnimationFrame(animateCursor);
})();

/* ─── Particle Canvas ──────────────────────────── */
(function initCanvas() {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  let W, H, particles = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x  = Math.random() * W;
      this.y  = Math.random() * H;
      this.r  = Math.random() * 1.5 + 0.3;
      this.vx = (Math.random() - 0.5) * 0.4;
      this.vy = (Math.random() - 0.5) * 0.4;
      this.a  = Math.random() * 0.6 + 0.1;
      const colors = ["99,102,241","139,92,246","6,182,212","244,63,94"];
      this.color = colors[Math.floor(Math.random() * colors.length)];
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${this.color},${this.a})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < 120; i++) particles.push(new Particle());

  // draw lines between nearby particles
  function drawLines() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(99,102,241,${0.06 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function loop() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => { p.update(); p.draw(); });
    drawLines();
    requestAnimationFrame(loop);
  }
  loop();
})();

/* ─── Navbar Scroll ────────────────────────────── */
const navbar      = document.getElementById("navbar");
const navProgress = document.getElementById("nav-progress");
const backTop     = document.getElementById("back-top");

function onScroll() {
  const scrolled = window.scrollY;
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  const pct = maxScroll > 0 ? (scrolled / maxScroll) * 100 : 0;

  if (navbar) {
    navbar.classList.toggle("scrolled", scrolled > 60);
  }
  if (navProgress) navProgress.style.width = pct + "%";
  if (backTop)     backTop.classList.toggle("visible", scrolled > 400);

  // active nav link
  const sections = document.querySelectorAll("section[id]");
  sections.forEach(sec => {
    const top = sec.offsetTop - 100;
    const bot = top + sec.offsetHeight;
    if (scrolled >= top && scrolled < bot) {
      document.querySelectorAll(".nav-link").forEach(l => l.classList.remove("active"));
      const active = document.querySelector(`.nav-link[data-section="${sec.id}"]`);
      if (active) active.classList.add("active");
    }
  });
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ─── Back to Top ──────────────────────────────── */
if (backTop) {
  backTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
}

/* ─── Hamburger Menu ───────────────────────────── */
const hamburger = document.getElementById("hamburger");
const navLinks  = document.getElementById("nav-links");
if (hamburger && navLinks) {
  hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("open");
    navLinks.classList.toggle("open");
  });
  navLinks.querySelectorAll(".nav-link").forEach(l => {
    l.addEventListener("click", () => {
      hamburger.classList.remove("open");
      navLinks.classList.remove("open");
    });
  });
}

/* ─── Scroll Reveal ────────────────────────────── */
const revealEls = document.querySelectorAll(".reveal-up, .reveal-left, .reveal-right");
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add("visible");
      revealObs.unobserve(e.target);
    }
  });
}, { threshold: 0.1, rootMargin: "0px 0px -60px 0px" });
revealEls.forEach(el => revealObs.observe(el));

/* ─── Counter Animation ────────────────────────── */
function animateCounter(el) {
  const target = parseInt(el.dataset.count, 10);
  const duration = 1800;
  const step = 16;
  const steps = duration / step;
  let count = 0;
  const increment = target / steps;
  const timer = setInterval(() => {
    count += increment;
    if (count >= target) {
      count = target;
      clearInterval(timer);
    }
    el.textContent = Math.floor(count);
  }, step);
}
const counterObs = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.querySelectorAll(".stat-num[data-count]").forEach(animateCounter);
      counterObs.unobserve(e.target);
    }
  });
}, { threshold: 0.4 });
const heroStats = document.querySelector(".hero-stats");
if (heroStats) counterObs.observe(heroStats);

/* ─── Portfolio Filter ─────────────────────────── */
const filterBtns = document.querySelectorAll(".filter-btn");
const workCards  = document.querySelectorAll(".work-card");

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const filter = btn.dataset.filter;
    workCards.forEach(card => {
      if (filter === "all" || card.dataset.category === filter) {
        card.style.display = "";
        card.classList.remove("filtered");
      } else {
        card.classList.add("filtered");
        card.style.display = "none";
      }
    });
  });
});

/* ─── Testimonial Slider ───────────────────────── */
(function initSlider() {
  const slider = document.getElementById("testi-slider");
  const track  = document.getElementById("testi-track");
  const prev   = document.getElementById("testi-prev");
  const next   = document.getElementById("testi-next");
  const dots   = document.querySelectorAll(".testi-dot");
  if (!track || !slider) return;

  const cards   = Array.from(track.querySelectorAll(".testi-card"));
  const total   = cards.length;
  const GAP     = 24; // must match CSS gap on .testi-track
  let current   = 0;
  let autoTimer = null;

  function getVisible() {
    return window.innerWidth < 768 ? 1 : 2;
  }

  // Set each card's pixel width so they exactly fill the slider viewport
  function setCardWidths() {
    const visible = getVisible();
    const sliderW = slider.offsetWidth;
    const cardW   = (sliderW - GAP * (visible - 1)) / visible;
    cards.forEach(c => { c.style.width = cardW + "px"; });
  }

  function go(idx) {
    const visible = getVisible();
    const maxIdx  = total - visible;
    current = Math.max(0, Math.min(idx, maxIdx));
    // step = one card width + one gap
    const cardW = cards[0].offsetWidth;
    track.style.transform = `translateX(-${current * (cardW + GAP)}px)`;
    dots.forEach((d, i) => d.classList.toggle("active", i === current));
  }

  function init() {
    setCardWidths();
    go(current);
  }

  if (prev) prev.addEventListener("click", () => { clearInterval(autoTimer); go(current - 1); startAuto(); });
  if (next) next.addEventListener("click", () => { clearInterval(autoTimer); go(current + 1); startAuto(); });
  dots.forEach((d, i) => d.addEventListener("click", () => { clearInterval(autoTimer); go(i); startAuto(); }));

  function startAuto() {
    autoTimer = setInterval(() => {
      const visible = getVisible();
      go(current + 1 > total - visible ? 0 : current + 1);
    }, 5000);
  }

  init();
  startAuto();
  window.addEventListener("resize", () => { clearInterval(autoTimer); current = 0; init(); startAuto(); });
})();

/* ─── Contact Form (shared handler for both forms) ──── */
(function initForms() {
  function bindForm(formId, successId) {
    const form    = document.getElementById(formId);
    const success = document.getElementById(successId);
    if (!form) return;
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn     = form.querySelector(".submit-btn");
      const btnText = btn.querySelector(".btn-text");
      const btnLoad = btn.querySelector(".btn-loading");
      btnText.style.display = "none";
      btnLoad.style.display = "inline";
      btn.disabled = true;
      await new Promise(r => setTimeout(r, 1600));
      btn.style.display = "none";
      if (success) success.style.display = "block";
      form.reset();
    });
  }
  bindForm("hero-contact-form", "hero-form-success");
  bindForm("contact-form",      "form-success");
})();

/* ─── Smooth Scroll for all anchor links ────────── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener("click", e => {
    const target = document.querySelector(a.getAttribute("href"));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});
