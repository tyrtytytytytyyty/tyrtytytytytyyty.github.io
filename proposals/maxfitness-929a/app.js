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
  pivot.rotation.set(-0.04, -0.12, 0);
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
    const s = 1.8 / Math.max(size.x, size.y, size.z);
    model.scale.setScalar(s);
    // The Meshy texture atlas came out shattered ("cracked"), so we keep only its geometry and wrap the
    // glossy emblem render onto the front by planar projection (the render is orthographic, so it lines up),
    // with polished chrome on the sides and back. Poster and 3D are then the same object.
    const tex = new THREE.TextureLoader().load("media/m-poster.png");
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const face = new THREE.MeshPhysicalMaterial({
      map: tex, roughness: 0.3, metalness: 0.15, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 0.7
    });
    const chrome = new THREE.MeshPhysicalMaterial({
      color: 0xdcdcdf, roughness: 0.12, metalness: 1, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.3
    });
    model.traverse((o) => {
      if (!o.isMesh) return;
      const g = o.geometry, pos = g.getAttribute("position");
      g.computeBoundingBox();
      const bb = g.boundingBox, w = bb.max.x - bb.min.x, h = bb.max.y - bb.min.y;
      const uv = new Float32Array(pos.count * 2);
      const padU = 8.5 / 713; // poster has a hair of padding on the sides
      for (let i = 0; i < pos.count; i++) {
        uv[i * 2] = padU + ((pos.getX(i) - bb.min.x) / w) * (1 - 2 * padU);
        uv[i * 2 + 1] = (pos.getY(i) - bb.min.y) / h;
      }
      g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
      const idx = g.index.array, front = [], rest = [];
      const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
      for (let i = 0; i < idx.length; i += 3) {
        a.fromBufferAttribute(pos, idx[i]); b.fromBufferAttribute(pos, idx[i + 1]); c.fromBufferAttribute(pos, idx[i + 2]);
        const n = b.clone().sub(a).cross(c.clone().sub(a)).normalize();
        (n.z > 0.8 ? front : rest).push(idx[i], idx[i + 1], idx[i + 2]);
      }
      g.setIndex(front.concat(rest));
      g.clearGroups();
      g.addGroup(0, front.length, 0);
      g.addGroup(front.length, rest.length, 1);
      o.material = [face, chrome];
    });
    pivot.add(model);
    canvas.classList.add("ready");
    poster.classList.add("gone");
  }, undefined, (err) => console.warn("m.glb failed", err));

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

