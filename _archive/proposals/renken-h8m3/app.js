(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* ---------- demo stages ---------- */
  const STAGES = [
    { where: 'Arrives at my server', lock: 'My server', foot: 'Exactly as the customer wrote it.', inMask: false, reply: 'hide', cloud: false, video: 0 },
    { where: 'Names and numbers swapped out', lock: 'Still my server', foot: 'The question stays. The identity goes.', inMask: true, reply: 'hide', cloud: false, video: 0 },
    { where: 'What the AI model sees', lock: 'Rented AI model', foot: 'It never learns who asked.', inMask: true, reply: 'mask', cloud: true, video: 1 },
    { where: 'Sent back to the customer', lock: 'My server', foot: 'The real details never left my server.', inMask: false, reply: 'real', cloud: false, video: 2 },
  ];

  const demo = $('#demo');
  const card = $('#card');
  const reply = $('#reply');
  const steps = $$('.step');
  const vids = $$('.demo-media video');
  const inTokens = $$('.bubble.in .tk');
  const outTokens = $$('#reply .tk');
  let stage = -1;

  function setTokens(list, masked, restored) {
    list.forEach((t) => {
      const want = masked ? t.dataset.token : t.dataset.real;
      if (t.textContent !== want) {
        t.textContent = want;
        if (!reduce) { t.classList.remove('swap'); void t.offsetWidth; t.classList.add('swap'); }
      }
      t.classList.toggle('masked', masked);
      t.classList.toggle('restored', !masked && restored);
    });
  }

  function setStage(n) {
    if (n === stage) return;
    stage = n;
    const s = STAGES[n];
    $('#where-label').textContent = s.where;
    $('#lock-label').textContent = s.lock;
    $('#card-foot').textContent = s.foot;
    card.classList.toggle('cloud', s.cloud);
    setTokens(inTokens, s.inMask, n === 3);
    reply.classList.toggle('hide', s.reply === 'hide');
    setTokens(outTokens, s.reply === 'mask', n === 3);
    steps.forEach((el, i) => { el.classList.toggle('on', i <= n); el.classList.toggle('now', i === n); });
    vids.forEach((v, i) => {
      const on = i === s.video;
      v.classList.toggle('on', on);
      if (on && demoVisible && !reduce) v.play().catch(() => {});
      else if (!on) v.pause();
    });
  }

  let demoVisible = false;
  function onScroll() {
    const r = demo.getBoundingClientRect();
    const span = demo.offsetHeight - innerHeight;
    const p = clamp(-r.top / span);
    setStage(Math.min(3, Math.floor(p * 4.0001)));
  }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  onScroll();

  /* ---------- play videos only while on screen ---------- */
  const playIfOn = (v, on) => {
    if (reduce) return;
    if (on) v.play().catch(() => {}); else v.pause();
  };
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.target === demo) {
        demoVisible = e.isIntersecting;
        vids.forEach((v) => playIfOn(v, demoVisible && v.classList.contains('on')));
      } else playIfOn(e.target, e.isIntersecting);
    }), { threshold: 0.05 });
    io.observe(demo);
    $$('video[data-lazy]').forEach((v) => io.observe(v));
    io.observe($('.hero video'));
  }
  if (reduce) $$('video').forEach((v) => { v.removeAttribute('autoplay'); v.pause(); });

  /* ---------- reveals ---------- */
  const reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !reduce) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    reveals.forEach((el, i) => { el.style.transitionDelay = `${(i % 3) * 90}ms`; io.observe(el); });
  } else reveals.forEach((el) => el.classList.add('in'));
})();
