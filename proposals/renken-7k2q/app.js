(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* ---------- example conversations (illustrative) ---------- */
  const SCRIPTS = {
    ttc: {
      steps: [
        [{ t: 'in', x: 'Hey, is Flight Alerts included with the Passport?' }],
        [{ t: 'meta', x: 'Delivered by text' }],
        [{ t: 'out', x: 'Yes. Full Flight Alerts access comes with the Passport at no extra cost. On its own it runs $29.99 a year. Want the link to set up your first alert?' }],
        [
          { t: 'in', x: 'Nice. Separate thing: can I get a refund on my Cozumel trip? Something came up.' },
          { t: 'out', x: "Trip refunds are John's call, so I've sent him your trip and dates. He'll text you back here." },
        ],
      ],
      handoff: 'Refund request on the Cozumel trip. Full thread attached.',
    },
    mdl: {
      steps: [
        [{ t: 'in', x: "I'm at the dock in Cozumel and left my cert card at the hotel. Can the shop check it from my phone?" }],
        [{ t: 'meta', x: 'Delivered by text' }],
        [{ t: 'out', x: 'Yes. Open My Dive Locker and tap Fast Pass. The shop scans your QR code and sees your certs, insurance and waiver. No card needed.' }],
        [
          { t: 'in', x: 'Perfect. Also, I think I got charged twice for Solo this year.' },
          { t: 'out', x: "I can't change billing myself, so I've sent this to John with your account details. He'll text you back here." },
        ],
      ],
      handoff: 'Billing question on a Solo plan. The member reports a double charge. Full thread attached.',
    },
  };

  const thread = $('#thread');
  const handoff = $('#handoff');
  const handoffText = $('#handoff-text');
  let brand = root.dataset.brand || 'ttc';
  let shownStep = -1;
  let timers = [];

  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
  const bubble = (m) => {
    const d = document.createElement('div');
    d.className = 'msg ' + m.t;
    d.textContent = m.x;
    return d;
  };
  const typing = () => {
    const d = document.createElement('div');
    d.className = 'typing';
    d.innerHTML = '<i></i><i></i><i></i>';
    return d;
  };

  function renderInstant(step) {
    clearTimers();
    thread.replaceChildren();
    const s = SCRIPTS[brand];
    for (let i = 0; i <= step; i++) s.steps[i].forEach((m) => thread.appendChild(bubble(m)));
    handoffText.textContent = s.handoff;
    handoff.classList.toggle('show', step >= 3);
    shownStep = step;
  }

  function advance(to) {
    if (reduce || to < shownStep || shownStep < 0 && to > 0) { renderInstant(to); return; }
    clearTimers();
    const s = SCRIPTS[brand];
    let delay = 0;
    for (let i = shownStep + 1; i <= to; i++) {
      s.steps[i].forEach((m) => {
        if (m.t === 'out') {
          let dots;
          timers.push(setTimeout(() => { dots = typing(); thread.appendChild(dots); }, delay));
          delay += 850;
          timers.push(setTimeout(() => { dots && dots.remove(); thread.appendChild(bubble(m)); }, delay));
        } else {
          timers.push(setTimeout(() => thread.appendChild(bubble(m)), delay));
        }
        delay += 380;
      });
      if (i === 3) {
        handoffText.textContent = s.handoff;
        timers.push(setTimeout(() => handoff.classList.add('show'), delay + 250));
      }
    }
    if (to < 3) handoff.classList.remove('show');
    shownStep = to;
  }

  /* ---------- brand switch ---------- */
  const themeMeta = $('meta[name="theme-color"]');
  $$('.switch button').forEach((b) => b.addEventListener('click', () => {
    brand = b.dataset.set;
    root.dataset.brand = brand;
    $$('.switch button').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    renderInstant(Math.max(shownStep, 0));
    themeMeta && themeMeta.setAttribute('content', '#010f18');
  }));

  /* ---------- scroll-driven scenes ---------- */
  const heroBg = $('.hero-bg');
  const gaugeFill = $('.gauge-fill');
  const gaugeDot = $('.gauge-dot');
  const depthEl = $('#depth');
  const pipeline = $('#pipeline');
  const steps = $$('.step');
  const plBar = $('.pl-progress span');
  const stack = $('#stack');
  const plates = $('#plates');
  const buildPlates = $$('.plate.build');
  const layerRows = $$('.layers li');

  const sectionProgress = (el) => {
    const r = el.getBoundingClientRect();
    return clamp(-r.top / (r.height - innerHeight));
  };

  let currentStep = -1;
  function frame() {
    ticking = false;
    const y = scrollY;
    const docP = clamp(y / (document.documentElement.scrollHeight - innerHeight));

    if (!reduce && y < innerHeight * 1.2) heroBg.style.transform = `translate3d(0, ${y * 0.28}px, 0) scale(${1 + y * 0.00012})`;

    const trackH = gaugeFill.parentElement.clientHeight;
    gaugeFill.style.height = `${docP * 100}%`;
    gaugeDot.style.transform = `translateY(${docP * (trackH - 9)}px)`;
    depthEl.textContent = Math.round(docP * 30);

    const p = sectionProgress(pipeline);
    const step = p < 0.2 ? 0 : p < 0.42 ? 1 : p < 0.64 ? 2 : 3;
    plBar.style.width = `${p * 100}%`;
    const inView = pipeline.getBoundingClientRect().top < innerHeight * 0.6;
    const target = inView ? step : -1;
    if (target !== currentStep) {
      currentStep = target;
      steps.forEach((s, i) => { s.classList.toggle('on', i <= target); s.classList.toggle('now', i === target); });
      if (target >= 0) advance(target);
    }

    const sp = clamp((sectionProgress(stack) - 0.05) / 0.65);
    const eased = reduce ? 1 : 1 - Math.pow(1 - sp, 3);
    plates.style.setProperty('--p', eased.toFixed(3));
    const lit = sp > 0.55;
    buildPlates.forEach((pl) => pl.classList.toggle('lit', lit));
    layerRows.forEach((li) => { li.style.opacity = !lit || li.classList.contains('build') ? 1 : 0.5; });
  }
  let ticking = false;
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  frame();

  /* ---------- plate tilt ---------- */
  const vis = $('.st-visual');
  if (!reduce && matchMedia('(pointer: fine)').matches) {
    vis.addEventListener('pointermove', (e) => {
      const r = vis.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      plates.style.setProperty('--rz', `${nx * 16}deg`);
      plates.style.setProperty('--rx', `${ny * -10}deg`);
    });
    vis.addEventListener('pointerleave', () => { plates.style.setProperty('--rz', '0deg'); plates.style.setProperty('--rx', '0deg'); });
  }

  /* ---------- reveals ---------- */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { rootMargin: '0px 0px -10% 0px' });
    reveals.forEach((el, i) => { el.style.transitionDelay = `${(i % 3) * 90}ms`; io.observe(el); });
  } else reveals.forEach((el) => el.classList.add('in'));

  /* ---------- marine snow ---------- */
  const cv = $('.snow');
  const ctx = cv.getContext('2d');
  let W = 0, H = 0, dots = [], heroVisible = true;
  const size = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = cv.clientWidth; H = cv.clientHeight;
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.round(Math.min(70, W / 22));
    dots = Array.from({ length: n }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      r: 0.5 + Math.random() * 1.4, a: 0.12 + Math.random() * 0.35,
      vy: 0.08 + Math.random() * 0.22, ph: Math.random() * 6.28,
    }));
  };
  const draw = (t) => {
    ctx.clearRect(0, 0, W, H);
    for (const d of dots) {
      if (!reduce) {
        d.y += d.vy; d.x += Math.sin(t / 2400 + d.ph) * 0.12;
        if (d.y > H + 4) { d.y = -4; d.x = Math.random() * W; }
      }
      ctx.globalAlpha = d.a * clamp(1.15 - d.y / H);
      ctx.fillStyle = '#cfefff';
      ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, 6.283); ctx.fill();
    }
  };
  const loop = (t) => { if (heroVisible) draw(t); requestAnimationFrame(loop); };
  size(); addEventListener('resize', size);
  if (reduce) draw(0); else requestAnimationFrame(loop);
  if ('IntersectionObserver' in window) new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; }).observe(cv);
})();
