/* Val Tereska Hair v5: scroll scenes, stylist picker, shears before/after, reveals, contact form. */
(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = v => Math.max(0, Math.min(1, v));
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ── stylist picker: size the pinned section so vertical scroll walks the horizontal track ──
  const pick = $(".pick"), track = $(".track");
  let over = 0;
  function sizePick() {
    if (!pick) return;
    over = Math.max(0, track.scrollWidth - innerWidth);
    pick.style.height = still || !over ? "auto" : `calc(100svh + ${over}px)`;
    $(".pick .pin").style.position = still || !over ? "relative" : "";
    $(".pick .pin").style.height = still || !over ? "auto" : "";
    if (!over) { pick.style.padding = "90px 0"; track.style.transform = ""; } else pick.style.padding = "";
  }

  // ── word-by-word statement ──
  const say = $(".say p");
  let words = [];
  if (say) {
    say.innerHTML = say.innerHTML.replace(/(<em>.*?<\/em>|\S+)/g, w => w.startsWith("<em>") ? `<span class="pk">${w.slice(4, -5)}</span>` : `<span>${w}</span>`);
    words = $$("span", say);
  }

  // ── one rAF loop writes --p on every scene ──
  const scenes = $$("[data-scene]"), nav = $(".nav"), heroEl = $(".hero, .vhero"), logos = $(".logos");
  let ticking = false;
  function frame() {
    ticking = false;
    const vh = innerHeight;
    for (const el of scenes) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) continue;
      const total = el.offsetHeight - vh;
      const p = total > 4 ? clamp(-r.top / total) : clamp((vh - r.top) / (vh + r.height));
      el.style.setProperty("--p", p.toFixed(4));
      if (el === pick && over) track.style.transform = `translate3d(${(-p * over).toFixed(1)}px,0,0)`;
      if (el === pick) $$(".dots i").forEach((d, i, a) => d.classList.toggle("on", Math.round(p * (a.length - 1)) === i));
      if (say && el.contains(say)) { const n = Math.ceil(p * 1.25 * words.length); words.forEach((w, i) => w.classList.toggle("on", i < n)); }
    }
    // hero logo: swaps to her gold-accent version a third of the way down, with a pop instead of a fade
    if (logos) {
      const hp = parseFloat(getComputedStyle(logos.closest("[data-scene]")).getPropertyValue("--p")) || 0, alt = hp > .35;
      if (alt !== logos.classList.contains("alt")) {
        logos.classList.toggle("alt", alt);
        if (!still) $(alt ? ".lb" : ".la", logos).animate([{ transform: "scale(.8)" }, { transform: "scale(1.06)" }, { transform: "none" }], { duration: 420, easing: "cubic-bezier(.34,1.56,.64,1)" });
      }
    }
    if (nav) nav.classList.toggle("solid", !heroEl || scrollY > (heroEl.offsetHeight - vh * 0.6));
  }
  const kick = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener("scroll", kick, { passive: true });
  addEventListener("resize", () => { sizePick(); kick(); });
  sizePick(); frame();
  if (still) words.forEach(w => w.classList.add("on"));

  // ── reveal on view ──
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .15 });
  $$(".rv").forEach(el => io.observe(el));
  $$(".list li").forEach((li, i) => { li.style.transitionDelay = (i * 60) + "ms"; io.observe(li); });

  // ── before/after: the handle is Val's own shears (closed + open frames, pivot-aligned) snipping as you drag ──
  const ba = $(".ba");
  if (ba) {
    const sh = $(".shears", ba), op = $(".shears .op", ba), cl = $(".shears .cl", ba);
    let x = 0.5, dist = 0, lastX = null, dragging = false, wasOpen = true;
    // t: 0 = closed, 1 = open. A steep curve keeps it on one frame or the other, so the swap reads as a snip, not a ghost.
    const setOpen = t => { const k = t * t * (3 - 2 * t); op.style.opacity = k.toFixed(3); cl.style.opacity = (1 - k).toFixed(3); };
    const snip = () => {
      const r = ba.getBoundingClientRect();
      for (let i = 0; i < 5; i++) {
        const s = document.createElement("i"); s.className = "snip";
        s.style.background = Math.random() < .5 ? "#6a5d54" : "#ed77bb";
        s.style.top = (50 + (Math.random() * 16 - 8)) + "%";
        s.style.setProperty("--dx", ((Math.random() - .5) * 60).toFixed(0) + "px");
        s.style.setProperty("--dy", (20 + Math.random() * 50).toFixed(0) + "px");
        ba.appendChild(s); requestAnimationFrame(() => s.classList.add("go"));
        setTimeout(() => s.remove(), 600);
      }
      if (navigator.vibrate) try { navigator.vibrate(4); } catch (e) {}
    };
    const move = cx => {
      const r = ba.getBoundingClientRect();
      x = clamp((cx - r.left) / r.width);
      ba.style.setProperty("--x", (x * 100).toFixed(2) + "%");
      if (lastX !== null) { dist += Math.abs(cx - lastX); if (cx !== lastX) sh.style.setProperty("--dir", cx > lastX ? -1 : 1); }   // blades lead the way you drag
      lastX = cx;
      const t = Math.min(1, Math.max(0, Math.sin(dist / 14) * 1.6));   // open and shut as you travel
      setOpen(t);
      const open = t > .5;
      if (wasOpen && !open) snip();
      wasOpen = open;
    };
    ba.addEventListener("pointerdown", e => { dragging = true; lastX = null; ba.setPointerCapture(e.pointerId); move(e.clientX); });
    ba.addEventListener("pointermove", e => { if (dragging) move(e.clientX); });
    const end = () => { dragging = false; lastX = null; setOpen(1); };
    ba.addEventListener("pointerup", end); ba.addEventListener("pointercancel", end);
    setOpen(1);
    // one demo snip-sweep when it first comes on screen, so people know it moves
    if (!still) new IntersectionObserver(([e], o) => {
      if (!e.isIntersecting) return; o.disconnect();
      const r = ba.getBoundingClientRect(); let t0 = null;
      const run = ts => { if (dragging) return; t0 ??= ts; const k = Math.min(1, (ts - t0) / 1400);
        move(r.left + r.width * (0.5 + 0.18 * Math.sin(k * Math.PI * 2))); if (k < 1) requestAnimationFrame(run); else { lastX = null; setOpen(1); } };
      requestAnimationFrame(run);
    }, { threshold: .6 }).observe(ba);
  }

  // ── contact form (concept: not wired until Val approves) ──
  const form = $("form.cf");
  if (form) {
    const t = new URLSearchParams(location.search).get("topic");
    if (t && form.topic) form.topic.value = t;
    form.addEventListener("submit", e => { e.preventDefault(); form.style.display = "none"; $(".done").style.display = "block"; scrollTo({ top: 0, behavior: "smooth" }); });
  }
})();
