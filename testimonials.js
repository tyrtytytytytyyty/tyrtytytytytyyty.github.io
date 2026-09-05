/* Shared testimonial UI. Only approved reviews are displayed; submissions stay pending. */
'use strict';
const TESTIMONIAL_URL = 'https://zoguypxxotlgjxplcbtz.supabase.co';
// Existing public, browser-side Supabase anon key. Access rules remain server-owned.
const TESTIMONIAL_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvZ3V5cHh4b3RsZ2p4cGxjYnR6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5OTM1ODMsImV4cCI6MjA4OTU2OTU4M30.gVGhRpbd8Mhhhvkdfq8KdcJ3zDu-WpsG46CIeBW8CkU';

function initTestimonials(doc, fetchImpl = fetch) {
  const section = doc.getElementById('testimonials');
  if (!section) return null;
  const category = section.dataset.category || 'universal';
  const allowed = ['universal', 'scripting', 'ui', 'programming', 'editing', 'clothing'];
  if (!allowed.includes(category)) return null;
  const el = id => doc.getElementById(id);
  const form = el('testimonial-form');
  const grid = el('testimonials-grid');
  const loadState = el('review-load-status');
  const feedback = el('pending-msg');
  const button = el('submit-testimonial');
  const fileInput = el('t-img-input');
  const stars = Array.from(section.querySelectorAll('.star-pick'));
  const headers = { apikey: TESTIMONIAL_KEY, Authorization: `Bearer ${TESTIMONIAL_KEY}` };
  let rating = 0;
  let busy = false;
  let cachedFile = null;
  let cachedImage = null;

  async function request(path, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    try {
      const response = await fetchImpl(`${TESTIMONIAL_URL}/${path}`, {
        ...options, headers: { ...headers, ...options.headers }, signal: controller.signal
      });
      if (!response.ok) throw new Error('Service unavailable');
      return response;
    } finally { clearTimeout(timeout); }
  }
  function say(text, isError = false) {
    feedback.textContent = text;
    feedback.style.display = 'block';
    feedback.dataset.error = String(isError);
  }
  function renderRating(preview = rating) {
    stars.forEach((star, index) => {
      star.textContent = index < preview ? '★' : '☆';
      star.setAttribute('aria-pressed', String(index + 1 === rating));
    });
  }
  stars.forEach(star => {
    star.addEventListener('mouseenter', () => renderRating(Number(star.dataset.val)));
    star.addEventListener('mouseleave', () => renderRating());
    star.addEventListener('click', () => { rating = Number(star.dataset.val); renderRating(); });
  });
  fileInput.addEventListener('change', () => {
    el('img-filename').textContent = fileInput.files[0]?.name || '';
    cachedFile = null; cachedImage = null;
  });
  function textNode(tag, className, text) {
    const node = doc.createElement(tag);
    node.className = className;
    node.textContent = text;
    return node;
  }
  async function load() {
    loadState.textContent = 'Loading reviews…';
    loadState.hidden = false;
    const filter = category === 'universal' ? 'category=eq.universal' : `or=(category.eq.${category},category.eq.universal)`;
    try {
      const response = await request(`rest/v1/testimonials?select=name,message,rating,image&status=eq.approved&${filter}&order=created_at.desc`);
      const reviews = await response.json();
      if (!Array.isArray(reviews)) throw new Error('Invalid reviews');
      grid.replaceChildren();
      for (const review of reviews) {
        if (!review || typeof review.message !== 'string' || typeof review.name !== 'string') continue;
        const card = doc.createElement('article'); card.className = 'testimonial-card';
        const score = Math.min(5, Math.max(0, Math.round(Number(review.rating) || 0)));
        const row = textNode('div', 't-stars', '★'.repeat(score) + '☆'.repeat(5 - score));
        row.setAttribute('aria-label', `${score} out of 5 stars`);
        card.appendChild(row);
        // Review text is never interpreted as HTML. Images use the existing storage bucket only.
        if (typeof review.image === 'string' && review.image.startsWith(`${TESTIMONIAL_URL}/storage/v1/object/public/testimonial-images/`)) {
          const image = doc.createElement('img'); image.className = 't-image'; image.src = review.image;
          image.alt = `Image shared by ${review.name}`; image.loading = 'lazy'; card.appendChild(image);
        }
        card.appendChild(textNode('p', 't-text', review.message));
        card.appendChild(textNode('p', 't-author', review.name)); grid.appendChild(card);
      }
      grid.hidden = !grid.children.length;
      loadState.hidden = true;
    } catch (_) {
      loadState.textContent = 'Reviews are temporarily unavailable. You can still contact me on Instagram below.';
      grid.hidden = !grid.children.length;
    }
  }
  async function submit(event) {
    event.preventDefault();
    if (busy) return;
    const name = el('t-name').value.trim();
    const message = el('t-text').value.trim();
    if (!name || !message || !rating) {
      say('Please add your name, a rating, and your experience.', true);
      (!name ? el('t-name') : !message ? el('t-text') : stars[0]).focus(); return;
    }
    const file = fileInput.files[0];
    const types = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
    if (file && (!types[file.type] || file.size > 5 * 1024 * 1024)) {
      say('Choose a JPG, PNG, WebP, or GIF image up to 5 MB, or remove the attachment.', true); return;
    }
    busy = true; button.disabled = true; button.textContent = 'Sending…';
    form.setAttribute('aria-busy', 'true');
    try {
      let imageUrl = null;
      if (file) {
        if (file === cachedFile && cachedImage) imageUrl = cachedImage;
        else {
          const filename = `${crypto.randomUUID()}.${types[file.type]}`;
          await request(`storage/v1/object/testimonial-images/${filename}`, {
            method: 'POST', headers: { 'Content-Type': file.type }, body: file
          });
          imageUrl = `${TESTIMONIAL_URL}/storage/v1/object/public/testimonial-images/${filename}`;
          cachedFile = file; cachedImage = imageUrl;
        }
      }
      await request('rest/v1/testimonials', {
        method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ name, message, rating, image: imageUrl, status: 'pending', category })
      });
      form.reset(); rating = 0; renderRating(); cachedFile = null; cachedImage = null;
      el('img-filename').textContent = '';
      say('Thank you! Your testimonial was submitted for review.');
    } catch (_) {
      say('We couldn’t confirm your submission. Your message is still here. Please try again later or send it to me on Instagram.', true);
    } finally {
      busy = false; button.disabled = false; button.textContent = 'Submit';
      form.setAttribute('aria-busy', 'false');
    }
  }
  form.addEventListener('submit', submit);
  el('remove-testimonial-image').addEventListener('click', () => {
    fileInput.value = ''; el('img-filename').textContent = ''; cachedFile = null; cachedImage = null;
  });
  renderRating();
  const ready = load();
  return { submit, load, ready };
}
if (typeof module !== 'undefined' && module.exports) module.exports = { initTestimonials };
else initTestimonials(document);
