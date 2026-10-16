// Max Fitness Augusta — concept prototype (tyycc)
// Hero: Higgsfield-generated 3D "M", slanted, turns as you scroll.
import * as THREE from "three";
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
  pivot.rotation.set(-0.04, -0.12, 0);
  scene.add(pivot);

  // The badge is built here rather than from a generated mesh: a real disc with a satin gunmetal rim, and
  // his chosen Higgsfield render (glossy black face, matte red M) on the front. Crisp, and identical to the pick.
  {
    const R = 1, T = 0.2, loader = new THREE.TextureLoader();
    const faceTex = loader.load("media/m-face.png", () => { canvas.classList.add("ready"); poster.classList.add("gone"); });
    faceTex.colorSpace = THREE.SRGBColorSpace;
    faceTex.anisotropy = 8;
    const gloss = loader.load("media/m-gloss.png"); // white = clearcoat, black (the M) = matte
    const face = new THREE.MeshPhysicalMaterial({
      map: faceTex, roughness: 0.5, metalness: 0, clearcoat: 1, clearcoatMap: gloss, clearcoatRoughness: 0.08,
      envMapIntensity: 0.45
    });
    const gunmetal = new THREE.MeshPhysicalMaterial({ color: 0x55565c, roughness: 0.45, metalness: 1, envMapIntensity: 0.9 });
    const badge = new THREE.Group();
    const side = new THREE.Mesh(new THREE.CylinderGeometry(R, R, T, 128, 1, true), gunmetal);
    side.rotation.x = Math.PI / 2;
    const front = new THREE.Mesh(new THREE.CircleGeometry(R, 128), face);
    front.position.z = T / 2;
    const back = new THREE.Mesh(new THREE.CircleGeometry(R, 128), gunmetal);
    back.position.z = -T / 2;
    back.rotation.y = Math.PI;
    const lip = new THREE.Mesh(new THREE.TorusGeometry(R, 0.035, 16, 128), gunmetal); // soft rounded edge
    lip.position.z = T / 2;
    badge.add(side, front, back, lip);
    badge.scale.setScalar(0.92);
    pivot.add(badge);
  }

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
    pivot.rotation.y = -0.12 + p * 0.9 + Math.sin(t) * 0.16;
    pivot.rotation.x = -0.04 + Math.sin(t * 0.7) * 0.04;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  frame();
}
initThree();

