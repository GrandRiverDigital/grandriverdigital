/**
 * Grand River Digital — script.js
 * Multi-page build · Zero console errors
 */

'use strict';

const qs  = (sel, ctx = document) => ctx.querySelector(sel);
const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ─── STICKY HEADER ──────────────────────── */
function initHeader() {
  const header = qs('#header');
  if (!header) return;
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      header.classList.toggle('is-scrolled', window.scrollY > 10);
      ticking = false;
    });
  }, { passive: true });
}

/* ─── MOBILE NAV ─────────────────────────── */
function initMobileNav() {
  const toggle = qs('#navToggle');
  const nav    = qs('#nav');
  if (!toggle || !nav) return;

  const open = () => {
    nav.classList.add('is-open');
    toggle.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close navigation menu');
    document.body.style.overflow = 'hidden';
  };

  const close = () => {
    nav.classList.remove('is-open');
    toggle.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open navigation menu');
    document.body.style.overflow = '';
  };

  toggle.addEventListener('click', () =>
    nav.classList.contains('is-open') ? close() : open()
  );

  qsa('.nav__link, .nav__mobile-cta', nav).forEach(link =>
    link.addEventListener('click', close)
  );

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) close();
  });

  document.addEventListener('click', e => {
    if (
      nav.classList.contains('is-open') &&
      !nav.contains(e.target) &&
      !toggle.contains(e.target)
    ) close();
  });
}

/* ─── ACTIVE NAV (pathname-based) ────────── */
function initActiveNav() {
  const links = qsa('.nav__link');
  if (!links.length) return;

  const path = window.location.pathname.replace(/\/$/, '') || '/';

  links.forEach(link => {
    const href = (link.getAttribute('href') || '').replace(/\/$/, '') || '/';
    let active = false;

    if (href === '/') {
      active = (path === '' || path === '/');
    } else {
      active = path === href || path.startsWith(href + '/');
    }

    if (active) {
      link.classList.add('is-active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('is-active');
      link.removeAttribute('aria-current');
    }
  });
}

/* ─── SCROLL REVEAL ──────────────────────── */
function initReveal() {
  if (prefersReducedMotion()) {
    qsa('.reveal').forEach(el => el.classList.add('is-visible'));
    return;
  }

  const elements = qsa('.reveal');
  if (!elements.length) return;

  const STAGGER_SELECTORS =
    '.services__grid, .why__grid, .about__grid, .portfolio__grid, .demos__grid, .process__steps';

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el     = entry.target;
      const parent = el.closest(STAGGER_SELECTORS);

      if (parent) {
        const siblings = qsa('.reveal', parent);
        const idx      = siblings.indexOf(el);
        const delay    = idx > 0 ? Math.min(idx * 70, 350) : 0;
        el.style.transitionDelay = `${delay}ms`;
      }

      el.classList.add('is-visible');
      el.addEventListener('transitionend', () => {
        el.style.transitionDelay = '';
      }, { once: true });

      io.unobserve(el);
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

  elements.forEach(el => io.observe(el));
}

/* ─── SMOOTH SCROLL (same-page anchors only) */
function initSmoothScroll() {
  qsa('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const hash = anchor.getAttribute('href');
      if (!hash || hash === '#') return;
      const target = document.querySelector(hash);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.pushState(null, '', hash);
    });
  });
}

/* ─── CONTACT FORM ──────────────────────── */
function initContactForm() {
  const form      = qs('#contactForm');
  const successEl = qs('#formSuccess');
  if (!form || !successEl) return;

  const submitBtn = qs('[type="submit"]', form);
  const required  = qsa('[required]', form);
  const btnSnapshot = Array.from(submitBtn.childNodes).map(n => n.cloneNode(true));

  function setSubmitting(on) {
    submitBtn.disabled = on;
    if (on) {
      submitBtn.textContent = 'Sending…';
    } else {
      submitBtn.replaceChildren(...btnSnapshot.map(n => n.cloneNode(true)));
    }
  }

  function clearError(field) {
    field.classList.remove('is-error');
    field.removeAttribute('aria-invalid');
  }

  function validateField(field) {
    const empty    = !field.value.trim();
    const badEmail = field.type === 'email' && field.value && !field.value.includes('@');
    if (empty || badEmail) {
      field.classList.add('is-error');
      field.setAttribute('aria-invalid', 'true');
      return false;
    }
    clearError(field);
    return true;
  }

  required.forEach(field => {
    field.addEventListener('blur',  () => validateField(field));
    field.addEventListener('input', () => clearError(field));
  });

  form.addEventListener('submit', e => {
    e.preventDefault();

    let valid = true;
    required.forEach(field => { if (!validateField(field)) valid = false; });

    if (!valid) {
      const first = required.find(f => f.classList.contains('is-error'));
      if (first) first.focus();
      return;
    }

    const formData = {
      name:        qs('#cname', form).value.trim(),
      email:       qs('#cemail', form).value.trim(),
      business:    qs('#cbusiness', form).value.trim(),
      description: qs('#cdesc', form).value.trim(),
      budget:      qs('#cbudget', form).value,
      timestamp:   new Date().toISOString(),
    };

    setSubmitting(true);

    fetch('https://formspree.io/f/xnjbrllk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        name:        formData.name,
        email:       formData.email,
        business:    formData.business,
        description: formData.description,
        budget:      formData.budget,
        timestamp:   formData.timestamp,
        _replyto:    formData.email,
        _subject:    `New consultation request — ${formData.business}`,
      }),
    })
    .then(res => res.json())
    .then(data => {
      if (data.ok) {
        form.reset();
        required.forEach(f => clearError(f));
        setSubmitting(false);
        successEl.hidden = false;
        successEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        setTimeout(() => { successEl.hidden = true; }, 8000);
      } else {
        setSubmitting(false);
        alert('Something went wrong. Please try again or email us directly at info@grandriverdigital.ca');
      }
    })
    .catch(() => {
      setSubmitting(false);
      alert('Network error. Please check your connection and try again.');
    });
  });
}

/* ─── PROCESS STEPS ──────────────────────── */
function initProcessSteps() {
  if (prefersReducedMotion()) return;
  const steps = qsa('.process__step');
  if (!steps.length) return;

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add('is-active-step');
    });
  }, { threshold: 0.4 });

  steps.forEach(step => io.observe(step));
}

/* ─── MOCK CHART ANIMATION ───────────────── */
function initMockChart() {
  if (prefersReducedMotion()) return;
  const bars = qsa('.mock-chart__bar');
  if (!bars.length) return;

  bars.forEach(bar => { bar.style.height = '0%'; });
  setTimeout(() => {
    bars.forEach((bar, i) => {
      setTimeout(() => {
        bar.style.height = bar.style.getPropertyValue('--h') || '60%';
      }, i * 80);
    });
  }, 600);
}

/* ─── FOOTER YEAR ────────────────────────── */
function initFooterYear() {
  qsa('.footer-year').forEach(el => {
    el.textContent = new Date().getFullYear();
  });
  const el = qs('#footerYear');
  if (el) el.textContent = new Date().getFullYear();
}

/* ─── INIT ───────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileNav();
  initActiveNav();
  initReveal();
  initSmoothScroll();
  initContactForm();
  initProcessSteps();
  initMockChart();
  initFooterYear();
});
