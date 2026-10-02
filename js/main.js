document.addEventListener('DOMContentLoaded', () => {

  // ── MOBILE NAV ──
  const burger = document.getElementById('burger');
  const header = document.querySelector('.header');

  if (burger) {
    const mobileNav = document.createElement('div');
    mobileNav.className = 'mobile-nav';
    mobileNav.innerHTML = `
      <a href="#about">О сервисе</a>
      <a href="#topics">Темы</a>
      <a href="#faq">FAQ</a>
      <a href="#chat">Задать вопрос</a>`;
    header.insertAdjacentElement('afterend', mobileNav);

    burger.addEventListener('click', () => {
      mobileNav.classList.toggle('open');
      const spans = burger.querySelectorAll('span');
      const isOpen = mobileNav.classList.contains('open');
      spans[0].style.transform = isOpen ? 'translateY(7px) rotate(45deg)' : '';
      spans[1].style.opacity  = isOpen ? '0' : '1';
      spans[2].style.transform = isOpen ? 'translateY(-7px) rotate(-45deg)' : '';
    });

    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('open');
        burger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
      });
    });
  }

  // ── SCROLL TO TOP ──
  const scrollBtn = document.getElementById('scrollTop');
  if (scrollBtn) {
    window.addEventListener('scroll', () => {
      scrollBtn.classList.toggle('visible', window.scrollY > 400);
    }, { passive: true });

    scrollBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ── FAQ ACCORDION ──
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.faq-item');
      const isOpen = item.classList.contains('open');

      document.querySelectorAll('.faq-item.open').forEach(el => el.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  // ── COUNT UP ANIMATION ──
  const countItems = document.querySelectorAll('.stat-num');

  const runCount = (el) => {
    const target = parseInt(el.dataset.target, 10);
    const duration = 1400;
    const start = performance.now();

    const tick = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  };

  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        runCount(entry.target);
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  countItems.forEach(el => statsObserver.observe(el));

  // ── SCROLL REVEAL ──
  const revealEls = document.querySelectorAll('.slide-in-left, .pop-in, .fade-in-up, .fade-in-right');

  revealEls.forEach(el => {
    el.style.opacity = '0';
    el.style.animationPlayState = 'paused';
  });

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '';
        entry.target.style.animationPlayState = 'running';
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });

  revealEls.forEach(el => revealObserver.observe(el));

  // ── ACTIVE NAV LINK ON SCROLL ──
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.header__nav a');

  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${entry.target.id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }, { rootMargin: '-40% 0px -50% 0px' });

  sections.forEach(s => sectionObserver.observe(s));

  // ── HEADER SHADOW ON SCROLL ──
  const headerEl = document.querySelector('.header');
  window.addEventListener('scroll', () => {
    headerEl.style.boxShadow = window.scrollY > 10
      ? '0 2px 12px rgba(0,0,0,0.08)'
      : '';
  }, { passive: true });

});
