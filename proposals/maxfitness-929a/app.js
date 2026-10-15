// Max Fitness Augusta — concept prototype (tyycc)
// Hero: Higgsfield-generated 3D "M", slanted, turns as you scroll.
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";
import { RoomEnvironment } from "https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/environments/RoomEnvironment.js";

const canvas = document.getElementById("m3d");
const poster = document.getElementById("m-poster");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

function initThree() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    return; // no WebGL, the poster image stays
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 4, 5);
  const rim = new THREE.DirectionalLight(0xff2a2a, 3.0);
  rim.position.set(-4, 1, -3);
  scene.add(key, rim, new THREE.AmbientLight(0xffffff, 0.25));

  const pivot = new THREE.Group();
  // the slant: tipped back and turned, like a roadside sign seen from the curb
  pivot.rotation.set(-0.18, -0.55, 0.12);
  scene.add(pivot);

  new GLTFLoader().load("media/m.glb", (gltf) => {
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    const s = 2.6 / Math.max(size.x, size.y, size.z);
    model.scale.setScalar(s);
    model.traverse((o) => {
      if (o.isMesh && o.material) {
        o.material.envMapIntensity = 1.2;
      }
    });
    pivot.add(model);
    canvas.classList.add("ready");
    poster.classList.add("gone");
  });

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  addEventListener("resize", resize);
  resize();

  let t = 0;
  function frame() {
    const p = Math.min(scrollY / innerHeight, 1.5);
    t += reduceMotion ? 0 : 0.004;
    pivot.rotation.y = -0.55 + p * 1.4 + Math.sin(t) * 0.08;
    pivot.rotation.x = -0.18 + p * 0.25;
    pivot.position.y = p * 0.9;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  frame();
}
initThree();

// reveal-on-scroll
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
}, { threshold: 0.15 });
document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

// open/closed badge from the hours table
const badge = document.getElementById("open-now");
if (badge && window.HOURS) {
  const now = new Date();
  const today = window.HOURS[now.getDay()];
  if (today === "24") { badge.textContent = "Open now · 24/7"; badge.classList.add("open"); }
  else if (today) {
    const [o, c] = today;
    const h = now.getHours() + now.getMinutes() / 60;
    const open = h >= o && h < c;
    badge.textContent = open ? "Open now" : "Closed now";
    badge.classList.add(open ? "open" : "closed");
  }
}

// sticky call/pass bar appears once the hero is behind you
const dock = document.querySelector(".dock");
if (dock) {
  const onScroll = () => dock.classList.toggle("show", scrollY > innerHeight * 0.6);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

// highlight today's row in the hours table
const row = document.querySelector(`.hours tr[data-day="${new Date().getDay()}"]`);
if (row) row.classList.add("today");
