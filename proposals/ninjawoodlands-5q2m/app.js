// Ninja Woodlands concept: intro cut, live 3D shuriken that slices each heading, program finder, party builder, text-line demo.
import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- intro (Remotion render) ---------- */
const intro = $("#intro");
const vid = $("#intro-video");
const endIntro = () => { intro.classList.add("out"); setTimeout(() => intro.classList.add("gone"), 650); };
let seen = false;
try { seen = !!sessionStorage.getItem("nw-intro"); sessionStorage.setItem("nw-intro", "1"); } catch (e) {}
if (reduce || seen) intro.classList.add("gone");
else {
  vid.src = innerHeight > innerWidth ? "media/intro-v.mp4" : "media/intro-h.mp4";
  vid.addEventListener("ended", endIntro);
  vid.play().catch(endIntro);
  $("#skip").onclick = endIntro;
  setTimeout(endIntro, 6500);
}

/* ---------- hours (Central time) ---------- */
const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const HOURS = [[[14, 19.5]], [[14, 19.5]], [[15, 20.25]], [[11, 19.5]], [[14.5, 20]], [[14.5, 18.25]], [[8.5, 13.5], [14, 19.5]]];
const t12 = (h) => { const hh = Math.floor(h), mm = Math.round((h - hh) * 60); const s = hh >= 12 ? "PM" : "AM"; const h12 = hh % 12 || 12; return `${h12}${mm ? ":" + String(mm).padStart(2, "0") : ""} ${s}`; };
const nowCT = () => {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "America/Chicago", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return new Date(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute);
};
const now = nowCT();
const hr = now.getHours() + now.getMinutes() / 60;
const openBlock = HOURS[now.getDay()].find(([a, b]) => hr >= a && hr < b);
const nextOpen = () => {
  for (let i = 0; i < 8; i++) {
    const d = (now.getDay() + i) % 7;
    const blk = HOURS[d].find(([a]) => i > 0 || a > hr);
    if (blk) return `${i === 0 ? "today" : i === 1 ? "tomorrow" : DAYS[d]} at ${t12(blk[0])}`;
  }
};
$("#open-dot").classList.toggle("open", !!openBlock);
$("#open-label").textContent = openBlock ? `Open now · until ${t12(openBlock[1])}` : `Opens ${nextOpen()}`;
HOURS.forEach((_, i) => {
  const d = (i + 1) % 7;
  const tr = document.createElement("tr");
  if (d === now.getDay()) tr.className = "today";
  tr.innerHTML = `<td>${DAYS[d]}</td><td>${HOURS[d].map(([a, b]) => `${t12(a)} to ${t12(b)}`).join(", ")}</td>`;
  $("#hours").appendChild(tr);
});

/* ---------- reveal ---------- */
const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))), { threshold: 0.15 });
$$(".reveal").forEach((el) => io.observe(el));

/* ---------- 3D shuriken layer ---------- */
const canvas = $("#stars");
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = new THREE.Scene();
const pm = new THREE.PMREMGenerator(renderer);
scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -1000, 1000);
const red = new THREE.PointLight("#e2231a", 4, 0, 0);
red.position.set(-200, -200, 300);
scene.add(red, new THREE.DirectionalLight("#ffffff", 2.5));
const resize = () => {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  Object.assign(cam, { left: -w / 2, right: w / 2, top: h / 2, bottom: -h / 2 });
  cam.updateProjectionMatrix();
};
resize();
addEventListener("resize", resize);

const starGeo = (() => {
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
const steel = new THREE.MeshStandardMaterial({ color: "#cfd2d8", metalness: 1, roughness: 0.22 });
const idle = new THREE.Mesh(starGeo, steel);
const thrown = new THREE.Mesh(starGeo, steel);
scene.add(idle, thrown);
thrown.visible = false;

// idle star sits in the hero's top-right and spins faster as you scroll
let spin = 0, lastY = scrollY, heroVisible = true;
new IntersectionObserver((es) => (heroVisible = es[0].isIntersecting)).observe($(".hero"));

// throws: queue of headings to slice
const queue = [];
let flight = null;
const throwAt = (el) => {
  const r = el.getBoundingClientRect();
  flight = { el, t0: performance.now(), y: r.top + r.height / 2, cut: false };
  thrown.visible = true;
};

let running = false;
const loop = (t) => {
  const w = innerWidth, h = innerHeight;
  const dy = scrollY - lastY; lastY = scrollY;
  spin += 0.012 + Math.min(Math.abs(dy), 80) * 0.004;
  const s = Math.min(w, h) * 0.07;
  idle.visible = heroVisible;
  idle.scale.setScalar(s);
  idle.position.set(w / 2 - s * 1.9, h / 2 - h * 0.3 + scrollY * 0.35, 0);
  idle.rotation.set(0.6, -0.4, -spin);
  if (!flight && queue.length) throwAt(queue.shift());
  if (flight) {
    const p = Math.min(1, (t - flight.t0) / 620);
    const e = 1 - Math.pow(1 - p, 2);
    // right to left, slight downward arc through the heading's centre line
    const x = w / 2 + 120 - e * (w + 240);
    const yScreen = flight.y - 40 + e * 80;
    thrown.scale.setScalar(s * 0.85);
    thrown.position.set(x, h / 2 - yScreen, 50);
    thrown.rotation.set(0.9, 0.2, t * 0.04);
    if (!flight.cut && p > 0.4) { flight.cut = true; flight.el.classList.add("cut"); }
    if (p >= 1) { thrown.visible = false; flight = null; }
  }
  renderer.render(scene, cam);
  if (heroVisible || flight || queue.length) requestAnimationFrame(loop);
  else running = false;
};
const kick = () => { if (!running) { running = true; requestAnimationFrame(loop); } };
kick();
addEventListener("scroll", kick, { passive: true });

$$(".slash").forEach((h) => {
  const txt = h.dataset.text || h.textContent;
  h.innerHTML = `${txt}<span class="h t" aria-hidden="true">${txt}</span><span class="h b" aria-hidden="true">${txt}</span>`;
});
const slashIO = new IntersectionObserver((es) => es.forEach((e) => {
  if (!e.isIntersecting) return;
  slashIO.unobserve(e.target);
  if (reduce) e.target.classList.add("cut");
  else { queue.push(e.target); kick(); }
}), { threshold: 0.6 });
$$(".slash").forEach((h) => slashIO.observe(h));

/* ---------- program finder ---------- */
const PROGRAMS = [
  { min: 2, max: 3, name: "Sidekicks", ages: "Ages 2.5 to 3", price: 90, len: "One 45-minute class a week, with a parent alongside", desc: "First steps on the course: balance, coordination and fundamental movement." },
  { min: 4, max: 5, name: "Junior Ninjas", ages: "Ages 4 to 5", price: 100, len: "One 50-minute class a week", desc: "Real obstacles, built for little bodies. Strength and coordination through play." },
  { min: 6, max: 8, name: "Ninjas", ages: "Ages 6 to 8", price: 110, len: "One 1-hour class a week", desc: "Obstacle course training with coaches who push skills one level at a time." },
  { min: 9, max: 12, name: "Ninjas", ages: "Ages 9 to 12", price: 110, len: "One 1-hour class a week", desc: "Bigger obstacles, harder lines and the first taste of competition." },
  { min: 13, max: 17, name: "Teen Warriors", ages: "Ages 13 to 17", price: 110, len: "One 1-hour class a week", desc: "Technical mastery, upper-body strength and goal setting." },
];
const age = $("#age");
const card = $("#finder-card");
let lastProg = null;
const setAge = () => {
  const a = +age.value;
  $("#age-num").textContent = a;
  const p = PROGRAMS.find((x) => a >= x.min && a <= x.max);
  if (p !== lastProg) {
    card.classList.remove("swap"); void card.offsetWidth; card.classList.add("swap");
    lastProg = p;
  }
  $("#p-name").textContent = p.name;
  $("#p-ages").textContent = p.ages;
  $("#p-desc").textContent = p.desc;
  $("#p-price").textContent = "$" + p.price;
  $("#p-len").textContent = p.len + " · sibling and multi-class discounts available";
};
age.addEventListener("input", setAge);
setAge();

/* ---------- party builder ---------- */
const guests = $("#guests");
const party = () => {
  const g = +guests.value;
  const extra = Math.max(0, g - 15);
  $("#g-out").textContent = g;
  $("#party-price").textContent = "$" + (350 + extra * 10);
  $("#party-break").textContent = extra ? `15 included + ${extra} extra at $10 each` : "up to 15 guests included";
};
guests.addEventListener("input", party);
party();
const date = $("#party-date");
const earliest = new Date(now); earliest.setDate(now.getDate() + 14);
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
date.min = iso(earliest);
date.addEventListener("change", () => {
  const msg = $("#date-msg");
  if (!date.value) return;
  const [y, m, d] = date.value.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const wk = dt.getDay() === 0 || dt.getDay() === 6;
  if (dt < earliest) { msg.className = "date-msg no"; msg.textContent = "Parties need at least two weeks' notice. Try a later weekend."; }
  else if (!wk) { msg.className = "date-msg no"; msg.textContent = "Parties run Saturdays and Sundays. Pick a weekend date."; }
  else { msg.className = "date-msg ok"; msg.textContent = `${dt.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} works. Text us to hold it with the $100 deposit.`; }
});

/* ---------- text line demo ---------- */
const thread = $("#thread");
const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));
const add = (cls, html) => { const m = document.createElement("div"); m.className = "msg " + cls; m.innerHTML = html; thread.appendChild(m); thread.scrollTop = thread.scrollHeight; return m; };
const say = async (html, ms = 850) => { const t = add("them typing", "<i></i><i></i><i></i>"); await wait(ms); t.remove(); return add("them", html); };
const offer = (opts, cb) => {
  const row = document.createElement("div"); row.className = "slots";
  opts.forEach((o) => { const b = document.createElement("button"); b.type = "button"; b.textContent = o; b.onclick = async () => { row.remove(); add("me", o); await cb(o); }; row.appendChild(b); });
  thread.appendChild(row); thread.scrollTop = thread.scrollHeight;
};
const progFor = (a) => PROGRAMS.find((x) => a >= x.min && a <= x.max);
const SCRIPTS = {
  "How much are classes?": async () => {
    await say("Depends on age! Sidekicks (2.5 to 3) are $90/mo, Junior Ninjas (4 to 5) $100/mo, and Ninjas and Teen Warriors (6 to 17) $110/mo. Each one is 4 classes a month.");
    await say("How old is your ninja?", 600);
    offer(["4", "8", "14"], async (a) => { const p = progFor(+a); await say(`Perfect, that's <b>${p.name}</b>: ${p.len.toLowerCase()}, $${p.price}/mo. Siblings get a discount too.`); });
  },
  "Is there a trial class?": async () => {
    await say("Yes, we do trial classes! How old is your kiddo? I'll find the right group.");
    offer(["5", "9", "13"], async (a) => {
      const p = progFor(+a);
      await say(`Great, that's our ${p.name} group. I'll have the front desk text you the next open trial spot.`);
      add("sys", "Handed to the front desk");
    });
  },
  "Birthday party?": async () => {
    await say("Our Ninja Party is $350 for 15 guests, and $10 per extra guest (up to 25). You get 90 minutes, two party coaches and the whole gym to yourselves.");
    await say("Parties are Saturdays and Sundays. A $100 non-refundable deposit holds your date, and we ask for at least 2 weeks' notice. Want me to check a date?", 900);
    offer(["Yes, check a date"], async () => { await say("Text me the weekend you're thinking of and I'll check it with the front desk."); add("sys", "Party request flagged for the front desk"); });
  },
  "Summer camp?": async () => {
    await say("Summer camps run weekly, June through August, 8:30 AM to noon. They're $45 per half day, with discounts for multiple days.");
    await say("We also run camps over winter break, spring break and teacher workdays.", 700);
  },
  "Open right now?": async () => {
    await say(openBlock ? `Yep! We're open until ${t12(openBlock[1])} today.` : `We're closed right now. We open ${nextOpen()}. Texting us still works anytime though!`);
  },
  "Can parents watch?": async () => {
    await say("Good question! Let me check with a coach and text you right back.");
    add("sys", "Handed to the front desk with this conversation");
  },
};
Object.keys(SCRIPTS).forEach((q) => {
  const c = document.createElement("button"); c.type = "button"; c.className = "chip"; c.textContent = q;
  c.onclick = () => ask(q);
  $("#chips").appendChild(c);
});
let busy = false, greeted = false;
const ask = async (q) => {
  if (busy) return; busy = true;
  $$(".slots", thread).forEach((s) => s.remove());
  add("me", q); await wait(300);
  if (SCRIPTS[q]) await SCRIPTS[q]();
  busy = false;
};
new IntersectionObserver(async (es) => {
  if (greeted || !es[0].isIntersecting) return;
  greeted = true;
  await say("Hey! This is USA Ninja Challenge, The Woodlands 🥷 Ask me anything about classes, parties or camps. Tap a question below.", 700);
}, { threshold: 0.4 }).observe($(".phone"));
$$("[data-ask]").forEach((el) => el.addEventListener("click", (e) => {
  e.preventDefault();
  $("#text").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  setTimeout(() => { greeted = true; ask(el.dataset.ask); }, 700);
}));
