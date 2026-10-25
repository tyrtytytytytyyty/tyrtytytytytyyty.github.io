// USA Ninja Challenge The Woodlands, concept v3 (2026-10-25). Renders every section from the
// north-star data (site-data.js) and runs the scroll motion. No sliders, no pickers, nothing to
// tap to see the page: scroll and it plays. The shuriken slice lives in slice.js.
(function () {
  "use strict";
  const D = window.NW;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v) => Math.max(0, Math.min(1, v));
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const store = {
    get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* private mode: fine */ } }
  };
  const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  const icon = (id) => (D.programs.find((p) => p.id === id) || {}).icon;

  // ---------- facts + images from the north star ----------
  $$("[data-f]").forEach((el) => { el.textContent = D[el.dataset.f]; });
  $$("[data-img]").forEach((el) => { el.src = D.images[el.dataset.img]; });
  $$("[data-icon]").forEach((el) => { el.src = icon(el.dataset.icon); });
  $$("[data-link]").forEach((el) => { el.href = D.links[el.dataset.link]; });

  const digits = D.textLine.replace(/\D/g, "");
  const smsHref = (body) => "sms:+" + (digits.length === 10 ? "1" + digits : digits) +
    "&body=" + encodeURIComponent(`${D.textKey} ${body || "I have a question:"}`);

  const fill = (sel, html) => { const el = $(sel); if (el) el.innerHTML = html; };
  fill("#mission", esc(D.mission).replace(/\*(.+?)\*/g, "<em>$1</em>"));
  fill("#why-grid", D.why.map(([e, b, s]) => `<li class="reveal"><span class="emo" aria-hidden="true">${e}</span><b>${esc(b)}</b><span>${esc(s)}</span></li>`).join(""));
  fill("#programs", D.programs.map((p) => `
    <li class="program">
      <figure class="ico"><img src="${p.icon}" alt="" loading="lazy"></figure>
      <div>
        <h3>${esc(p.name)}<small>ages ${p.ages}</small></h3>
        <p>${esc(p.desc)}</p>
        <p class="p-meta"><b>$${p.price}</b>/mo · ${esc(p.len)}</p>
      </div>
    </li>`).join(""));
  fill("#price-list", D.pricing.map(([b, s, n, per]) => `<li class="reveal"><b>${esc(b)}</b><span>${esc(s)}</span><em>${n}<small>${per}</small></em></li>`).join(""));
  fill("#party-sub", `for ${D.party.included} guests incl. the birthday ninja · +$${D.party.extra} each extra, up to ${D.party.max} · $${D.party.deposit} deposit holds the date`);
  fill("#party-points", D.party.points.map((t) => `<li class="reveal">${esc(t)}</li>`).join(""));
  fill("#party-fine", esc(D.party.fine));
  fill("#camp-figs", D.camps.figures.map(([a, b]) => `<div><dt>${a}</dt><dd>${esc(b)}</dd></div>`).join(""));
  fill("#camp-text", esc(D.camps.text));
  fill("#values", D.values.map((v) => `<li>${esc(v)}</li>`).join(""));
  fill("#faq-list", D.faq.map(([q, a]) => `<div class="reveal"><dt>${esc(q)}</dt><dd>${a ? esc(a) : `Text it to us and you'll get the answer right away. <a data-text-line data-body="${esc(q)}">Ask by text →</a>`}</dd></div>`).join(""));
  fill("#contact-list", [
    ["Directions", "Apple Maps", "https://maps.apple.com/?q=" + encodeURIComponent(D.name + " " + D.address)],
    ["Directions", "Google Maps", "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(D.name + " " + D.address)],
    ["Phone", D.phone, "tel:+1" + D.phone.replace(/\D/g, "")],
    ["Email", D.email, "mailto:" + D.email],
    ["Member's Portal", "iClassPro", D.links.portal]
  ].map(([k, v, h]) => `<li><a href="${esc(h)}">${esc(k)} <span>${esc(v)}</span></a></li>`).join(""));
  const SOC = {
    Instagram: '<path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zM17.3 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zM12 3.8c2.7 0 3 0 4 .1 2.7.1 4 1.4 4.1 4.1.1 1 .1 1.3.1 4s0 3-.1 4c-.1 2.7-1.4 4-4.1 4.1-1 .1-1.3.1-4 .1s-3 0-4-.1c-2.7-.1-4-1.4-4.1-4.1-.1-1-.1-1.3-.1-4s0-3 .1-4C4 5.3 5.3 4 8 3.9c1-.1 1.3-.1 4-.1zM12 2c-2.7 0-3.1 0-4.1.1C4.3 2.2 2.2 4.3 2.1 7.9 2 8.9 2 9.3 2 12s0 3.1.1 4.1c.1 3.6 2.2 5.7 5.8 5.8 1 .1 1.4.1 4.1.1s3.1 0 4.1-.1c3.6-.1 5.7-2.2 5.8-5.8.1-1 .1-1.4.1-4.1s0-3.1-.1-4.1c-.1-3.6-2.2-5.7-5.8-5.8C15.1 2 14.7 2 12 2z"/>',
    Facebook: '<path d="M14 8V6.2c0-.8.2-1.2 1.4-1.2H17V2h-2.5C11.6 2 10.6 3.4 10.6 5.9V8H8.5v3h2.1v11H14V11h2.6l.4-3H14z"/>',
    YouTube: '<path d="M21.6 7.2a2.6 2.6 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.6 2.6 0 0 0 2.4 7.2 27 27 0 0 0 2 12a27 27 0 0 0 .4 4.8 2.6 2.6 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.6 2.6 0 0 0 1.8-1.8A27 27 0 0 0 22 12a27 27 0 0 0-.4-4.8zM10 15V9l5.2 3L10 15z"/>'
  };
  fill("#socials", D.socials.map(([n, h, u]) => `<li class="reveal"><a href="${esc(u)}"><span class="s-ic"><svg viewBox="0 0 24 24" aria-hidden="true">${SOC[n] || ""}</svg></span><span><b>${n}</b><small>${esc(h)}</small></span><span class="go">→</span></a></li>`).join(""));

  // until the line's real number is set, show a label instead of a fake number
  if (/^0+$/.test(digits.slice(1))) $$('[data-f="textLine"]').forEach((el) => { el.textContent = "Text us"; });

  // every "text us" link, including the FAQ ones rendered above
  $$("[data-text-line]").forEach((a) => { a.href = smsHref(a.dataset.body || ""); });

  // ---------- hours, in the gym's own time zone ----------
  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const t12 = (h) => { const hh = Math.floor(h), mm = Math.round((h - hh) * 60); return `${hh % 12 || 12}${mm ? ":" + String(mm).padStart(2, "0") : ""} ${hh >= 12 ? "PM" : "AM"}`; };
  const pt = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: D.timeZone, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", hour12: false }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  const now = new Date(+pt.year, +pt.month - 1, +pt.day, +pt.hour % 24, +pt.minute);
  const hr = now.getHours() + now.getMinutes() / 60;
  const openBlock = D.hours[now.getDay()].find(([a, b]) => hr >= a && hr < b);
  const nextOpen = () => {
    for (let i = 0; i < 8; i++) {
      const d = (now.getDay() + i) % 7;
      const blk = D.hours[d].find(([a]) => i > 0 || a > hr);
      if (blk) return `${i === 0 ? "today" : i === 1 ? "tomorrow" : DAYS[d]} at ${t12(blk[0])}`;
    }
  };
  const pill = $("#open-now");
  if (pill) {
    pill.classList.toggle("open", !!openBlock);
    $("b", pill).textContent = openBlock ? `Open now · until ${t12(openBlock[1])}` : `Opens ${nextOpen()}`;
  }
  fill("#week", [1, 2, 3, 4, 5, 6, 0].map((d) => `<li${d === now.getDay() ? ' class="today"' : ""}><b>${DAYS[d]}</b><span>${D.hours[d].map(([a, b]) => `${t12(a)} – ${t12(b)}`).join("<br>")}</span></li>`).join(""));

  // ---------- mission line: words light up as the pinned scene scrolls ----------
  const say = $(".say p");
  let words = [];
  if (say) {
    say.innerHTML = say.innerHTML.replace(/(<em>.*?<\/em>|\S+)/g, (w) => w.startsWith("<em>") ? `<span class="pk">${w.slice(4, -5)}</span>` : `<span>${w}</span>`);
    words = $$("span", say);
    if (still) words.forEach((w) => w.classList.add("on"));
  }

  // ---------- one rAF loop writes --p on every scene ----------
  const scenes = $$("[data-scene]"), bar = $("#topbar"), hero = $(".hero"), dock = $(".dock");
  let ticking = false;
  function frame() {
    ticking = false;
    const vh = innerHeight;
    for (const el of scenes) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) continue;
      const total = el.offsetHeight - vh;
      const pr = total > 4 ? clamp(-r.top / total) : clamp(-r.top / r.height);
      el.style.setProperty("--p", pr.toFixed(4));
      if (say && el.contains(say)) { const n = Math.ceil(pr * 1.3 * words.length); words.forEach((w, i) => w.classList.toggle("on", i < n)); }
    }
    const past = scrollY > (hero ? hero.offsetHeight - vh * 0.5 : 40);
    if (bar) bar.classList.toggle("solid", past);
    if (dock) dock.classList.toggle("show", past);
  }
  const kick = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener("scroll", kick, { passive: true });
  addEventListener("resize", kick);
  frame();

  // ---------- reveal on view ----------
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    io.unobserve(e.target);
  }), { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal, .program, .shot, .pass-card").forEach((el) => io.observe(el));

  // values slam in one after another
  const vals = $$("#values li");
  if (vals.length) new IntersectionObserver((es, o) => {
    if (!es[0].isIntersecting) return;
    o.disconnect();
    vals.forEach((li, i) => setTimeout(() => li.classList.add("in"), still ? 0 : i * 140));
  }, { threshold: 0.5 }).observe($("#values"));

  // if the slice module (CDN three.js) never loads, show the headings and drop the black cover
  setTimeout(() => {
    if (window.NW_SLICE) return;
    document.documentElement.classList.remove("js");
    const c = $("#cut-intro"); if (c) c.classList.add("gone");
  }, 4000);

  // ---------- free trial sheet: once per visit, after real scrolling ----------
  const sheet = $("#trial-sheet");
  if (sheet && !store.get("nw-sheet")) {
    const show = () => {
      if (scrollY < innerHeight * 2.4 || store.get("nw-sheet")) return;
      store.set("nw-sheet", "1");
      removeEventListener("scroll", show);
      setTimeout(() => { sheet.hidden = false; }, 300);
    };
    addEventListener("scroll", show, { passive: true });
  }
  // "Text us": a one-time consent note, then Messages opens with any prefilled question
  const tsheet = $("#text-sheet"), go = $("#text-go");
  if (tsheet) $$("[data-text-line]").forEach((a) => a.addEventListener("click", (e) => {
    if (store.get("nw-text-ok")) return;
    e.preventDefault();
    go.href = a.href;
    tsheet.hidden = false;
  }));
  if (go) go.addEventListener("click", () => { store.set("nw-text-ok", "1"); tsheet.hidden = true; });
  $$("[data-sheet-close]").forEach((b) => b.addEventListener("click", () => { $$(".sheet").forEach((x) => { x.hidden = true; }); }));
  addEventListener("keydown", (e) => { if (e.key === "Escape") $$(".sheet").forEach((x) => { x.hidden = true; }); });
})();
