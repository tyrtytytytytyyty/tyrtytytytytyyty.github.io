/* ── SHARED: Star canvas + nav active state ── */
(function() {
  const canvas = document.getElementById('star-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, stars = [], shooting = null, shootTimer = 0;
  const palettes = [
    [255,255,255],[210,228,255],[255,210,170],
    [170,210,255],[255,170,210],[170,255,220],
    [255,228,110],[210,170,255],[150,230,255]
  ];
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
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
    requestAnimationFrame(frame);
  }
  window.addEventListener('resize', () => { resize(); initStars(); });
  resize(); initStars(); requestAnimationFrame(frame);
})();

/* ── SHARED: Project group toggle ── */
(function() {
  const groups = document.querySelectorAll('.project-group');
  if (!groups.length) return;
  groups.forEach((group, index) => {
    const header = group.querySelector('.group-header');
    if (!header) return;
    if (index > 0) {
      group.classList.add('collapsed');
      header.setAttribute('aria-expanded', 'false');
    } else {
      header.setAttribute('aria-expanded', 'true');
    }
    header.addEventListener('click', () => {
      const isCollapsed = group.classList.toggle('collapsed');
      header.setAttribute('aria-expanded', String(!isCollapsed));
    });
  });
})();
