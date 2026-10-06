(() => {
  if (location.search.includes('static')) { document.documentElement.classList.add('static'); return; }
  document.documentElement.classList.add('js');
  const els = [...document.querySelectorAll('.reveal')];
  if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
  els.forEach((e) => io.observe(e));
})();
