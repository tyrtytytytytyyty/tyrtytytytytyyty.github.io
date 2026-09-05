# Portfolio checks

Run from the repository root:

```sh
python3 _checks/check_site.py
node --test _checks/testimonials.test.cjs
```

The Python check validates all root HTML pages, local links/assets/fragments, testimonial form wiring, duplicate IDs, and JavaScript syntax. The Node tests mock the DOM and network: they never submit real testimonials, upload files, or contact customers.

The site is plain HTML/CSS/JS. GitHub Pages publishes `main` using its existing build workflow. Directories starting with `_` are excluded by the default Jekyll build.

These checks do not replace a rendered desktop/mobile browser review.
