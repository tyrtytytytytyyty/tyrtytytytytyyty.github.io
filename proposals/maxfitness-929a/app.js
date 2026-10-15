// Max Fitness Augusta — concept prototype (tyycc)
// Hero: Higgsfield-generated 3D "M", slanted, turns as you scroll.
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

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
  camera.position.set(0, 0, 5.2);

  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 4, 5);
  const rim = new THREE.DirectionalLight(0xff2a2a, 3.0);
  rim.position.set(-4, 1, -3);
  scene.add(key, rim, new THREE.AmbientLight(0xffffff, 0.25));

  const pivot = new THREE.Group();
  // the slant: tipped back and turned, like a roadside sign seen from the curb
  pivot.rotation.set(-0.08, -0.38, 0.05);
  scene.add(pivot);

  new GLTFLoader().load("media/m.glb", (gltf) => {
    // Meshy exports the badge lying flat; stand its thinnest axis up to face the camera
    const raw = gltf.scene;
    const rawSize = new THREE.Box3().setFromObject(raw).getSize(new THREE.Vector3());
    if (rawSize.y <= rawSize.x && rawSize.y <= rawSize.z) raw.rotation.x = Math.PI / 2;
    else if (rawSize.x <= rawSize.y && rawSize.x <= rawSize.z) raw.rotation.y = -Math.PI / 2;
    const model = new THREE.Group();
    model.add(raw);
    model.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    const s = 2.05 / Math.max(size.x, size.y, size.z);
    model.scale.setScalar(s);
    model.traverse((o) => {
      if (o.isMesh && o.material) {
        const m = o.material;
        m.transparent = false;
        m.opacity = 1;
        m.depthWrite = true;
        m.alphaTest = 0;
        m.side = THREE.FrontSide;
        m.envMapIntensity = 1.2;
        m.needsUpdate = true;
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
    // turns with the scroll, but stays readable as the M in the lockup
    const p = Math.min(scrollY / innerHeight, 1);
    t += reduceMotion ? 0 : 0.01;
    pivot.rotation.y = -0.38 + p * 0.9 + Math.sin(t) * 0.12;
    pivot.rotation.x = -0.08 + Math.sin(t * 0.7) * 0.04;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  frame();
}
initThree();

