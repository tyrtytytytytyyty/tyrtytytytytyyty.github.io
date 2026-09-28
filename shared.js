/* ── SHARED: Star canvas + nav active state ── */
(function() {
  const canvas = document.getElementById('star-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let animation = null;
  let W, H, stars = [], shooting = null, shootTimer = 0;
  const palettes = [
    [255,255,255],[210,228,255],[255,210,170],
    [170,210,255],[255,170,210],[170,255,220],
    [255,228,110],[210,170,255],[150,230,255]
  ];
  function resize() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    W = window.innerWidth;
    H = window.innerHeight;
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function initStars() {
    stars = [];
    const n = Math.floor((W * H) / 1900);
    for (let i = 0; i < n; i++) {
      const col = palettes[Math.floor(Math.random() * palettes.length)];
      const big = Math.random() < 0.055;
      const phases = Array.from({length:3}, () => ({
        amp: 0.08 + Math.random() * 0.18,
        freq: 0.0004 + Math.random() * 0.0018,
        off: Math.random() * Math.PI * 2
      }));
      stars.push({ x: Math.random()*W, y: Math.random()*H,
        r: big ? 1.4+Math.random()*1.1 : 0.28+Math.random()*0.82,
        base: big ? 0.55+Math.random()*0.3 : 0.18+Math.random()*0.42,
        phases, r0:col[0], g0:col[1], b0:col[2], glow:big });
    }
  }
  function brightness(s,t) {
    let v = s.base;
    s.phases.forEach(p => { v += p.amp * Math.sin(p.freq*t + p.off); });
    return Math.max(0.04, Math.min(1.0, v));
  }
  function spawnShoot() {
    const col = palettes[Math.floor(Math.random()*palettes.length)];
    const fromRight = Math.random() < 0.5;
    shooting = { x: fromRight ? W+20 : Math.random()*W*0.5,
      y: Math.random()*H*0.45,
      vx: fromRight ? -(5+Math.random()*4) : (5+Math.random()*4),
      vy: 2.5+Math.random()*3, len: 110+Math.random()*80,
      life: 1, decay: 0.013+Math.random()*0.008,
      r:col[0], g:col[1], b:col[2] };
  }
  let t = 0;
  function frame() {
    animation = null;
    t += 16;
    ctx.clearRect(0,0,W,H);
    stars.forEach(s => {
      const a = brightness(s,t);
      if (s.glow) {
        const grd = ctx.createRadialGradient(s.x,s.y,0,s.x,s.y,s.r*4);
        grd.addColorStop(0,`rgba(${s.r0},${s.g0},${s.b0},${a})`);
        grd.addColorStop(0.35,`rgba(${s.r0},${s.g0},${s.b0},${a*0.28})`);
        grd.addColorStop(1,`rgba(${s.r0},${s.g0},${s.b0},0)`);
        ctx.beginPath(); ctx.arc(s.x,s.y,s.r*4,0,Math.PI*2);
        ctx.fillStyle=grd; ctx.fill();
      }
      ctx.beginPath(); ctx.arc(s.x,s.y,s.r,0,Math.PI*2);
      ctx.fillStyle=`rgba(${s.r0},${s.g0},${s.b0},${a})`; ctx.fill();
    });
    shootTimer++;
    if (shootTimer > 520 && !shooting) { spawnShoot(); shootTimer = 0; }
    if (shooting) {
      const steps = (shooting.len*shooting.life)/5.5;
      const x0 = shooting.x - shooting.vx*steps;
      const y0 = shooting.y - shooting.vy*steps;
      const grad = ctx.createLinearGradient(x0,y0,shooting.x,shooting.y);
      grad.addColorStop(0,`rgba(${shooting.r},${shooting.g},${shooting.b},0)`);
      grad.addColorStop(0.65,`rgba(${shooting.r},${shooting.g},${shooting.b},${shooting.life*0.45})`);
      grad.addColorStop(1,`rgba(${shooting.r},${shooting.g},${shooting.b},${shooting.life})`);
      ctx.beginPath(); ctx.moveTo(x0,y0); ctx.lineTo(shooting.x,shooting.y);
      ctx.strokeStyle=grad; ctx.lineWidth=1.6; ctx.stroke();
      ctx.beginPath(); ctx.arc(shooting.x,shooting.y,1.6,0,Math.PI*2);
      ctx.fillStyle=`rgba(${shooting.r},${shooting.g},${shooting.b},${shooting.life})`; ctx.fill();
      shooting.x+=shooting.vx; shooting.y+=shooting.vy; shooting.life-=shooting.decay;
      if (shooting.life<=0||shooting.x>W+60||shooting.x<-60||shooting.y>H+60) shooting=null;
    }
    if (!motion.matches && !document.hidden) animation = requestAnimationFrame(frame);
  }
  let prevW = 0;
  function handleResize() {
    resize();
    if (Math.abs(W - prevW) > 4) {
      initStars();
      prevW = W;
    }
  }
  window.addEventListener('resize', handleResize);
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', handleResize);
  }
  function updateMotion() {
    if (animation !== null) cancelAnimationFrame(animation);
    animation = null;
    frame();
  }
  motion.addEventListener('change', updateMotion);
  document.addEventListener('visibilitychange', updateMotion);
  window.addEventListener('resize', () => { if (motion.matches) updateMotion(); });
  handleResize();
  updateMotion();
})();

/* ── SHARED: Loop video N times, then show replay button ── */
(function() {
  const containers = document.querySelectorAll('.loop-video-container');
  if (!containers.length) return;
  containers.forEach((container) => {
    const video = container.querySelector('video');
    const btn = container.querySelector('.loop-replay-btn');
    if (!video || !btn) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const maxLoops = parseInt(container.dataset.loops || '5', 10);
    function respectMotion() {
      if (motion.matches) { video.autoplay = false; video.pause(); btn.classList.add('show'); }
    }
    motion.addEventListener('change', respectMotion);
    respectMotion();
    let plays = 0;
    video.addEventListener('ended', () => {
      plays++;
      if (!motion.matches && plays < maxLoops) {
        video.currentTime = 0;
        video.play().catch(() => {});
      } else {
        btn.classList.add('show');
      }
    });
    btn.addEventListener('click', () => {
      plays = 0;
      btn.classList.remove('show');
      video.currentTime = 0;
      video.play().catch(() => {});
    });
  });
})();

/* ── SHARED: Project group toggle ── */
(function() {
  const groups = document.querySelectorAll('.project-group');
  if (!groups.length) return;
  groups.forEach((group) => {
    const header = group.querySelector('.group-header');
    if (!header) return;
    group.classList.add('collapsed');
    header.setAttribute('aria-expanded', 'false');
    header.addEventListener('click', () => {
      const isCollapsed = group.classList.toggle('collapsed');
      header.setAttribute('aria-expanded', String(!isCollapsed));
    });
  });
})();

/* The active category is announced to assistive technology. */
document.querySelectorAll('.nav-tab.active').forEach(link => link.setAttribute('aria-current', 'page'));

/* Provider-neutral GymBuddy analytics; remote collection is opt-in by endpoint configuration. */
(function() {
  window.dataLayer = window.dataLayer || [];
  const query = new URLSearchParams(location.search);
  const campaign = Object.fromEntries(['utm_source', 'utm_medium', 'utm_campaign', 'utm_content']
    .flatMap(key => {
      const value = query.get(key);
      return value && /^[A-Za-z0-9_-]{1,150}$/.test(value) ? [[key, value]] : [];
    }));
  let sessionId;
  try {
    sessionId = sessionStorage.getItem('gymbuddy_analytics_session');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('gymbuddy_analytics_session', sessionId);
    }
  } catch (_) { sessionId = crypto.randomUUID(); }
  const endpoint = document.querySelector('meta[name="gymbuddy-analytics-endpoint"]')?.content.trim() || '';
  // Anonymous browser ID (no name/IP) so a second visit reads as "returning".
  let visitorId, returning = false;
  try {
    visitorId = localStorage.getItem('gymbuddy_visitor');
    returning = !!visitorId;
    if (!visitorId) { visitorId = crypto.randomUUID(); localStorage.setItem('gymbuddy_visitor', visitorId); }
  } catch (_) { visitorId = sessionId; }
  const ua = navigator.userAgent || '';
  const inApp = /Instagram/i.test(ua) ? 'instagram' : /FBAN|FBAV/i.test(ua) ? 'facebook'
    : /musical_ly|TikTok|Bytedance/i.test(ua) ? 'tiktok' : null;
  let referrerHost = null;
  try { const r = document.referrer && new URL(document.referrer); if (r && r.host !== location.host) referrerHost = r.host; } catch (_) {}
  const device = matchMedia('(pointer: coarse)').matches || innerWidth < 768 ? 'mobile' : 'desktop';
  const context = { visitor_id: visitorId, returning, in_app: inApp, referrer_host: referrerHost, device };
  // text/plain keeps this a CORS "simple" request (no preflight) and lets
  // sendBeacon deliver the last event while the page is being swiped away.
  const send = (payload) => {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon && navigator.sendBeacon(endpoint, new Blob([body], { type: 'text/plain' }))) return;
    fetch(endpoint, { method: 'POST', mode: 'cors', credentials: 'omit', keepalive: true,
      headers: { 'Content-Type': 'text/plain' }, body }).catch(() => {});
  };

  window.gymbuddyTrack = (name, detail = {}) => {
    const event = {
      event_id: crypto.randomUUID(), session_id: sessionId,
      event: name.startsWith('gymbuddy_') ? name : `gymbuddy_${name}`,
      page: location.pathname, ...campaign, ...context, ...detail
    };
    window.dataLayer.push(event);
    window.dispatchEvent(new CustomEvent('gymbuddy:analytics', { detail: event }));
    if (endpoint) send(event);
  };

  // Engaged time (only while the tab is visible) + deepest scroll, reported
  // whenever the page is hidden/closed. The collector keeps the max per session.
  if (endpoint && document.body.classList.contains('gymbuddy-page')) {
    let engaged = 0, since = document.visibilityState === 'visible' ? performance.now() : null, maxScroll = 0;
    const measureScroll = () => {
      const h = document.documentElement.scrollHeight - innerHeight;
      if (h > 0) maxScroll = Math.max(maxScroll, Math.min(100, Math.round(scrollY / h * 100)));
    };
    addEventListener('scroll', measureScroll, { passive: true });
    const flush = () => {
      if (since !== null) { engaged += performance.now() - since; since = null; }
      if (engaged > 0) window.gymbuddyTrack('engagement', { engaged_ms: Math.round(engaged), max_scroll: maxScroll });
    };
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
      else since = performance.now();
    });
    addEventListener('pagehide', flush);
  }

  document.addEventListener('click', event => {
    const link = event.target.closest('a[data-track]');
    if (!link) return;
    const url = new URL(link.href, location.href);
    if (url.hostname === 'buy.stripe.com') {
      url.searchParams.set('client_reference_id', sessionId);
      for (const [key, value] of Object.entries(campaign)) url.searchParams.set(key, value);
      link.href = url.toString();
    }
    window.gymbuddyTrack(link.dataset.track, { destination: url.hostname });
  });
})();
