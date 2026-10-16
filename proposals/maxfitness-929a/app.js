// Max Fitness Augusta: concept prototype (tyycc)
// Hero badge: his chosen logo (glossy black face, matte red M, gunmetal rim) built as a real disc.
// It turns, tilts and lifts with the scroll, and a gloss sheen sweeps the face.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const canvas = document.getElementById("m3d");
const poster = document.getElementById("m-poster");
const lockup = document.querySelector(".lockup");
const hero = document.querySelector(".hero");
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

function initThree() {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    return; // no WebGL: the poster image stays
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 6.4);

  // lit like the page: white key from above right, red bounce from the glow behind it
  const key = new THREE.DirectionalLight(0xffffff, 2.4);
  key.position.set(3, 4, 5);
  const rim = new THREE.DirectionalLight(0xff2a1a, 3.4);
  rim.position.set(-4, 2, -2);
  const under = new THREE.DirectionalLight(0xff3020, 1.2);
  under.position.set(0, -4, 2);
  scene.add(key, rim, under, new THREE.AmbientLight(0xffffff, 0.22));

  const pivot = new THREE.Group();
  scene.add(pivot);

  const R = 1, T = 0.22, loader = new THREE.TextureLoader();
  let loaded = 0;
  const onLoad = () => { if (++loaded === 2) { canvas.classList.add("ready"); poster.classList.add("gone"); } };
  const faceTex = loader.load("media/m-face.jpg", onLoad);
  faceTex.colorSpace = THREE.SRGBColorSpace;
  faceTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const gloss = loader.load("media/m-gloss.png", onLoad); // white = clearcoat, black (the M) = matte

  const face = new THREE.MeshPhysicalMaterial({
    map: faceTex, roughness: 0.5, metalness: 0, clearcoat: 1, clearcoatMap: gloss, clearcoatRoughness: 0.06,
    envMapIntensity: 0.5
  });
  const gunmetal = new THREE.MeshPhysicalMaterial({ color: 0x45464c, roughness: 0.34, metalness: 1, envMapIntensity: 1.1 });
  const chrome = new THREE.MeshPhysicalMaterial({ color: 0x3a3b40, roughness: 0.22, metalness: 1, envMapIntensity: 1.0, clearcoat: 1, clearcoatRoughness: 0.1 });

  // sheen: a soft diagonal band of light that sweeps the glossy black (the gloss map masks out the matte M)
  const sheenMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uPos: { value: -1 }, uMask: { value: gloss }, uAmt: { value: 1 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: `
      varying vec2 vUv; uniform float uPos; uniform float uAmt; uniform sampler2D uMask;
      void main(){
        vec2 c = vUv - 0.5;
        float r = length(c);
        float inside = 1.0 - smoothstep(0.455, 0.47, r);        // stay inside the baked rim
        float d = (vUv.x + (1.0 - vUv.y) * 0.55) - uPos;          // diagonal band, top-left to bottom-right
        float band = exp(-d * d / 0.0035) * 0.85 + exp(-d * d / 0.03) * 0.18;
        float m = texture2D(uMask, vUv).r;
        float a = band * inside * mix(0.18, 1.0, m) * uAmt;
        gl_FragColor = vec4(vec3(1.0, 0.97, 0.95) * a, a);
      }`
  });

  const badge = new THREE.Group();
  const side = new THREE.Mesh(new THREE.CylinderGeometry(R, R, T, 160, 1, true), gunmetal);
  side.rotation.x = Math.PI / 2;
  const front = new THREE.Mesh(new THREE.CircleGeometry(R, 160), face);
  front.position.z = T / 2;
  const back = new THREE.Mesh(new THREE.CircleGeometry(R, 160), face); // the M reads from both sides while it turns
  back.position.z = -T / 2;
  back.rotation.y = Math.PI;
  const sheenF = new THREE.Mesh(new THREE.CircleGeometry(R, 96), sheenMat);
  sheenF.position.z = T / 2 + 0.004;
  const sheenB = sheenF.clone();
  sheenB.position.z = -T / 2 - 0.004;
  sheenB.rotation.y = Math.PI;
  const lipF = new THREE.Mesh(new THREE.TorusGeometry(R, 0.03, 20, 160), chrome); // rounded, polished edge
  lipF.position.z = T / 2;
  const lipB = lipF.clone();
  lipB.position.z = -T / 2;
  badge.add(side, front, back, sheenF, sheenB, lipF, lipB);
  badge.scale.setScalar(0.92);
  pivot.add(badge);

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  addEventListener("resize", resize);
  resize();

  const ease = (x) => x * x * (3 - 2 * x);
  let t = 0, last = performance.now(), sp = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    const heroH = hero ? hero.offsetHeight : innerHeight;
    if (scrollY > heroH * 1.1) return; // off screen: stop drawing

    // scroll progress through the hero, smoothed so a flick still reads as a turn, not a jump
    const target = reduceMotion ? 0 : Math.min(scrollY / (heroH * 0.85), 1);
    sp += (target - sp) * Math.min(1, dt * 8);
    const p = ease(sp);
    if (!reduceMotion) t += dt;

    // a full half-turn plus tilt and lift over the hero; at rest it faces front with a slow sway
    pivot.rotation.y = p * Math.PI + Math.sin(t * 0.9) * 0.08 * (1 - p);
    pivot.rotation.x = -p * 0.55 + Math.sin(t * 0.6) * 0.05;
    pivot.rotation.z = p * 0.18;
    pivot.position.y = p * 0.35;
    const s = 1 + p * 0.16;
    pivot.scale.setScalar(s);

    // sheen: one sweep every ~4.2s, plus scroll pushes the light across
    const cyc = reduceMotion ? 0.35 : (t % 4.2) / 1.4; // 0..1 sweeps, then a pause
    sheenMat.uniforms.uPos.value = reduceMotion ? -2 : (cyc <= 1 ? -0.3 + cyc * 2.1 : 3) + 0;
    if (!reduceMotion && sp > 0.02 && sp < 0.98) sheenMat.uniforms.uPos.value = -0.3 + ((sp * 2.4) % 1) * 2.1;

    // contact shadow on the page follows the turn
    if (lockup) lockup.style.setProperty("--sh", (0.55 + 0.45 * Math.abs(Math.cos(pivot.rotation.y))).toFixed(3));
    if (canvas) canvas.style.transform = `translate3d(0, ${(sp * heroH * 0.12).toFixed(1)}px, 0)`;

    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
}
initThree();
