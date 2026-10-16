// Page behavior with no CDN dependency, so it works even if the 3D fails.
(function () {
// reveal-on-scroll (plain scroll check; IntersectionObserver-free so it never strands content hidden)
  const pending = Array.from(document.querySelectorAll(".reveal"));
  function reveal() {
    const limit = innerHeight * 0.92;
    for (let i = pending.length - 1; i >= 0; i--) {
      if (pending[i].getBoundingClientRect().top < limit) { pending[i].classList.add("in"); pending.splice(i, 1); }
    }
  }
  addEventListener("scroll", reveal, { passive: true });
  addEventListener("resize", reveal);
  reveal();

  // texting preview: messages arrive one by one when the phone scrolls into view
  const msgs = Array.from(document.querySelectorAll(".msg"));
  const phone = document.querySelector(".phone");
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let played = false;
  function playThread() {
    if (played || !phone) return;
    if (!still && phone.getBoundingClientRect().top > innerHeight * 0.75) return;
    played = true;
    msgs.forEach((m, i) => setTimeout(() => m.classList.add("show"), still ? 0 : 500 + i * 1100));
  }
  if (!phone) msgs.forEach((m) => m.classList.add("show"));
  else { addEventListener("scroll", playThread, { passive: true }); playThread(); }
  // failsafe: never leave the thread hidden
  setTimeout(() => { played = true; msgs.forEach((m) => m.classList.add("show")); }, 12000);
  const textBtn = document.getElementById("text-btn");
  if (textBtn) textBtn.addEventListener("click", (e) => e.preventDefault());

  // open/closed badge from the hours table
const badge = document.getElementById("open-now");
if (badge && window.HOURS) {
  const now = new Date();
  const today = window.HOURS[now.getDay()];
  if (today === "24") { badge.textContent = "Open now"; badge.classList.add("open"); }
  else if (today) {
    const [o, c] = today;
    const h = now.getHours() + now.getMinutes() / 60;
    const open = h >= o && h < c;
    badge.textContent = open ? "Open now" : "Closed now";
    badge.classList.add(open ? "open" : "closed");
  }
}

// sticky call/pass bar appears once the hero is behind you
const dock = document.querySelector(".dock");
if (dock) {
  const onScroll = () => dock.classList.toggle("show", scrollY > innerHeight * 0.6);
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

// highlight today's row in the hours table
const row = document.querySelector(`.hours tr[data-day="${new Date().getDay()}"]`);
if (row) row.classList.add("today");

})();
