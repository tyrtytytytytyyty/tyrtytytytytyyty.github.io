(() => {
  "use strict";

  const counter = document.getElementById("gb-screen-counter");
  const steps = Array.from(document.querySelectorAll(".gb-story-step"))
    .sort((a, b) => Number(a.dataset.gbStep) - Number(b.dataset.gbStep));
  const totalSteps = 4;
  let activeStep = null;
  const trackedSteps = new Set();

  window.gymbuddyTrack?.("page_view");

  const stepNumber = (step, index) => {
    const value = Number(step && step.dataset.gbStep);
    return Number.isFinite(value) && value > 0 ? value : index + 1;
  };

  const formatNumber = (number) => String(number).padStart(2, "0");


  function showStep(step, index) {
    const number = stepNumber(step, index);
    const label = formatNumber(number);
    if (counter) counter.textContent = `${label} / ${formatNumber(totalSteps)}`;
  }

  function setActive(step) {
    if (!step) return;
    if (activeStep !== step) {
      activeStep?.classList.remove("is-active");
      activeStep?.removeAttribute("aria-current");
      activeStep = step;
      activeStep.classList.add("is-active");
      activeStep.setAttribute("aria-current", "step");
    }

    const index = steps.indexOf(step);
    showStep(step, index);
    if (!trackedSteps.has(step)) {
      trackedSteps.add(step);
      window.gymbuddyTrack?.("walkthrough_step", {
        step: stepNumber(step, index),
        total_steps: totalSteps
      });
    }
  }

  if (steps.length) {
    activeStep = steps[0];
    activeStep.classList.add("is-active");
    activeStep.setAttribute("aria-current", "step");
    showStep(activeStep, 0);
  } else {
    showStep(null, 0);
  }

  function closestToViewportCenter(candidates) {
    const center = window.innerHeight / 2;
    let closest = null;
    let closestDistance = Infinity;

    for (const step of candidates) {
      const bounds = step.getBoundingClientRect();
      if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) continue;
      const distance = Math.abs((bounds.top + bounds.bottom) / 2 - center);
      if (distance < closestDistance) {
        closest = step;
        closestDistance = distance;
      }
    }
    return closest;
  }

  /* Phones: the steps are a horizontal swipe deck (see the CSS "Mobile story"
     block), so the active card is the one snapped to the deck's left edge. */
  const deck = document.querySelector(".gb-story-steps");
  const phoneLayout = window.matchMedia("(max-width: 660px)");

  const deckStart = () => deck.getBoundingClientRect().left + parseFloat(getComputedStyle(deck).paddingLeft);

  function closestToDeckStart(candidates) {
    const left = deckStart();
    let closest = null;
    let closestDistance = Infinity;
    for (const step of candidates) {
      const distance = Math.abs(step.getBoundingClientRect().left - left);
      if (distance < closestDistance) {
        closest = step;
        closestDistance = distance;
      }
    }
    return closest;
  }

  if (steps.length) {
    const updateFromScroll = () => {
      if (phoneLayout.matches && deck) setActive(closestToDeckStart(steps));
      else setActive(closestToViewportCenter(steps));
    };
    window.addEventListener("scroll", () => { if (!phoneLayout.matches) updateFromScroll(); }, { passive: true });
    window.addEventListener("resize", updateFromScroll, { passive: true });
    deck?.addEventListener("scroll", () => { if (phoneLayout.matches) updateFromScroll(); }, { passive: true });
    /* Tapping a peeking card brings it into place. */
    steps.forEach((step) => step.addEventListener("click", () => {
      if (!phoneLayout.matches || !deck || step === activeStep) return;
      deck.scrollBy({ left: step.getBoundingClientRect().left - deckStart(), behavior: "smooth" });
    }));
    updateFromScroll();
  }
})();
