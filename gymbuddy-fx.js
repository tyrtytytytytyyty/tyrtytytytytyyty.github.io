/* GymBuddy motion layer: chalk particles, 3D tilt, scroll reveals.
   Separate from gymbuddy-scroll.js on purpose — nothing here touches step state. */
(() => {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* Scroll reveals: sections rise in once as they enter the viewport. */
  const revealTargets = document.querySelectorAll(
    ".gb-story-intro, .gb-section-head, .gb-join-step, .gb-price-card, .gb-faq details, .gb-kettlebell"
  );
  if (!reduceMotion && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.12 });
    revealTargets.forEach((el, i) => {
      el.classList.add("gb-reveal");
      el.style.setProperty("--gb-reveal-delay", `${(i % 4) * 70}ms`);
      observer.observe(el);
    });
  }

  /* 3D tilt: the phone follows the cursor; raised cards lean toward it. */
  function tilt(el, maxDeg, { glare = false, scope = el } = {}) {
    let frame = 0;
    const apply = (x, y) => {
      el.style.setProperty("--gb-rx", `${(-y * maxDeg).toFixed(2)}deg`);
      el.style.setProperty("--gb-ry", `${(x * maxDeg).toFixed(2)}deg`);
      if (glare) {
        el.style.setProperty("--gb-gx", `${(50 + x * 50).toFixed(1)}%`);
        el.style.setProperty("--gb-gy", `${(50 + y * 50).toFixed(1)}%`);
      }
    };
    scope.addEventListener("pointermove", (event) => {
      const rect = el.getBoundingClientRect();
      const x = Math.max(-1, Math.min(1, ((event.clientX - rect.left) / rect.width - 0.5) * 2));
      const y = Math.max(-1, Math.min(1, ((event.clientY - rect.top) / rect.height - 0.5) * 2));
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => apply(x, y));
      el.classList.add("is-tilting");
    });
    scope.addEventListener("pointerleave", () => {
      cancelAnimationFrame(frame);
      el.classList.remove("is-tilting");
      apply(0, 0);
    });
  }

  if (finePointer && !reduceMotion) {
    const phone = document.querySelector(".gb-phone-frame");
    const walkthrough = document.querySelector(".gb-walkthrough");
    if (phone && walkthrough) tilt(phone, 9, { scope: walkthrough });
    document.querySelectorAll(".gb-price-card, .gb-founder-card").forEach((card) => tilt(card, 5, { glare: true }));
  }

  /* Phone demo: an illustrative iMessage thread that follows the active step.
     Demo numbers only — never a real member's data. Watches the classes that
     gymbuddy-scroll.js sets instead of hooking into it. */
  const screen = document.getElementById("gb-phone-screen");
  const storySteps = Array.from(document.querySelectorAll(".gb-story-step"));
  const THREADS = {
    "01": [
      ["out", "bench 185 for 5"],
      ["in", "▲ Logged: bench press, 185 × 5. That's set 1."],
      ["out", "pull-ups bodyweight x8"],
      ["in", "▲ Logged: pull-ups, bodyweight × 8."]
    ],
    "02": [
      ["out", "bench 185 for 5"],
      ["in", "▲ Logged: set 2. Rest timer's on — I'll text you when it's up."],
      ["timer", 150],
      ["in", "▲ Rest's up. Set 3 when you're ready."]
    ],
    "03": [
      ["out", "how's my bench looking?"],
      ["in", "▲ Trending up. 175 × 5 three weeks ago, 180 × 5 last week, 185 × 5 today — all from sets you logged."]
    ],
    "04": [
      ["photo", "gymbuddy-demo-meal.jpg"],
      ["out", "lunch"],
      ["in", "▲ Rough estimate from the photo: ~45 g protein, ~600 cal. Treat it as an estimate, not a measurement."]
    ]
  };

  if (screen && storySteps.length) {
    screen.innerHTML = `
      <div class="gb-im">
        <div class="gb-im-status"><span>9:41</span><span class="gb-im-icons"><i></i><i></i><i></i></span></div>
        <div class="gb-im-head"><span class="gb-im-avatar">GB</span><span class="gb-im-name">Gymbuddy AI</span></div>
        <div class="gb-im-thread"></div>
        <div class="gb-im-input"><span class="gb-im-plus">+</span><span class="gb-im-field">iMessage</span></div>
      </div>`;
    const thread = screen.querySelector(".gb-im-thread");
    let run = 0;
    let timerId = 0;
    const wait = (ms) => new Promise((resolve) => setTimeout(resolve, reduceMotion ? 0 : ms));
    const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

    function bubble(kind, value) {
      const el = document.createElement("div");
      if (kind === "photo") {
        el.className = "gb-im-msg gb-im-out gb-im-photo";
        el.innerHTML = `<img src="${value}" alt="" loading="lazy">`;
      } else if (kind === "timer") {
        el.className = "gb-im-msg gb-im-in gb-im-timer";
        el.innerHTML = `<span class="gb-im-ring"></span><span class="gb-im-clock">${clock(value)}</span>`;
        let left = value;
        clearInterval(timerId);
        timerId = setInterval(() => {
          left = Math.max(0, left - 1);
          el.querySelector(".gb-im-clock").textContent = clock(left);
        }, 1000);
      } else {
        el.className = `gb-im-msg gb-im-${kind}`;
        el.textContent = value;
      }
      thread.appendChild(el);
      requestAnimationFrame(() => el.classList.add("is-in"));
      return el;
    }

    async function play(key) {
      const id = ++run;
      clearInterval(timerId);
      thread.replaceChildren();
      for (const [kind, value] of THREADS[key] || []) {
        if (kind === "in" || kind === "timer") {
          const typing = bubble("typing", "");
          typing.innerHTML = "<i></i><i></i><i></i>";
          await wait(750);
          typing.remove();
          if (id !== run) return;
        }
        bubble(kind, value);
        await wait(kind === "out" || kind === "photo" ? 450 : 900);
        if (id !== run) return;
      }
    }

    let current = "";
    const sync = () => {
      const active = storySteps.find((s) => s.classList.contains("is-active"));
      const key = active?.dataset.gbStep || "01";
      if (key === current) return;
      current = key;
      play(key);
    };
    const watcher = new MutationObserver(sync);
    storySteps.forEach((s) => watcher.observe(s, { attributes: true, attributeFilter: ["class"] }));
    sync();
  }

  /* Chalk particles drifting up through the light behind the phone. */
  const canvas = document.querySelector(".gb-chalk");
  const stage = document.querySelector(".gb-phone-stage");
  if (!canvas || !stage || reduceMotion) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let running = false;
  let visible = true;
  let last = 0;

  function spawn(initial) {
    const depth = Math.random();
    return {
      x: width * (0.25 + Math.random() * 0.7),
      y: initial ? Math.random() * height : height * (0.75 + Math.random() * 0.3),
      r: 0.4 + depth * 1.5,
      vy: -(6 + depth * 16),
      drift: (Math.random() - 0.5) * 8,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.18 + depth * 0.5,
      life: 0,
      span: 7 + Math.random() * 9
    };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = rect.width;
    height = rect.height;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = Math.round(Math.min(90, (width * height) / 5200));
    particles = Array.from({ length: count }, () => spawn(true));
  }

  function step(now) {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.life += dt;
      p.phase += dt * 0.8;
      p.y += p.vy * dt;
      p.x += (p.drift + Math.sin(p.phase) * 6) * dt;
      const fade = Math.min(1, p.life / 1.5) * Math.max(0, 1 - p.life / p.span);
      if (p.y < -10 || fade <= 0 && p.life > 1) {
        particles[i] = spawn(false);
        continue;
      }
      /* brighter inside the light shaft (upper right), dimmer at the edges */
      const shaft = 1 - Math.min(1, Math.abs(p.x / width - 0.62) * 1.9);
      ctx.globalAlpha = p.alpha * fade * (0.35 + shaft * 0.65);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = "#f3f1ea";
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(step);
  }

  function setRunning(next) {
    if (next === running) return;
    running = next;
    if (running) {
      last = performance.now();
      requestAnimationFrame(step);
    }
  }

  resize();
  /* iOS fires resize when the URL bar shows/hides; only rebuild on a real width change. */
  let lastWidth = window.innerWidth;
  window.addEventListener("resize", () => {
    if (window.innerWidth === lastWidth) return;
    lastWidth = window.innerWidth;
    resize();
  }, { passive: true });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      setRunning(visible && !document.hidden);
    }).observe(stage);
  }
  document.addEventListener("visibilitychange", () => setRunning(visible && !document.hidden));
  setRunning(true);
})();
