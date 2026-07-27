// ============================================================
// ANJANA A V — PORTFOLIO SCRIPT
// Theme system, navigation, scroll reveal, ambient background,
// case-study toggles, and contact form handling.
// ============================================================

(function () {
  'use strict';

  /* ---------------- Theme (no-flash, persisted) ---------------- */
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    themeToggle?.setAttribute('aria-pressed', theme === 'dark');
  }

  themeToggle?.addEventListener('click', () => {
    const current = root.getAttribute('data-theme') || 'light';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });

  /* ---------------- Mobile navigation ---------------- */
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  function closeMobileMenu() {
    hamburger?.classList.remove('open');
    mobileMenu?.classList.remove('open');
    hamburger?.setAttribute('aria-expanded', 'false');
  }

  hamburger?.addEventListener('click', () => {
    const isOpen = hamburger.classList.toggle('open');
    mobileMenu?.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  mobileMenu?.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeMobileMenu));

  /* ---------------- Sticky nav active-section highlight ---------------- */
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.nav-links a, .mobile-menu a');

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach((link) => {
            link.classList.toggle('active', link.getAttribute('href') === `#${id}`);
          });
        }
      });
    },
    { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
  );
  sections.forEach((s) => sectionObserver.observe(s));

  /* ---------------- Scroll reveal ---------------- */
  const revealEls = document.querySelectorAll('.reveal');
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );
  revealEls.forEach((el) => revealObserver.observe(el));

  /* ---------------- Case study expand/collapse ---------------- */
  document.querySelectorAll('.case-study-toggle').forEach((btn) => {
    btn.addEventListener('click', () => {
      const targetId = btn.getAttribute('aria-controls');
      const body = document.getElementById(targetId);
      const expanded = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!expanded));
      body.classList.toggle('open', !expanded);
      btn.querySelector('.toggle-label').textContent = expanded ? 'View case study' : 'Hide case study';
      btn.querySelector('.toggle-icon').style.transform = expanded ? 'rotate(0deg)' : 'rotate(180deg)';
    });
  });

  /* ---------------- Ambient background (theme-aware) ---------------- */
  const canvas = document.getElementById('ambienceCanvas');
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext('2d');
    let w, h, particles;
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    function isDark() {
      return root.getAttribute('data-theme') === 'dark';
    }

    function resize() {
      w = canvas.width = window.innerWidth * DPR;
      h = canvas.height = window.innerHeight * DPR;
      canvas.style.width = window.innerWidth + 'px';
      canvas.style.height = window.innerHeight + 'px';
      initParticles();
    }

    function initParticles() {
      const count = isDark() ? 70 : 26;
      particles = Array.from({ length: count }, () => makeParticle());
    }

    function makeParticle() {
      if (isDark()) {
        // small stars, slow drift, gentle blink
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          r: (Math.random() * 1.1 + 0.3) * DPR,
          vy: (Math.random() * 0.05 + 0.01) * DPR,
          phase: Math.random() * Math.PI * 2,
          blinkSpeed: Math.random() * 0.008 + 0.003,
        };
      }
      // soft floating organic shapes
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: (Math.random() * 40 + 20) * DPR,
        vy: (Math.random() * 0.06 + 0.02) * DPR,
        vx: (Math.random() - 0.5) * 0.04 * DPR,
        phase: Math.random() * Math.PI * 2,
        blinkSpeed: Math.random() * 0.004 + 0.002,
      };
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      const dark = isDark();

      particles.forEach((p) => {
        p.phase += p.blinkSpeed;
        const twinkle = (Math.sin(p.phase) + 1) / 2;

        if (dark) {
          p.y -= p.vy;
          if (p.y < -10) p.y = h + 10;
          ctx.beginPath();
          ctx.fillStyle = `rgba(224, 183, 154, ${0.15 + twinkle * 0.35})`;
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        } else {
          p.y -= p.vy;
          p.x += p.vx;
          if (p.y < -60) p.y = h + 60;
          if (p.x < -60) p.x = w + 60;
          if (p.x > w + 60) p.x = -60;
          ctx.beginPath();
          ctx.fillStyle = `rgba(203, 153, 126, ${0.04 + twinkle * 0.05})`;
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      requestAnimationFrame(draw);
    }

    resize();
    window.addEventListener('resize', resize);
    // Reinitialize particle density when theme changes
    const themeObserver = new MutationObserver(() => initParticles());
    themeObserver.observe(root, { attributes: true, attributeFilter: ['data-theme'] });
    requestAnimationFrame(draw);
  }

  /* ---------------- Contact form ---------------- */
  const form = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');
  const submitBtn = document.getElementById('submitBtn');

  const validators = {
    name: (v) => v.trim().length >= 2,
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()),
    subject: (v) => v.trim().length >= 3,
    message: (v) => v.trim().length >= 10,
  };

  function setFieldState(field, valid) {
    const wrapper = field.closest('.form-field');
    wrapper.classList.toggle('invalid', !valid);
  }

  function validateForm() {
    let valid = true;
    Object.keys(validators).forEach((name) => {
      const field = form.elements[name];
      const ok = validators[name](field.value);
      setFieldState(field, ok);
      if (!ok) valid = false;
    });
    return valid;
  }

  form?.querySelectorAll('input, textarea').forEach((field) => {
    field.addEventListener('blur', () => {
      if (validators[field.name]) setFieldState(field, validators[field.name](field.value));
    });
  });

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    formStatus.className = 'form-status';

    if (!validateForm()) {
      formStatus.textContent = 'Please fix the highlighted fields before sending.';
      formStatus.classList.add('show', 'error');
      return;
    }

    const payload = {
      name: form.elements.name.value.trim(),
      email: form.elements.email.value.trim(),
      subject: form.elements.subject.value.trim(),
      message: form.elements.message.value.trim(),
    };

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
      const res = await fetch('http://127.0.0.1:3000/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Request failed');

      const data = await res.json();
      formStatus.textContent = data.message || 'Message sent — thank you for reaching out!';
      formStatus.classList.add('show', 'success');
      form.reset();
    } catch (err) {
      // Backend not deployed/reachable — be honest, offer a direct alternative.
      formStatus.innerHTML =
        'Could not reach the contact server right now. Please email me directly at ' +
        '<a href="mailto:anjana.a.vinodkumar@gmail.com" style="text-decoration:underline">anjana.a.vinodkumar@gmail.com</a>.';
      formStatus.classList.add('show', 'error');
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
  });

  /* ---------------- Footer year ---------------- */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
