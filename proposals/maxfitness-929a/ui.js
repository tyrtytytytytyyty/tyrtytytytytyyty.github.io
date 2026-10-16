// The text line. Set this to the real number and every "text us" link on the site follows it.
const TEXT_LINE_NUMBER = "+1 (000) 000-0000";

// TODO(backend): set this to the day-pass endpoint once it exists (see submitPassRequest below).
const PASS_ENDPOINT = null;

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

  // ---------- atmosphere: red light that travels down the page with you ----------
  // Keyframes over page progress p (0 = top, 1 = bottom). Only transform/opacity change, so it stays cheap.
  const g1 = $(".g1"), g2 = $(".g2"), g3 = $(".g3");
  const K = [
    // p,   g1 x,y(vw,vh) s  o     g2 x,y s  o      g3 y  o
    [0.00, -28, -42, 0.90, 1.00,  40, 50, 0.70, 0.20,  80, 0.30],
    [0.18,  30, -30, 0.80, 0.70, -30, 40, 0.90, 0.55,  70, 0.55],
    [0.40, -35,  10, 0.95, 0.55,  35, -10, 0.80, 0.75, 60, 0.45],
    [0.62,  25, -20, 0.85, 0.80, -40, 45, 0.95, 0.50,  65, 0.55],
    [0.82, -20,  30, 0.80, 0.55,  30, -25, 0.90, 0.85, 75, 0.35],
    [1.00,   0,  45, 1.05, 0.95, -20, -40, 0.70, 0.55, 90, 0.20]
  ];
  const lerp = (a, b, t) => a + (b - a) * t;
  function atmo() {
    if (!g1) return;
    const max = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const p = still ? 0 : Math.min(1, Math.max(0, scrollY / max));
    let i = 0; while (i < K.length - 2 && p > K[i + 1][0]) i++;
    const a = K[i], b = K[i + 1];
    const t = (p - a[0]) / (b[0] - a[0]);
    const s = t * t * (3 - 2 * t); // smoothstep between stops
    const v = a.map((x, k) => lerp(x, b[k], s));
    g1.style.transform = `translate(${v[1]}vw, ${v[2]}vh) scale(${v[3]})`; g1.style.opacity = v[4];
    g2.style.transform = `translate(${v[5]}vw, ${v[6]}vh) scale(${v[7]})`; g2.style.opacity = v[8];
    g3.style.transform = `translate(0, ${v[9]}vh)`; g3.style.opacity = v[10];
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
        date_of_birth: f.dob.value,
        heard_about_us: f.heard.value,
        preferred_visit_date: f.visit_date.value,
        preferred_visit_time: (form.querySelector('[name="visit_time"]:checked') || {}).value || "",
        sms_consent: true,
        consent_text_version: "one-week-pass-2026-10",
        submitted_at: new Date().toISOString(),
        page: location.href
      };
      const btn = form.querySelector('button[type="submit"]');
      btn.disabled = true; btn.textContent = "Sending…";
      try {
        const res = await submitPassRequest(payload);
        showPass(payload, res.pass_id);
      } catch (err) {
        btn.disabled = false; btn.textContent = "Submit";
        formErr.textContent = "That didn't go through. Try again, or call (706) 396-4653.";
      }
    });

    function showPass(p, id) {
      const fmtDay = (v) => new Date(v + "T12:00").toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
      $("#t-name").textContent = `${p.first_name} ${p.last_name}`;
      $("#t-day").textContent = fmtDay(p.preferred_visit_date);
      $("#t-time").textContent = p.preferred_visit_time;
      $("#t-code").textContent = id;
      form.closest(".su-body").hidden = true;
      done.hidden = false;
      scrollTo({ top: 0, behavior: still ? "auto" : "smooth" });
      $("h1", done).focus({ preventScroll: true });
    }
  }

  // TODO(backend): replace the stub with the real POST once the endpoint exists. The payload is JSON:
  //   { type, location, first_name, last_name, phone (E.164), email, date_of_birth (YYYY-MM-DD),
  //     heard_about_us, preferred_visit_date (YYYY-MM-DD), preferred_visit_time, sms_consent,
  //     consent_text_version, submitted_at (ISO), page }
  //   const res = await fetch(PASS_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  //   if (!res.ok) throw new Error("pass request failed"); return await res.json();  // expect { pass_id }
  async function submitPassRequest(payload) {
    if (PASS_ENDPOINT) {
      const res = await fetch(PASS_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error("pass request failed");
      return res.json();
    }
    // prototype: no network, a local pass code so the success screen is real enough to demo
    const abc = "ACDEFGHJKMNPQRTUVWXY3479";
    let code = "MF-";
    for (let i = 0; i < 6; i++) code += abc[Math.floor(Math.random() * abc.length)];
    await new Promise((r) => setTimeout(r, 500));
    return { pass_id: code };
  }

  queue();
})();
