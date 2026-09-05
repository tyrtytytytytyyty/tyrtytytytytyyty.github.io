"""Validate local HTML links/assets, fragments, IDs, forms, and inline JavaScript."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import subprocess
import tempfile

ROOT = Path(__file__).resolve().parents[1]
class Page(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.refs, self.ids, self.scripts = [], [], []
        self.script = None
        self.forms = 0
        self.form_depth = 0
        self.errors = []
        self.testimonial = False
        self.category = None
        self.rating_buttons = 0
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.append(attrs['id'])
        for key in ['href', 'src']:
            if attrs.get(key):
                self.refs.append(attrs[key])
        if tag == 'script' and 'src' not in attrs:
            self.script = ''
        if tag == 'form':
            self.forms += 1
            self.form_depth += 1
            if self.form_depth > 1:
                self.errors.append('nested form')
        if attrs.get('id') == 'testimonials':
            self.testimonial = True
            self.category = attrs.get('data-category')
        if 'star-pick' in attrs.get('class', '').split():
            if tag == 'button' and attrs.get('type') == 'button' and attrs.get('aria-label'):
                self.rating_buttons += 1
            else:
                self.errors.append('inaccessible rating control')
    def handle_data(self, data):
        if self.script is not None:
            self.script += data
    def handle_endtag(self, tag):
        if tag == 'script' and self.script is not None:
            self.scripts.append(self.script)
            self.script = None
        if tag == 'form':
            self.form_depth -= 1

pages = {}
for path in ROOT.glob('*.html'):
    page = Page()
    page.feed(path.read_text())
    pages[path.name] = page
errors = []
for name, page in pages.items():
    if len(page.ids) != len(set(page.ids)):
        page.errors.append('duplicate IDs')
    if page.form_depth:
        page.errors.append('unbalanced form')
    for ref in page.refs:
        url = urlsplit(ref)
        if url.scheme or url.netloc:
            continue
        target = unquote(url.path) or name
        if not (ROOT / target).exists():
            page.errors.append('missing file: ' + ref)
        if url.fragment and target in pages and unquote(url.fragment) not in pages[target].ids:
            page.errors.append('missing fragment: ' + ref)
    if page.testimonial:
        if page.refs.count('testimonials.js') != 1:
            page.errors.append('testimonial script must load exactly once')
        if page.rating_buttons != 5 or page.forms != 1 or not page.category:
            page.errors.append('invalid testimonial controls')
        for required in ['testimonial-form', 'review-load-status', 'pending-msg', 'remove-testimonial-image']:
            if required not in page.ids:
                page.errors.append('missing testimonial element ' + required)
    for source in page.scripts:
        with tempfile.NamedTemporaryFile(suffix='.js', mode='w') as file:
            file.write(source)
            file.flush()
            result = subprocess.run(['node', '--check', file.name], capture_output=True, text=True)
            if result.returncode:
                page.errors.append(result.stderr)
    errors.extend(name + ': ' + error for error in page.errors)
for path in ROOT.glob('*.js'):
    result = subprocess.run(['node', '--check', str(path)], capture_output=True, text=True)
    if result.returncode:
        errors.append(result.stderr)
if errors:
    raise SystemExit('\n'.join(errors))
print(f'PASS: {len(pages)} HTML pages; local assets, links, fragments, form controls, IDs, and JavaScript syntax.')
