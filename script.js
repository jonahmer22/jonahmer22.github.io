/* ============================================================
   Jonah Merriam — portfolio script
   Modules (in DOMContentLoaded order):
     1. initSkillShuffle   — randomise skill order
     2. initParticleCanvas — animated node-graph background
     3. initTypewriter     — cycling terminal text in hero
     4. initScrollReveal   — staggered scroll animations + skill bars
     5. initTilt           — 3D perspective tilt on project/post cards
     6. initUtils          — year, smooth scroll, scroll-spy nav
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  initSkillShuffle();
  initParticleCanvas();
  initTypewriter();
  initScrollReveal();
  initTilt();
  initUtils();
});

/* ---- 1. SKILL SHUFFLE ---- */
function initSkillShuffle() {
  const list = document.querySelector('.skill-list');
  if (!list) return;
  const items = Array.from(list.children);
  items.sort(() => Math.random() - 0.5);
  items.forEach(item => list.appendChild(item));
}

/* ---- 2. PARTICLE CANVAS ---- */
function initParticleCanvas() {
  const canvas = document.getElementById('particle-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const CONNECTION_DIST = 140;
  const MOUSE_DIST = 100;
  let particles = [];
  let mouse = { x: -9999, y: -9999 };
  let rafId;

  function particleCount() {
    const lowPower = navigator.hardwareConcurrency <= 4;
    if (lowPower) return 30;
    const w = window.innerWidth;
    if (w < 480) return 30;
    return Math.min(Math.floor(w / 12), 120);
  }

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function makeParticle() {
    const cyan = Math.random() < 0.04;
    return {
      x:      Math.random() * canvas.width,
      y:      Math.random() * canvas.height,
      vx:     (Math.random() - 0.5) * 0.55,
      vy:     (Math.random() - 0.5) * 0.55,
      radius: 1.5 + Math.random() * 1.2,
      cyan,
    };
  }

  function init() {
    resize();
    const n = particleCount();
    particles = Array.from({ length: n }, makeParticle);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connecting lines
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < CONNECTION_DIST) {
          const alpha = (1 - dist / CONNECTION_DIST) * 0.35;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(99,102,241,${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    // Draw dots
    for (const p of particles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.cyan ? 'rgba(34,211,238,0.7)' : 'rgba(99,102,241,0.65)';
      ctx.fill();
    }
  }

  function update() {
    for (const p of particles) {
      // Mouse repulsion
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < MOUSE_DIST && dist > 0) {
        p.vx += (dx / dist) * 0.04;
        p.vy += (dy / dist) * 0.04;
      }

      // Speed cap
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (speed > 1.2) { p.vx *= 0.98; p.vy *= 0.98; }

      p.x += p.vx;
      p.y += p.vy;

      // Bounce off edges
      if (p.x < 0)              { p.x = 0;              p.vx *= -1; }
      if (p.x > canvas.width)   { p.x = canvas.width;   p.vx *= -1; }
      if (p.y < 0)              { p.y = 0;              p.vy *= -1; }
      if (p.y > canvas.height)  { p.y = canvas.height;  p.vy *= -1; }
    }
  }

  function loop() {
    update();
    draw();
    rafId = requestAnimationFrame(loop);
  }

  // Pause when tab hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
    } else {
      rafId = requestAnimationFrame(loop);
    }
  });

  // Debounced resize
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      cancelAnimationFrame(rafId);
      init();
      rafId = requestAnimationFrame(loop);
    }, 150);
  });

  window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });

  window.addEventListener('mouseleave', () => {
    mouse.x = -9999;
    mouse.y = -9999;
  });

  init();
  rafId = requestAnimationFrame(loop);
}

/* ---- 3. TYPEWRITER ---- */
function initTypewriter() {
  const el = document.getElementById('typewriter-text');
  if (!el) return;

  const phrases = [
    'systems programmer',
    'VM builder',
    'language designer',
    'compiler writer',
    'low-level thinker',
  ];

  const STATES = { TYPING: 0, PAUSING: 1, DELETING: 2 };
  let state      = STATES.TYPING;
  let phraseIdx  = 0;
  let charIdx    = 0;
  let pauseCount = 0;
  let timer      = null;
  let paused     = false;

  function tick() {
    if (paused) return;
    const phrase = phrases[phraseIdx];

    if (state === STATES.TYPING) {
      el.textContent = phrase.slice(0, ++charIdx);
      if (charIdx === phrase.length) {
        state = STATES.PAUSING;
        pauseCount = 0;
      }
      timer = setTimeout(tick, 70 + Math.random() * 45);

    } else if (state === STATES.PAUSING) {
      if (++pauseCount >= 20) state = STATES.DELETING;
      timer = setTimeout(tick, 80);

    } else if (state === STATES.DELETING) {
      el.textContent = phrase.slice(0, --charIdx);
      if (charIdx === 0) {
        phraseIdx = (phraseIdx + 1) % phrases.length;
        state = STATES.TYPING;
      }
      timer = setTimeout(tick, 38);
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      paused = true;
      clearTimeout(timer);
    } else {
      paused = false;
      tick();
    }
  });

  tick();
}

/* ---- 4. SCROLL REVEAL ---- */
function initScrollReveal() {
  // Assign stagger indexes AFTER shuffle has run
  document.querySelectorAll('.stagger-children').forEach(container => {
    let i = 0;
    container.querySelectorAll('.reveal').forEach(child => {
      child.style.setProperty('--stagger-i', i++);
    });
  });

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');

      // Trigger skill bars
      entry.target.querySelectorAll('.skill-bar-fill').forEach(bar => {
        if (!bar.dataset.animated) {
          bar.style.width = bar.dataset.w;
          bar.dataset.animated = 'true';
        }
      });

      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* ---- 5. TILT ---- */
function initTilt() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const cards = document.querySelectorAll('.project-card, .post-card');

  cards.forEach(card => {
    let rafId = null;
    let targetRotX = 0, targetRotY = 0;
    let currentRotX = 0, currentRotY = 0;

    card.addEventListener('mouseenter', () => {
      card.style.willChange = 'transform';
      card.style.transformStyle = 'preserve-3d';
      // Disable the CSS reveal transition on transform so tilt isn't sluggish
      card.style.transition = 'border-color 0.25s ease, box-shadow 0.25s ease';
    });

    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const cx = rect.left + rect.width  / 2;
      const cy = rect.top  + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width  / 2); // -1..1
      const dy = (e.clientY - cy) / (rect.height / 2); // -1..1
      targetRotX = -dy * 8;
      targetRotY =  dx * 8;

      if (!rafId) scheduleTilt();
    });

    card.addEventListener('mouseleave', () => {
      targetRotX = 0;
      targetRotY = 0;
      if (!rafId) scheduleReset();
    });

    function scheduleTilt() {
      rafId = requestAnimationFrame(function tickTilt() {
        currentRotX += (targetRotX - currentRotX) * 0.15;
        currentRotY += (targetRotY - currentRotY) * 0.15;
        applyTransform();
        const dx = Math.abs(targetRotX - currentRotX);
        const dy = Math.abs(targetRotY - currentRotY);
        rafId = (dx > 0.02 || dy > 0.02) ? requestAnimationFrame(tickTilt) : null;
      });
    }

    function scheduleReset() {
      rafId = requestAnimationFrame(function tickReset() {
        currentRotX += (0 - currentRotX) * 0.12;
        currentRotY += (0 - currentRotY) * 0.12;
        applyTransform();
        if (Math.abs(currentRotX) > 0.05 || Math.abs(currentRotY) > 0.05) {
          rafId = requestAnimationFrame(tickReset);
        } else {
          currentRotX = 0;
          currentRotY = 0;
          card.style.transform = '';
          card.style.background = '';
          card.style.willChange = '';
          card.style.transition = '';
          rafId = null;
        }
      });
    }

    function applyTransform() {
      // Normalised -1..1 for glow position
      const nx = currentRotY / 8;
      const ny = currentRotX / 8;
      const gx = 50 + nx * 25;
      const gy = 50 + ny * 25;
      card.style.transform =
        `perspective(800px) rotateX(${currentRotX}deg) rotateY(${currentRotY}deg) scale3d(1.02,1.02,1.02)`;
      card.style.background =
        `radial-gradient(circle at ${gx}% ${gy}%, rgba(99,102,241,0.1), var(--card) 65%)`;
    }
  });
}

/* ---- 6. UTILS ---- */
function initUtils() {
  // Year
  const yearEl = document.getElementById('current-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Smooth scroll for nav anchor links
  document.querySelectorAll('nav a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Scroll-spy
  const sections  = document.querySelectorAll('section[id]');
  const navLinks  = document.querySelectorAll('nav a[href^="#"]');

  function spy() {
    let current = '';
    sections.forEach(sec => {
      if (sec.getBoundingClientRect().top <= 100) current = sec.id;
    });
    navLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
  }

  spy();
  window.addEventListener('scroll', spy, { passive: true });
}
