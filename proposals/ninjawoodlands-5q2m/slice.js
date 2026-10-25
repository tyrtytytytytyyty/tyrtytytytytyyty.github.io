// The shuriken slice (his pick from v1, kept on 10/25): a 3D star is thrown across the screen,
// once to cut the black open on arrival, then across each heading as it scrolls into view so the
// two halves slam together. No idle star sitting on the page.
import * as THREE from "three";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
window.NW_SLICE = true;   // ui.js un-hides the headings if this module never loads

// split each heading into the two halves the star cuts
$$(".slash").forEach((h) => {
  const txt = h.dataset.text || h.textContent;
  h.innerHTML = `${txt}<span class="h t" aria-hidden="true">${txt}</span><span class="h b" aria-hidden="true">${txt}</span>`;
});

const intro = $("#cut-intro");
let seen = false;
try { seen = !!sessionStorage.getItem("nw-cut"); sessionStorage.setItem("nw-cut", "1"); } catch (e) {}

if (reduce) {
  intro.classList.add("gone");
  $$(".slash").forEach((h) => h.classList.add("cut"));
} else {
  const canvas = $("#stars");
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true }); }
  catch (e) { intro.classList.add("gone"); $$(".slash").forEach((h) => h.classList.add("cut")); throw e; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -1000, 1000);
  scene.add(new THREE.AmbientLight("#ffffff", 0.6));
  const key = new THREE.DirectionalLight("#ffffff", 3); key.position.set(1, 2, 3);
  const rim = new THREE.PointLight("#ff2d4f", 6, 0, 0); rim.position.set(-300, -200, 400);
  scene.add(key, rim);
  const resize = () => {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    Object.assign(cam, { left: -w / 2, right: w / 2, top: h / 2, bottom: -h / 2 });
    cam.updateProjectionMatrix();
  };
  resize();
  addEventListener("resize", resize);

  const geo = (() => {
    const s = new THREE.Shape();
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 4;
      const r = i % 2 === 0 ? 1 : 0.28;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (i === 0) s.moveTo(x, y);
      else if (i % 2 === 0) s.quadraticCurveTo(Math.cos(a - 0.35) * 0.62, Math.sin(a - 0.35) * 0.62, x, y);
      else s.lineTo(x, y);
    }
    s.closePath();
    const hole = new THREE.Path(); hole.absarc(0, 0, 0.12, 0, Math.PI * 2, true); s.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.04, bevelSize: 0.05, bevelSegments: 3, curveSegments: 16 });
    g.center();
    return g;
  })();
  const star = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: "#d9dce2", metalness: 0.9, roughness: 0.25 }));
  star.visible = false;
  scene.add(star);

  // a throw: right to left with a slight drop, through `y` (screen px); `onCut` fires mid-flight
  const queue = [];
  let flight = null, running = false;
  const loop = (t) => {
    const w = innerWidth, h = innerHeight, size = Math.min(w, h) * 0.075;
    if (!flight && queue.length) { flight = { ...queue.shift(), t0: t, cut: false }; star.visible = true; }
    if (flight) {
      const p = Math.min(1, (t - flight.t0) / (flight.ms || 620));
      const e = 1 - Math.pow(1 - p, 2);
      const y = (typeof flight.y === "function" ? flight.y() : flight.y) - 40 + e * 80;
      star.scale.setScalar(size * (flight.big ? 1.3 : 0.85));
      star.position.set(w / 2 + 140 - e * (w + 280), h / 2 - y, 50);
      star.rotation.set(0.9, 0.2, t * 0.045);
      if (!flight.cut && p > 0.42) { flight.cut = true; flight.onCut(); }
      if (p >= 1) { star.visible = false; flight = null; }
    }
    renderer.render(scene, cam);
    if (flight || queue.length) requestAnimationFrame(loop);
    else running = false;
  };
  const kick = () => { if (!running) { running = true; requestAnimationFrame(loop); } };
  const throwAt = (el) => {
    queue.push({ y: () => { const r = el.getBoundingClientRect(); return r.top + r.height / 2; }, onCut: () => el.classList.add("cut") });
    kick();
  };

  // headings: thrown at when ~60% visible (the hero title waits for the opening cut)
  const heroTitle = $(".hero .slash");
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    io.unobserve(e.target);
    throwAt(e.target);
  }), { threshold: 0.6 });
  const watch = () => $$(".slash").forEach((h) => io.observe(h));

  if (seen) {
    intro.classList.add("gone");
    watch();
  } else {
    // opening cut: the star crosses the black, the line flashes, the halves fly apart
    queue.push({ y: innerHeight / 2, ms: 700, big: true, onCut: () => {
      intro.classList.add("cut");
      setTimeout(() => intro.classList.add("open"), 180);
      setTimeout(() => { intro.classList.add("gone"); watch(); }, 1150);
    } });
    setTimeout(kick, 350);
    io.unobserve(heroTitle);
  }
}
