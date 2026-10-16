// The text line. Set this to the real number and every "text us" link on the site follows it.
const TEXT_LINE_NUMBER = "+1 (000) 000-0000";

// Day-pass endpoint (2026-10-16): a Cloudflare Worker with a fixed URL that forwards to the
// sign-up server on Tyrese's Mac. The pass code comes from the server; set to null for the offline demo.
const PASS_ENDPOINT = "https://maxfit-signup.thecoolwolfguy09.workers.dev/mf/signup";

// Page behavior with no CDN dependency, so everything here works even if the 3D fails.
(function () {
  "use strict";
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* private mode: fine */ } }
  };

  // ---------- text line: one constant feeds every sms: link ----------
  const digits = TEXT_LINE_NUMBER.replace(/[^\d+]/g, "");
  $$("[data-text-line]").forEach((a) => { a.href = "sms:" + digits; });
  $$("[data-text-line-label]").forEach((el) => { el.textContent = TEXT_LINE_NUMBER; });

  // ---------- one scroll loop for everything scroll-driven ----------
  const jobs = [];
  let queued = false;
  function tick() { queued = false; for (const j of jobs) j(); }
  function queue() { if (!queued) { queued = true; requestAnimationFrame(tick); } }
  addEventListener("scroll", queue, { passive: true });
  addEventListener("resize", queue);

  // reveal-on-scroll (plain rect check, never strands content hidden)
  const pending = $$(".reveal");
  jobs.push(() => {
    const limit = innerHeight * 0.92;
    for (let i = pending.length - 1; i >= 0; i--) {
      if (pending[i].getBoundingClientRect().top < limit) { pending[i].classList.add("in"); pending.splice(i, 1); }
    }
  });
  setTimeout(() => pending.splice(0).forEach((el) => el.classList.add("in")), 15000); // failsafe

  // ---------- atmosphere: red light that drifts down the page with you ----------
  // 2026-10-16 smoothing pass. The old version jumped (worst around the free day pass): stops
  // bunched up with 60+vw swings between them, a smoothstep per segment that stalls at every
  // stop then lurches, and the light pinned straight to scrollY so a fling or a photo loading
  // (page height change) snapped it. Now:
  //   1. evenly spaced stops with small moves, mapped across the WHOLE page height,
  //   2. sine easing on page progress + a Catmull-Rom curve through the stops (C1-smooth: no
  //      kinks, no stall-and-lurch at the stops),
  //   3. a requestAnimationFrame lerp toward the scroll target (frame-rate independent), so the
  //      light drifts after you instead of stepping, and a height change glides instead of snapping.
  // Still transform + opacity only (compositor-cheap on phones). Reduced motion: one static frame.
  const g1 = $(".g1"), g2 = $(".g2"), g3 = $(".g3");
  const K = [
    // g1 x,y(vw,vh)  s     o      g2 x,y      s     o      g3 y   o      (stops evenly spaced over p 0 → 1)
    [-28, -42, 0.90, 1.00,  40,  50, 0.70, 0.20,  80, 0.30],
    [ -8, -30, 0.86, 0.82,  22,  36, 0.78, 0.38,  75, 0.40],
    [ 10, -14, 0.88, 0.70,   2,  18, 0.86, 0.56,  68, 0.46],
    [ -6,  -6, 0.86, 0.68, -18,  16, 0.90, 0.62,  66, 0.48],
    [-14,  18, 0.84, 0.66,   0,  -6, 0.86, 0.64,  73, 0.38],
    [  0,  45, 1.05, 0.95, -20, -40, 0.70, 0.55,  90, 0.20]
  ];
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const ease = (p) => 0.5 - 0.5 * Math.cos(Math.PI * p);           // gentle in/out over the whole page
  const v = new Array(K[0].length);
  function sample(p) {                                              // uniform Catmull-Rom through the stops
    const n = K.length - 1, x = clamp01(p) * n;
    const i = Math.min(n - 1, Math.floor(x)), t = x - i, t2 = t * t, t3 = t2 * t;
    const P0 = K[Math.max(0, i - 1)], P1 = K[i], P2 = K[i + 1], P3 = K[Math.min(n, i + 2)];
    for (let k = 0; k < v.length; k++) {
      v[k] = 0.5 * (2 * P1[k] + (P2[k] - P0[k]) * t + (2 * P0[k] - 5 * P1[k] + 4 * P2[k] - P3[k]) * t2 +
                    (3 * P1[k] - P0[k] - 3 * P2[k] + P3[k]) * t3);
    }
    return v;
  }
  function paint(p) {
    const a = sample(ease(p));
    g1.style.transform = `translate3d(${a[0].toFixed(2)}vw, ${a[1].toFixed(2)}vh, 0) scale(${a[2].toFixed(4)})`;
    g1.style.opacity = clamp01(a[3]).toFixed(3);
    g2.style.transform = `translate3d(${a[4].toFixed(2)}vw, ${a[5].toFixed(2)}vh, 0) scale(${a[6].toFixed(4)})`;
    g2.style.opacity = clamp01(a[7]).toFixed(3);
    g3.style.transform = `translate3d(0, ${a[8].toFixed(2)}vh, 0)`;
    g3.style.opacity = clamp01(a[9]).toFixed(3);
  }
  // page height is cached (no layout read per scroll frame) and re-measured when it changes
  let maxScroll = 1;
  const measure = () => { maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight); };
  measure();
  addEventListener("resize", measure);
  if ("ResizeObserver" in window) new ResizeObserver(() => { measure(); queue(); }).observe(document.body);
  const TAU = 0.5;                                                  // seconds to cover ~63% of the gap
  let cur = null, target = 0, running = false, last = 0;
  function drift(now) {
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 1 / 60;
    last = now;
    cur += (target - cur) * (1 - Math.exp(-dt / TAU));
    if (Math.abs(target - cur) < 0.0001) cur = target;
    paint(cur);
    if (cur !== target) requestAnimationFrame(drift);
    else { running = false; last = 0; }
  }
  function atmo() {
    if (!g1) return;
    if (still) { if (cur === null) { cur = 0; paint(0); } return; } // reduced motion: one static frame
    target = clamp01(scrollY / maxScroll);
    if (cur === null) { cur = target; paint(cur); return; }         // first paint lands in place (no sweep on reload)
    if (!running && cur !== target) { running = true; requestAnimationFrame(drift); }
  }
  jobs.push(atmo);

  // ---------- scroll cue hides once you've started ----------
  const cue = $(".scroll-cue");
  if (cue) jobs.push(() => cue.classList.toggle("away", scrollY > 40));

  // ---------- open now badge ----------
  const badge = $("#open-now");
  if (badge && window.HOURS) {
    const now = new Date();
    const today = window.HOURS[now.getDay()];
    const label = badge.querySelector("b") || badge;
    if (today === "24") { label.textContent = "Open now"; badge.classList.add("open"); }
    else if (today) {
      const [o, c] = today;
      const h = now.getHours() + now.getMinutes() / 60;
      const open = h >= o && h < c;
      label.textContent = open ? "Open now" : "Closed now";
      badge.classList.add(open ? "open" : "closed");
    }
  }
  const dayEl = $(`.week li[data-day="${new Date().getDay()}"]`);
  if (dayEl) dayEl.classList.add("today");

  // ---------- sticky dock ----------
  const dock = $(".dock");
  if (dock) jobs.push(() => dock.classList.toggle("show", scrollY > innerHeight * 0.7));

  // ---------- free day pass sheet: once per session, after the visitor is into the page ----------
  const sheet = $("#pass-sheet");
  if (sheet) {
    const KEY = "mf-pass-sheet-seen";
    let armed = store.get(KEY) !== "1";
    let lastFocus = null;
    const open = () => {
      if (!armed) return;
      armed = false; store.set(KEY, "1");
      lastFocus = document.activeElement;
      sheet.hidden = false;
      document.body.classList.add("sheet-open");
      requestAnimationFrame(() => requestAnimationFrame(() => sheet.classList.add("open")));
      setTimeout(() => { const b = sheet.querySelector(".btn"); if (b) b.focus({ preventScroll: true }); }, still ? 0 : 450);
    };
    const close = () => {
      sheet.classList.remove("open");
      document.body.classList.remove("sheet-open");
      setTimeout(() => { sheet.hidden = true; }, still ? 0 : 450);
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    };
    $$("[data-sheet-close]", sheet).forEach((el) => el.addEventListener("click", close));
    addEventListener("keydown", (e) => { if (e.key === "Escape" && !sheet.hidden) close(); });
    // trigger: past the hero and into the content (roughly the membership card), never in the first seconds
    const plans = $("#plans");
    const born = Date.now();
    jobs.push(() => {
      if (!armed || Date.now() - born < 2500) return;
      const trigger = plans ? plans.offsetTop - innerHeight * 0.4 : innerHeight * 1.6;
      if (scrollY > trigger) open();
    });
  }

  // ---------- photos: everything reads media/photos/manifest.json ----------
  // Slots: <figure class="shot" data-photo="classes"> picks the first manifest entry whose
  // recommended_section matches; the gallery takes the facility shots. Drop new files + entries in, done.
  const gallery = $("[data-gallery]");
  const slots = $$("[data-photo]");
  const SLOT_MATCH = {
    "personal training": /personal training|trainer/i,
    classes: /class/i,
    ladymax: /lady\s*max|women/i,
    kids: /kid/i,
    team: /team/i,
    location: /location|lobby|entrance/i
  };
  const GALLERY_MATCH = /hero|facility|amenit|strength|cardio|floor/i;
  const lazyImgs = [];
  function makeImg(entry, base) {
    const img = new Image();
    img.alt = entry.alt || "";
    img.decoding = "async";
    img.dataset.src = new URL(entry.file.includes("/") ? entry.file : "themed/" + entry.file, base).href;
    img.addEventListener("load", () => img.classList.add("loaded"));
    lazyImgs.push(img);
    return img;
  }
  function loadNear() {
    const limit = innerHeight * 2;
    for (let i = lazyImgs.length - 1; i >= 0; i--) {
      const img = lazyImgs[i];
      const host = img.closest(".g-card, .shot");
      const r = (host || img).getBoundingClientRect();
      if (r.top < limit && r.bottom > -limit) { img.src = img.dataset.src; lazyImgs.splice(i, 1); }
    }
  }
  jobs.push(loadNear);

  const base = new URL("media/photos/manifest.json", location.href);
  if (slots.length || gallery) {
    fetch(base).then((r) => (r.ok ? r.json() : [])).then((list) => {
      if (!Array.isArray(list) || !list.length) return;
      const used = new Set();
      slots.forEach((slot) => {
        const re = SLOT_MATCH[slot.dataset.photo] || new RegExp(slot.dataset.photo, "i");
        const hit = list.find((e) => !used.has(e) && re.test(e.recommended_section || ""));
        if (!hit) return;
        used.add(hit);
        slot.appendChild(makeImg(hit, base));
      });
      if (gallery) {
        let shots = list.filter((e) => !used.has(e) && GALLERY_MATCH.test(e.recommended_section || ""));
        if (shots.length < 3) shots = list.filter((e) => !used.has(e) && !/lady/i.test(e.recommended_section || ""));
        buildGallery(shots, base);
      }
      queue();
    }).catch(() => { /* no manifest yet: the photo slots stay hidden */ });
  }

  function caption(entry) {
    const s = (entry.scene || "").split(/[:(]/)[0].trim();
    return s.length > 42 ? s.slice(0, 40).trim() + "…" : s;
  }
  function buildGallery(shots, base) {
    if (!shots.length) return;
    const track = $("[data-gallery-track]", gallery);
    const count = $("[data-gallery-count]", gallery);
    shots.forEach((e) => {
      const fig = document.createElement("figure");
      fig.className = "g-card";
      fig.appendChild(makeImg(e, base));
      const cap = document.createElement("figcaption");
      cap.textContent = caption(e);
      fig.appendChild(cap);
      track.appendChild(fig);
    });
    gallery.hidden = false;
    const cards = $$(".g-card", track);
    const pad = (n) => String(n).padStart(2, "0");
    // 3D: each card turns toward you as it reaches the center, and its photo drifts inside the frame
    function tilt() {
      const mid = track.getBoundingClientRect().left + track.clientWidth / 2;
      let best = 0, bestD = Infinity;
      cards.forEach((c, i) => {
        const r = c.getBoundingClientRect();
        const d = (r.left + r.width / 2 - mid) / track.clientWidth; // -1..1-ish
        if (Math.abs(d) < bestD) { bestD = Math.abs(d); best = i; }
        if (still) return;
        const k = Math.max(-1, Math.min(1, d));
        c.style.setProperty("--ry", (-k * 18).toFixed(2) + "deg");
        c.style.setProperty("--sc", (1 - Math.abs(k) * 0.08).toFixed(3));
        c.style.setProperty("--px", (k * -26).toFixed(1) + "px");
      });
      count.textContent = pad(best + 1) + " / " + pad(cards.length);
      loadNear();
    }
    track.addEventListener("scroll", () => requestAnimationFrame(tilt), { passive: true });
    addEventListener("resize", tilt);
    tilt();
  }

  // section photos drift slightly slower than the page (parallax)
  const shots = $$(".shot");
  if (!still && shots.length) {
    jobs.push(() => {
      const vh = innerHeight;
      for (const s of shots) {
        const r = s.getBoundingClientRect();
        if (r.bottom < -50 || r.top > vh + 50) continue;
        const k = (r.top + r.height / 2 - vh / 2) / vh; // -1..1 across the viewport
        s.style.setProperty("--py", (k * -r.height * 0.12).toFixed(1) + "px");
      }
    });
  }

  // ---------- sign-up page (signup.html) ----------
  const form = $("#pass-form");
  if (form) setupSignup(form);

  function setupSignup(form) {
    const done = $("#pass-done");
    const formErr = $("#form-err");
    const today = new Date();
    const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
    const visit = form.elements.visit_date;
    if (visit) { visit.min = iso(today); const max = new Date(today); max.setDate(max.getDate() + 60); visit.max = iso(max); }
    const dob = form.elements.dob;
    if (dob) dob.max = iso(today);

    // phone: format as they type, (706) 555-0123
    const phone = form.elements.phone;
    phone.addEventListener("input", () => {
      const d = phone.value.replace(/\D/g, "").replace(/^1(?=\d{10})/, "").slice(0, 10);
      let out = d;
      if (d.length > 6) out = `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
      else if (d.length > 3) out = `(${d.slice(0, 3)}) ${d.slice(3)}`;
      phone.value = out;
    });

    const rules = {
      first_name: (v) => (v.trim() ? "" : "Enter your first name."),
      last_name: (v) => (v.trim() ? "" : "Enter your last name."),
      email: (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Enter a valid email."),
      phone: (v) => (v.replace(/\D/g, "").length === 10 ? "" : "Enter a 10-digit phone number."),
      dob: (v) => {
        if (!v) return "Enter your date of birth.";
        const d = new Date(v + "T00:00");
        if (isNaN(d) || d > today || d.getFullYear() < 1900) return "Enter a valid date of birth.";
        return "";
      },
      heard: (v) => (v ? "" : "Pick one."),
      visit_date: (v) => {
        if (!v) return "Pick a day.";
        return v < visit.min || v > visit.max ? "Pick a day in the next 60 days." : "";
      },
      visit_time: (v) => (v ? "" : "Pick a time.")
    };
    function check(name) {
      const el = form.elements[name];
      if (!el) return true;
      const val = el.value !== undefined ? el.value : (form.querySelector(`[name="${name}"]:checked`) || {}).value || "";
      const msg = rules[name](val || "");
      const field = form.querySelector(`[data-field="${name}"]`);
      if (field) {
        field.classList.toggle("bad", !!msg);
        const err = field.querySelector(".err");
        if (err) err.textContent = msg;
        field.querySelectorAll("input, select").forEach((i) => i.setAttribute("aria-invalid", msg ? "true" : "false"));
      }
      return !msg;
    }
    Object.keys(rules).forEach((name) => {
      const el = form.elements[name];
      if (!el) return;
      const list = el.length && !el.tagName ? Array.from(el) : [el];
      list.forEach((i) => {
        i.addEventListener("blur", () => { if (i.value) check(name); });
        i.addEventListener("change", () => check(name));
      });
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      formErr.textContent = "";
      const bad = Object.keys(rules).filter((n) => !check(n));
      const consent = form.elements.consent;
      const consentBox = consent.closest(".consent");
      consentBox.classList.toggle("bad", !consent.checked);
      if (!consent.checked) bad.push("consent");
      if (bad.length) {
        const first = form.elements[bad[0]];
        const target = first && first.length && !first.tagName ? first[0] : first;
        if (target) target.focus();
        formErr.textContent = bad.includes("consent") && bad.length === 1 ? "Please check the box to continue." : "A few fields need a look.";
        return;
      }
      const f = form.elements;
      const payload = {
        type: "free_day_pass",
        location: "Max Fitness Augusta",
        first_name: f.first_name.value.trim(),
        last_name: f.last_name.value.trim(),
        phone: "+1" + f.phone.value.replace(/\D/g, ""),
        email: f.email.value.trim(),
        dob: f.dob.value,
        heard_from: f.heard.value,
        visit_day: f.visit_date.value,
        visit_time: (form.querySelector('[name="visit_time"]:checked') || {}).value || "",
        consent: consent.checked,
        mf_extra: f.mf_extra ? f.mf_extra.value : "",
        consent_text_version: "one-week-pass-2026-10",
        submitted_at: new Date().toISOString(),
        page: location.href
      };
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = "Sending…"; form.setAttribute("aria-busy", "true");
      try {
        const res = await submitPassRequest(payload);
        showPass(payload, res);
      } catch (err) {
        btn.disabled = false; btn.textContent = "Submit"; form.removeAttribute("aria-busy");
        if (err && err.fields) {
          // the server checked the same rules: show its messages next to the fields
          Object.entries(err.fields).forEach(([name, msg]) => {
            const field = form.querySelector(`[data-field="${name}"]`) || (name === "consent" ? consentBox : null);
            if (!field) return;
            field.classList.add("bad");
            const e = field.querySelector(".err");
            if (e) e.textContent = msg;
          });
          formErr.textContent = "A few fields need a look.";
        } else if (err && err.status === 429) {
          formErr.innerHTML = "Too many tries from this connection. Give it a few minutes, or " + textUs() + ".";
        } else {
          formErr.innerHTML = "Couldn't reach us. Try again, or " + textUs() + ".";
        }
      }
    });

    function textUs() {
      const digits = TEXT_LINE_NUMBER.replace(/\D/g, "");
      return /^1?0{10}$/.test(digits) ? "text us" : `<a href="sms:+${digits.length === 10 ? "1" + digits : digits}">text us</a>`;
    }

    function showPass(p, res) {
      const fmtDay = (v) => new Date(v + "T12:00").toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
      $("#t-name").textContent = `${p.first_name} ${p.last_name}`;
      $("#t-day").textContent = fmtDay(p.visit_day);
      $("#t-time").textContent = p.visit_time;
      $("#t-code").textContent = res.pass_code;
      const texted = $("#t-texted");
      if (texted && res.texted) {
        const d = p.phone.replace(/\D/g, "").slice(-10);
        texted.textContent = `We just texted your pass to (${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}.`;
        texted.hidden = false;
      }
      form.closest(".su-body").hidden = true;
      done.hidden = false;
      scrollTo({ top: 0, behavior: still ? "auto" : "smooth" });
      $("h1", done).focus({ preventScroll: true });
    }
  }

  // POST JSON { first_name, last_name, phone (E.164), email, dob, heard_from, visit_day (YYYY-MM-DD),
  //   visit_time, consent, mf_extra (honeypot), consent_text_version, submitted_at, page }
  // → 200 { ok, pass_code, texted } · 400 { errors: {field: msg} } · 429 rate limited · 503 closed
  // Server: ~/cipher/support-line/maxfit/signup_server.py (validation, limits, pass code, the first text).
  async function submitPassRequest(payload) {
    if (PASS_ENDPOINT) {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 50000);   // the first text can take a few seconds to send
      let res, body = null;
      try {
        res = await fetch(PASS_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload), signal: ctl.signal });
        body = await res.json().catch(() => null);
      } finally {
        clearTimeout(timer);
      }
      if (res.ok && body && body.ok && body.pass_code) return body;
      const err = new Error("pass request failed");
      err.status = res.status;
      if (res.status === 400 && body && body.errors) err.fields = body.errors;
      throw err;
    }
    // prototype: no network, a local pass code so the success screen is real enough to demo
    const abc = "ACDEFGHJKMNPQRTUVWXY3479";
    let code = "MF-";
    for (let i = 0; i < 6; i++) code += abc[Math.floor(Math.random() * abc.length)];
    await new Promise((r) => setTimeout(r, 500));
    return { pass_code: code, texted: false };
  }

  queue();
})();
