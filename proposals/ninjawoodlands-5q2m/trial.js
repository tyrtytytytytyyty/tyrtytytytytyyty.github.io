// Trial class: the parent gives a phone number and nothing else. The text line collects the rest
// (child, age, time, name) in the conversation. The form posts to the live line; if the line is
// on, a real text goes out. If it's off or unreachable, the thread below plays by itself
// instead, so the page still reads on a screen share with no clicking.
const TRIAL_ENDPOINT = "https://maxfit-signup.thecoolwolfguy09.workers.dev/nw/trial";
(function () {
  "use strict";
  const D = window.NW;
  const $ = (s, r = document) => r.querySelector(s);
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, still ? 0 : ms));

  const form = $("#trial-form"), err = $("#form-err"), phoneIn = $("#f-phone");
  const digitsOf = (v) => { const d = String(v).replace(/\D/g, ""); return d.length === 11 && d[0] === "1" ? d.slice(1) : d; };
  const pretty = (d) => `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  phoneIn.addEventListener("input", () => {
    const d = digitsOf(phoneIn.value);
    if (d.length === 10) phoneIn.value = pretty(d);
  });

  // trial slots come from the live schedule in the north star (site-data.js trialTimes)
  const WD = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const nextDay = (wd) => { const d = new Date(); d.setDate(d.getDate() + ((wd - d.getDay() + 7) % 7 || 7)); return d; };
  const fmt = (d) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const slots = (id) => D.trialTimes[id].map(([day, time]) => ({ d: nextDay(WD[day]), time })).sort((x, y) => x.d - y.d);
  const ninjas = D.programs.find((p) => p.id === "ninjas68");
  const junior = D.programs.find((p) => p.id === "junior");
  const [s1, s2] = slots("ninjas68");
  const lily = slots("junior").find((x) => x.d.getDay() === s2.d.getDay()) || slots("junior")[0];

  const NEW_FAMILY = [
    ["in", `${D.greeting} This is ${D.name} ${D.location}. Thanks for booking a trial class! What's your ninja's first name and age?`],
    ["out", "Mason, he's 7"],
    ["in", `Awesome! At 7, Mason would be in ${ninjas.name} (ages ${ninjas.ages}): ${ninjas.len.toLowerCase()}, all about strength, agility and confidence.\n\nOpen trial spots: ${fmt(s1.d)} at ${s1.time} or ${fmt(s2.d)} at ${s2.time}. Which works?`],
    ["out", `${fmt(s2.d).split(",")[0]} works`],
    ["in", `Done ✅ Mason's trial is ${fmt(s2.d)} at ${s2.time} at ${D.address.split(",")[0]}. Quick tip: shorts, a t-shirt, bare feet, and no jewelry. What's your name and email, so the front desk has you on file?`],
    ["out", "Sarah Lee, sarah@email.com"],
    ["in", "Thanks Sarah! You're all set. We'll text you a reminder the day before, and parents can watch from the viewing area. Any questions, just reply here."],
    ["sys", "Trial booked · front desk notified"]
  ];
  const RETURNING = [
    ["div", "Same line · a family already in the system"],
    ["in", `Hey Sarah! Welcome back 👋 Mason's still in ${fmt(s2.d).split(",")[0]} ${ninjas.name}. Is this trial for one of his siblings?`],
    ["out", "Yes! Lily, she's 4"],
    ["in", `Love it. Lily would be in ${junior.name} (ages ${junior.ages}), ${junior.len.toLowerCase()}, and siblings get a discount if she joins. There's a trial spot ${fmt(lily.d)} at ${lily.time}. Want it?`],
    ["sys", "Recognized by phone number · only this family's info is ever shown"]
  ];

  const thread = $("#thread");
  const add = (cls, text) => { const b = document.createElement("div"); b.className = "bub " + cls; b.textContent = text; thread.appendChild(b); b.scrollIntoView({ block: "nearest", behavior: still ? "auto" : "smooth" }); return b; };
  async function play(lines) {
    for (const [who, text] of lines) {
      if (who === "in") { const t = add("in typing", ""); t.innerHTML = "<i></i><i></i><i></i>"; await wait(900 + Math.min(text.length * 12, 1400)); t.remove(); }
      else await wait(who === "out" ? 1300 : 500);
      add(who, text);
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const d = digitsOf(phoneIn.value);
    err.textContent = "";
    $(".field").classList.remove("bad");
    if (d.length !== 10) { err.textContent = "Enter a 10-digit mobile number."; $(".field").classList.add("bad"); phoneIn.focus(); return; }
    if (!$("#f-consent").checked) { err.textContent = "Check the box so we can text you."; return; }
    const btn = $("button[type=submit]", form);
    btn.disabled = true;
    btn.textContent = "Texting you…";
    let res = null;
    try {
      const ctl = new AbortController();
      setTimeout(() => ctl.abort(), 15000);
      const r = await fetch(TRIAL_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: d, consent: true, website: $("#f-website").value }), signal: ctl.signal });
      res = await r.json().catch(() => null);
      if (r.status === 400 && res && res.errors) {
        err.textContent = Object.values(res.errors)[0];
        btn.disabled = false; btn.textContent = "Text Me";
        return;
      }
    } catch (e) { res = null; }
    $("#step-form").hidden = true;
    $("#step-done").hidden = false;
    $("#ph-num").textContent = "to " + pretty(d);
    scrollTo({ top: 0, behavior: still ? "auto" : "smooth" });
    $("#done-title").focus({ preventScroll: true });
    if (res && res.texted) {
      // a real text is on its way: no fake thread, just point them at their phone
      $(".phone").hidden = true;
      $("#demo-note").textContent = "Reply to it like a parent would. Ask anything, book a class.";
      return;
    }
    $("#done-title").textContent = "Here's the text you'd get.";
    await wait(700);
    await play(NEW_FAMILY);
    await wait(1400);
    await play(RETURNING);
  });
})();
