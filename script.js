/* Randomize order of skills on each load */
document.addEventListener('DOMContentLoaded', () => {
  const list = document.querySelector('.skill-list');
  if (list) {
    const items = Array.from(list.children);
    items.sort(() => Math.random() - 0.5);
    items.forEach(item => list.appendChild(item));
  }

  const yearEl = document.getElementById('current-year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
});

/* Smooth scroll nav links */
document.querySelectorAll('nav a[href^="#"]').forEach(link => {
  link.addEventListener('click', event => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      event.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

/* Fade-in animation + skill bar fill */
const fadeObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      entry.target.querySelectorAll('.skill-bar-fill').forEach(bar => {
        if (!bar.style.width) {
          bar.style.width = bar.dataset.w;
        }
      });
    }
  });
}, { threshold: 0.2 });

document.querySelectorAll('.fade').forEach(el => fadeObserver.observe(el));

/* Scroll-spy active nav link */
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('nav a');
const spy = () => {
  let current = '';
  sections.forEach(sec => {
    const top = sec.getBoundingClientRect().top;
    if (top <= 80) {
      current = sec.id;
    }
  });
  navLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href').slice(1) === current);
  });
};

spy();
window.addEventListener('scroll', spy);
