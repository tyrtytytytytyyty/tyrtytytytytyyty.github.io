// Darrell Waltrip Honda concept: intro lights, live hours, text-line demo, service-by-phone-number form, payment calculator.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- intro (Remotion render) ---------- */
  const intro = $("#intro");
  const vid = $("#intro-video");
  const endIntro = () => { intro.classList.add("out"); setTimeout(() => intro.classList.add("gone"), 650); };
  let seen = false;
  try { seen = !!sessionStorage.getItem("dw-intro"); sessionStorage.setItem("dw-intro", "1"); } catch (e) {}
  if (reduce || seen) intro.classList.add("gone");
  else {
    vid.src = innerHeight > innerWidth ? "media/intro-v.mp4" : "media/intro-h.mp4";
    vid.addEventListener("ended", endIntro);
    vid.play().catch(endIntro);
    $("#skip").onclick = endIntro;
    setTimeout(endIntro, 7000);
  }

  /* ---------- hours (Central time) ---------- */
  const TZ = "America/Chicago";
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const nowCT = () => {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: TZ, year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", hour12: false, weekday: "short" }).formatToParts(new Date()).map((x) => [x.type, x.value]));
    const d = new Date(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute);
    return d;
  };
  const daysInMonth = (d) => new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  // Sunday sales only on the last two Sundays of the month, 12 to 6
  const sundayOpen = (d) => d.getDay() === 0 && d.getDate() + 14 > daysInMonth(d);
  const salesHours = (d) => {
    if (d.getDay() === 0) return sundayOpen(d) ? [12, 18] : null;
    return [9, 20];
  };
  const fmt = (h) => (h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`);
  const now = nowCT();
  const today = salesHours(now);
  const hr = now.getHours() + now.getMinutes() / 60;
  const open = today && hr >= today[0] && hr < today[1];
  $("#open-dot").classList.toggle("open", !!open);
  $("#open-label").textContent = open ? `Open now · until ${fmt(today[1])}` : "Closed now · text us anytime";
  const tbl = $("#hours");
  for (let i = 1; i <= 7; i++) {
    const day = i % 7;
    const tr = document.createElement("tr");
    if (day === now.getDay()) tr.className = "today";
    const label = day === 0 ? "12 PM to 6 PM, last two Sundays" : "9 AM to 8 PM";
    tr.innerHTML = `<td>${DAYS[day]}</td><td>${label}</td>`;
    tbl.appendChild(tr);
  }

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))), { threshold: 0.15 });
  $$(".reveal").forEach((el) => io.observe(el));

  /* ---------- text line demo ---------- */
  const thread = $("#thread");
  const chips = $("#chips");
  const wait = (ms) => new Promise((r) => setTimeout(r, reduce ? 0 : ms));
  const add = (cls, html) => {
    const m = document.createElement("div");
    m.className = "msg " + cls;
    m.innerHTML = html;
    thread.appendChild(m);
    thread.scrollTop = thread.scrollHeight;
    return m;
  };
  const say = async (html, ms = 900) => {
    const t = add("them typing", "<i></i><i></i><i></i>");
    await wait(ms);
    t.remove();
    return add("them", html);
  };
  const nextSunday = () => {
    const d = nowCT();
    d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || 7));
    return d;
  };
  const shortDate = (d) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

  const SCRIPTS = {
    "Is my car ready?": async () => {
      await say("Hi Alex! Looking up your <b>2021 CR-V</b> from your number.", 700);
      await say("It's in the final wash and quality check. Ready around <b>3:30 PM</b> today. I'll text you the moment it's done.");
      add("sys", "Looked up by phone number · demo data, made-up customer");
    },
    "Any recalls on mine?": async () => {
      await say("Checking your <b>2019 Civic</b>... One open recall on it. It's a demo example, not a real notice. It's free to fix and takes about an hour.", 1100);
      add("sys", "Matched to the VIN on file · only this customer's car");
      offer(nextSlots(3), async (c) => { await say(`Booked for <b>${c}</b>. I'll text you the day before. 👍`); });
    },
    "Approve a repair": async () => {
      await say("Update on your CR-V: your tech measured the front brake pads at 3 mm, which is low.");
      await say("Recommended: front pads and rotors, <b>$412.50</b>, done by 4 PM today. Reply YES to approve or NO to skip.", 900);
      offer(["YES, approve", "NO, skip it"], async (c) => {
        if (c.startsWith("YES")) { add("sys", "Approval recorded · your service advisor notified"); await say("Approved. We'll text you when it's ready. 🔧"); }
        else { add("sys", "Declined, noted on the repair order"); await say("No problem. We've noted it and left it off. We'll flag it again at your next visit."); }
      });
    },
    "When's my next service?": async () => {
      await say("Your CR-V is at 28,400 miles. Your next service is the <b>30,000-mile</b> visit, due in about 2 months.");
      await say("I'll text you a reminder a couple of weeks before. Want a time now?", 700);
      offer(nextSlots(2), async (c) => { await say(`Booked for <b>${c}</b>. 👍`); });
    },
    "Is 0% APR on a CR-V?": async () => {
      await say("Right now we have 0% APR on select new models. Which ones qualify changes month to month.");
      await say("Want me to have a sales advisor text you the exact CR-V terms today?", 700);
      offer(["Yes, text me", "Just browsing"], async (c) => {
        if (c === "Yes, text me") { add("sys", "Handed to Sales with this conversation attached"); await say("Done. A sales advisor will text you shortly. 👍"); }
        else await say("No problem. I'm here whenever you've got a question.");
      });
    },
    "Book an oil change": async () => {
      await say("Happy to. Here are the next openings in our service drive:");
      const slots = nextSlots(3);
      offer(slots, async (c) => {
        await say(`You're booked for <b>${c}</b>. I'll text you a reminder the day before. Need a loaner or a ride?`);
        offer(["I'll wait there", "Need a ride"], async (r) => { await say(r === "Need a ride" ? "Got it, I've added a shuttle request. Service will confirm it." : "Sounds good. The waiting area has Wi-Fi and coffee. See you then."); });
      });
    },
    "Open this Sunday?": async () => {
      const s = nextSunday();
      const yes = sundayOpen(s);
      await say(yes ? `Yes! This Sunday (${s.toLocaleDateString("en-US",{month:"short",day:"numeric"})}) is one of our open Sundays. Sales is here 12 to 6 PM.` : `Sales is closed this Sunday (${s.toLocaleDateString("en-US",{month:"short",day:"numeric"})}). We open on the last two Sundays of each month, 12 to 6 PM. Monday through Saturday we're here 9 to 8.`);
    },
    "What's my trade worth?": async () => {
      await say("I can get that started. What's the year, model and mileage?");
      offer(["2019 Civic, 48k miles"], async () => {
        await say("Perfect. I'll start a Kelley Blue Book Instant Cash Offer, and an appraiser will text you a firm number.");
        add("sys", "Handed to Used Car Sales");
      });
    },
    "Do you do recall work?": async () => {
      await say("We do. Recall appointments also have their own line at 833-650-1441, or I can book it right here.");
      await say("Text me your VIN, or the year and model, and I'll check for open recalls.", 700);
    },
    "I have bad credit": async () => {
      await say("You're not alone, and it's not a dead end. We work with a lot of credit situations, and most approvals need no money down.");
      await say("You can get pre-approved online in a few minutes, or I can have our finance team text you privately.", 800);
      offer(["Have finance text me"], async () => { add("sys", "Handed to Finance, marked private"); await say("Done. They'll reach out soon."); });
    },
  };

  const nextSlots = (n) => {
    // service: Mon-Fri 7-6, Sat 8-4
    const out = [];
    const d = nowCT();
    d.setMinutes(0);
    for (let i = 1; out.length < n && i < 10; i++) {
      const day = new Date(d); day.setDate(d.getDate() + i);
      if (day.getDay() === 0) continue;
      const times = day.getDay() === 6 ? ["8:00 AM", "10:30 AM"] : ["7:30 AM", "11:00 AM", "2:30 PM"];
      out.push(`${shortDate(day)}, ${times[(i + out.length) % times.length]}`);
    }
    return out;
  };

  let busy = false;
  const offer = (opts, cb) => {
    const row = document.createElement("div");
    row.className = "slots";
    opts.forEach((o) => {
      const b = document.createElement("button");
      b.type = "button"; b.textContent = o;
      b.onclick = async () => { row.remove(); add("me", o); await cb(o); };
      row.appendChild(b);
    });
    thread.appendChild(row);
    thread.scrollTop = thread.scrollHeight;
  };
  const ask = async (q) => {
    if (busy) return;
    busy = true;
    $$(".slots", thread).forEach((s) => s.remove());
    add("me", q);
    await wait(350);
    if (SCRIPTS[q]) await SCRIPTS[q]();
    else {
      await say("Good question. I've passed it to the right person on our team, and they'll text you back here.");
      add("sys", "Handed to the team with full context");
    }
    busy = false;
  };
  Object.keys(SCRIPTS).forEach((q) => {
    const c = document.createElement("button");
    c.type = "button"; c.className = "chip"; c.textContent = q;
    c.onclick = () => ask(q);
    chips.appendChild(c);
  });
  // greet once the phone scrolls into view
  let greeted = false;
  new IntersectionObserver(async (es) => {
    if (greeted || !es[0].isIntersecting) return;
    greeted = true;
    await say("Hey! This is Darrell Waltrip Honda. Ask me anything, from service times to payments. Tap a question below to try it.", 700);
  }, { threshold: 0.4 }).observe($(".phone"));
  // buttons elsewhere that send a question into the thread
  $$("[data-ask]").forEach((el) => el.addEventListener("click", (e) => {
    e.preventDefault();
    $("#text").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    setTimeout(() => { greeted = true; ask(el.dataset.ask); }, 700);
  }));
  $$("[data-goto]").forEach((el) => el.addEventListener("click", () => $(el.dataset.goto).scrollIntoView({ behavior: "smooth" })));

  /* ---------- service: phone number only -> Worker /dw/service ---------- */
  const SERVICE_ENDPOINT = "https://maxfit-signup.thecoolwolfguy09.workers.dev/dw/service";
  const book = $("#book");
  const bErr = $("#book-err");
  const digitsOf = (s) => { const d = String(s || "").replace(/\D/g, ""); return d.length === 11 && d[0] === "1" ? d.slice(1) : d; };
  const pretty = (d) => `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
  book.addEventListener("submit", async (e) => {
    e.preventDefault();
    const d = digitsOf($("#b-phone").value);
    bErr.textContent = "";
    $(".field", book).classList.remove("bad");
    if (d.length !== 10) { bErr.textContent = "Enter a 10-digit mobile number."; $(".field", book).classList.add("bad"); $("#b-phone").focus(); return; }
    if (!$("#b-consent").checked) { bErr.textContent = "Check the box so we can text you."; return; }
    const btn = $("#book-btn");
    btn.disabled = true; btn.textContent = "Sending...";
    let res = null, status = 0;
    try {
      const ctl = new AbortController();
      setTimeout(() => ctl.abort(), 15000);
      const r = await fetch(SERVICE_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: d, consent: true, website: $("#b-website").value }), signal: ctl.signal });
      status = r.status;
      res = await r.json().catch(() => null);
    } catch (err) { res = null; }
    btn.disabled = false; btn.textContent = "Text me open times";
    if (status === 400 && res && res.errors) { bErr.textContent = Object.values(res.errors)[0]; return; }
    if (status === 429) { bErr.textContent = "Too many tries from this connection. Please wait a bit and try again."; return; }
    if (!res || !res.ok) { bErr.textContent = "We couldn't reach the text line just now. Try again in a minute, or call 855-996-6920."; return; }
    $("#book-step").hidden = true;
    $("#book-done").hidden = false;
    $("#done-big").textContent = res.texted ? "Check your phone." : "Got it.";
    $("#done-text").textContent = res.texted
      ? `We just texted ${pretty(d)} from Darrell Waltrip Honda service. Reply with your vehicle and what it needs, and we'll get you a time.`
      : `We saved ${pretty(d)}. This demo line is not live right now, so no text went out.`;
    $("#done-big").scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
  });
  $("#book-again").onclick = () => {
    $("#book-done").hidden = true; $("#book-step").hidden = false;
    $("#b-phone").value = ""; $("#b-consent").checked = false; bErr.textContent = "";
  };

  /* ---------- payment ---------- */
  let term = 60;
  const money = (n) => "$" + Math.round(n).toLocaleString("en-US");
  const calc = () => {
    const price = +$("#price").value, down = +$("#down").value, apr = +$("#apr").value;
    $("#o-price").textContent = money(price);
    $("#o-down").textContent = money(down);
    $("#o-apr").textContent = apr.toFixed(2) + "%";
    const P = Math.max(0, price - down), r = apr / 1200;
    const m = r === 0 ? P / term : (P * r) / (1 - Math.pow(1 + r, -term));
    $("#monthly").textContent = money(m);
    $("#calc-detail").textContent = `${money(P)} financed over ${term} months · ${money(m * term - P)} total interest`;
  };
  ["price", "down", "apr"].forEach((id) => $("#" + id).addEventListener("input", calc));
  $$(".term button").forEach((b) => b.addEventListener("click", () => {
    term = +b.dataset.term;
    $$(".term button").forEach((x) => x.classList.toggle("on", x === b));
    calc();
  }));
  calc();
})();
