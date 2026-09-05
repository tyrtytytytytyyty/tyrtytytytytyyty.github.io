const { test } = require('node:test');
const assert = require('node:assert/strict');
const { initTestimonials } = require('../testimonials.js');

class Element {
  constructor(tag = 'div') { this.tagName = tag; this.dataset = {}; this.style = {}; this.attrs = {}; this.listeners = {}; this.children = []; this.files = []; this.value = ''; this.textContent = ''; this.disabled = false; }
  addEventListener(event, fn) { this.listeners[event] = fn; }
  setAttribute(k, v) { this.attrs[k] = v; }
  appendChild(node) { this.children.push(node); return node; }
  replaceChildren(...nodes) { this.children = nodes; }
  focus() { this.focused = true; }
}
function fixture(fetchImpl, category = 'universal') {
  const ids = Object.fromEntries(['testimonials','testimonial-form','testimonials-grid','review-load-status','pending-msg','submit-testimonial','t-img-input','t-name','t-text','img-filename','remove-testimonial-image'].map(id => [id, new Element()]));
  const stars = Array.from({length:5}, (_,i) => { const e = new Element('button'); e.dataset.val = String(i + 1); return e; });
  ids.testimonials.dataset.category = category;
  ids.testimonials.querySelectorAll = () => stars;
  ids['testimonial-form'].reset = () => { ids['t-name'].value = ''; ids['t-text'].value = ''; ids['t-img-input'].files = []; };
  const doc = { getElementById: id => ids[id], createElement: tag => new Element(tag) };
  const app = initTestimonials(doc, fetchImpl);
  function fill() { ids['t-name'].value = 'Alex'; ids['t-text'].value = 'Useful during my workout.'; stars[3].listeners.click(); }
  return { app, ids, stars, fill, event: { preventDefault() {} } };
}
const response = (data = [], ok = true) => ({ ok, json: async () => data });

test('successful submission is pending, category-scoped, and clears only after acceptance', async () => {
  const calls = [];
  const f = fixture(async (url, opts) => { calls.push({url, opts}); return response(); }, 'programming');
  await f.app.ready; f.fill(); await f.app.submit(f.event);
  const post = calls.find(c => c.opts.method === 'POST'); const body = JSON.parse(post.opts.body);
  assert.equal(body.status, 'pending'); assert.equal(body.category, 'programming'); assert.equal(body.rating, 4);
  assert.equal(f.ids['t-text'].value, ''); assert.equal(f.ids['submit-testimonial'].disabled, false);
  assert.match(f.ids['pending-msg'].textContent, /submitted for review/);
  assert.ok(calls[0].url.includes('status=eq.approved'));
});
test('network failure preserves text and restores the submit button', async () => {
  const f = fixture(async (_url, opts) => { if (opts.method === 'POST') throw new TypeError('network'); return response(); });
  await f.app.ready; f.fill(); await f.app.submit(f.event);
  assert.equal(f.ids['t-text'].value, 'Useful during my workout.'); assert.equal(f.ids['submit-testimonial'].disabled, false);
  assert.equal(f.ids['testimonial-form'].attrs['aria-busy'], 'false'); assert.equal(f.ids['pending-msg'].dataset.error, 'true');
});
test('HTTP failure is not reported as a successful submission', async () => {
  const f = fixture(async (_url, opts) => response([], opts.method !== 'POST'));
  await f.app.ready; f.fill(); await f.app.submit(f.event);
  assert.notEqual(f.ids['t-name'].value, ''); assert.match(f.ids['pending-msg'].textContent, /couldn’t confirm/);
});
test('failed upload does not silently submit a review without the image', async () => {
  const calls = []; const f = fixture(async (url, opts) => { calls.push(url); return response([], opts.method !== 'POST'); });
  await f.app.ready; f.fill(); f.ids['t-img-input'].files = [{type:'image/png',size:100,name:'photo.png'}];
  await f.app.submit(f.event);
  assert.equal(calls.filter(u => u.includes('/rest/v1/testimonials')).length, 1);
  assert.equal(f.ids['t-text'].value, 'Useful during my workout.'); assert.equal(f.ids['submit-testimonial'].disabled, false);
});
test('oversize/unsupported images are rejected before a write', async () => {
  let writes = 0; const f = fixture(async (_url, opts) => { if (opts.method) writes++; return response(); });
  await f.app.ready; f.fill();
  for (const file of [{type:'image/svg+xml',size:100},{type:'image/png',size:6*1024*1024}]) {
    f.ids['t-img-input'].files = [file]; await f.app.submit(f.event); assert.match(f.ids['pending-msg'].textContent, /up to 5 MB/);
  }
  assert.equal(writes, 0);
});
test('double submission does not produce parallel duplicate posts', async () => {
  let resolvePost; let posts = 0;
  const f = fixture(async (_url, opts) => { if (opts.method === 'POST') { posts++; return new Promise(resolve => { resolvePost = resolve; }); } return response(); });
  await f.app.ready; f.fill(); const first = f.app.submit(f.event); await f.app.submit(f.event);
  assert.equal(posts, 1); resolvePost(response()); await first;
});
test('review service error stays visible instead of claiming there are no reviews', async () => {
  const f = fixture(async () => { throw new TypeError('DNS failure'); }); await f.app.ready;
  assert.match(f.ids['review-load-status'].textContent, /temporarily unavailable/);
  assert.equal(f.ids['review-load-status'].hidden, false);
});
test('review content is rendered as text and untrusted image origins are ignored', async () => {
  const f = fixture(async () => response([{name:'<img onerror=bad()>',message:'<script>bad()</script>',rating:500,image:'https://untrusted.example/image.svg'}]));
  await f.app.ready; const card = f.ids['testimonials-grid'].children[0];
  assert.equal(card.children.length, 3); assert.equal(card.children[1].textContent, '<script>bad()</script>');
  assert.equal(card.children[0].attrs['aria-label'], '5 out of 5 stars');
});
test('rating selection exposes the selected value and empty submissions focus missing input', async () => {
  const f = fixture(async () => response()); await f.app.ready; await f.app.submit(f.event);
  assert.equal(f.ids['t-name'].focused, true); f.fill();
  assert.equal(f.stars[3].attrs['aria-pressed'], 'true'); assert.equal(f.stars[0].attrs['aria-pressed'], 'false');
});
test('uploaded attachment is reused when retrying a rejected review', async () => {
  let uploads = 0, posts = 0;
  const f = fixture(async (url, opts) => {
    if (url.includes('/storage/')) { uploads++; return response(); }
    if (opts.method === 'POST') { posts++; return response([], posts > 1); }
    return response();
  });
  await f.app.ready; f.fill(); f.ids['t-img-input'].files = [{type:'image/png',size:100,name:'photo.png'}];
  await f.app.submit(f.event); await f.app.submit(f.event); assert.equal(uploads, 1); assert.equal(posts, 2);
});
test('a stalled request times out and releases the form', async t => {
  const f = fixture(async (_url, opts) => {
    if (opts.method === 'POST') return new Promise((_, reject) => {
      opts.signal.addEventListener('abort', () => reject(new Error('timeout')));
    });
    return response();
  });
  await f.app.ready; f.fill();
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const pending = f.app.submit(f.event);
  t.mock.timers.tick(15000);
  await pending;
  assert.equal(f.ids['submit-testimonial'].disabled, false);
  assert.equal(f.ids['t-text'].value, 'Useful during my workout.');
  assert.equal(f.ids['pending-msg'].dataset.error, 'true');
});
