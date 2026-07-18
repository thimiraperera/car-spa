(function () {
  'use strict';

  /* Buttery smooth anchor scrolling with eased motion + header offset */
  var reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  var HEADER_OFFSET = 112;

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function smoothScrollTo(targetY) {
    var startY = window.scrollY;
    var distance = targetY - startY;
    var duration = Math.min(1000, Math.max(400, Math.abs(distance) * 0.6));
    var startTime = null;
    function step(timestamp) {
      if (startTime === null) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      /* behavior:'instant' bypasses html{scroll-behavior:smooth} — without
         it, every rAF-frame scrollTo() would itself try to smooth-animate,
         double-easing on top of our own easing and causing lag/stutter. */
      window.scrollTo({ top: startY + distance * easeInOutCubic(progress), left: 0, behavior: 'instant' });
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var hash = link.getAttribute('href');
      if (hash.length < 2) return;
      var target;
      try { target = document.querySelector(hash); } catch (err) { return; }
      if (!target) return;
      e.preventDefault();
      var targetY = target.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
      if (reducedMotionQuery.matches) window.scrollTo(0, targetY);
      else smoothScrollTo(targetY);
      history.pushState(null, '', hash);
    });
  });

  /* Slow, smooth mouse-wheel scrolling: the wheel nudges a virtual target
     and the page eases toward it each frame, instead of jumping instantly. */
  if (!reducedMotionQuery.matches) {
    var wheelCurrent = window.scrollY;
    var wheelTarget = window.scrollY;
    var wheelTicking = false;
    var WHEEL_EASE = 0.09;   /* lower = slower, silkier catch-up */
    var WHEEL_SPEED = 0.55;  /* lower = less distance per wheel notch */

    function maxScrollY() {
      return document.documentElement.scrollHeight - window.innerHeight;
    }

    function wheelRender() {
      var diff = wheelTarget - wheelCurrent;
      if (Math.abs(diff) < 0.5) {
        wheelCurrent = wheelTarget;
        wheelTicking = false;
      } else {
        wheelCurrent += diff * WHEEL_EASE;
        wheelTicking = true;
      }
      /* behavior:'instant' bypasses html{scroll-behavior:smooth} — see note
         in smoothScrollTo() above; same double-easing risk applies here. */
      window.scrollTo({ top: wheelCurrent, left: 0, behavior: 'instant' });
      if (wheelTicking) requestAnimationFrame(wheelRender);
    }

    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey) return; /* let pinch-zoom behave natively */
      var lineHeight = 18;
      var pageHeight = window.innerHeight * 0.9;
      var delta = e.deltaMode === 1 ? e.deltaY * lineHeight
        : e.deltaMode === 2 ? e.deltaY * pageHeight
        : e.deltaY;
      e.preventDefault();
      wheelTarget = Math.max(0, Math.min(wheelTarget + delta * WHEEL_SPEED, maxScrollY()));
      if (!wheelTicking) {
        wheelTicking = true;
        requestAnimationFrame(wheelRender);
      }
    }, { passive: false });

    /* Stay in sync with keyboard/scrollbar/touch scrolling */
    window.addEventListener('scroll', function () {
      if (!wheelTicking) {
        wheelCurrent = window.scrollY;
        wheelTarget = window.scrollY;
      }
    }, { passive: true });
  }

  /* Header: solidify + shadow once the page scrolls */
  var header = document.querySelector('.site-header');
  if (header) {
    var onScroll = function () {
      if (window.scrollY > 40) header.classList.add('scrolled');
      else header.classList.remove('scrolled');
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* Mobile menu: burger opens the existing nav-left as a slide-in drawer */
  var burger = document.querySelector('.burger');
  var navLeft = document.querySelector('.nav-left');
  if (burger && navLeft) {
    var navBackdrop = document.createElement('div');
    navBackdrop.className = 'nav-backdrop';
    document.body.appendChild(navBackdrop);
    burger.setAttribute('aria-expanded', 'false');

    var closeMenu = function () {
      navLeft.classList.remove('open');
      navBackdrop.classList.remove('open');
      burger.classList.remove('open');
      document.body.classList.remove('menu-open');
      burger.setAttribute('aria-expanded', 'false');
    };
    var openMenu = function () {
      navLeft.classList.add('open');
      navBackdrop.classList.add('open');
      burger.classList.add('open');
      document.body.classList.add('menu-open');
      burger.setAttribute('aria-expanded', 'true');
    };
    burger.addEventListener('click', function () {
      if (navLeft.classList.contains('open')) closeMenu(); else openMenu();
    });
    navBackdrop.addEventListener('click', closeMenu);
    navLeft.querySelectorAll('a').forEach(function (a) { a.addEventListener('click', closeMenu); });
    window.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeMenu(); });
  }

  /* Reveal-on-scroll for cards, benefits, FAQ items.
     Elements without an inline --rd get an automatic stagger based on
     their position among .reveal siblings. */
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  revealEls.forEach(function (el) {
    if (el.style.getPropertyValue('--rd')) return;
    var siblings = el.parentElement
      ? Array.prototype.filter.call(el.parentElement.children, function (c) { return c.classList.contains('reveal'); })
      : [el];
    var i = siblings.indexOf(el);
    if (i > 0) el.style.setProperty('--rd', ((i % 6) * 0.07).toFixed(2) + 's');
  });
  if (revealEls.length) {
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
      revealEls.forEach(function (el) { io.observe(el); });
      /* Safety net: never leave content permanently hidden if the observer
         doesn't fire (backgrounded tab, odd viewport, browser quirk). */
      setTimeout(function () {
        revealEls.forEach(function (el) { el.classList.add('in-view'); });
      }, 2500);
    } else {
      revealEls.forEach(function (el) { el.classList.add('in-view'); });
    }
  }

  /* Scroll progress bar (injected so every page gets it for free) */
  var progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);

  /* Scroll-linked effects: progress bar, hero fade-out, parallax images.
     One rAF-throttled scroll handler drives all three. */
  var heroTop = document.querySelector('.hero-panel .hero-top');
  var heroOverlay = document.querySelector('.hero-overlay');
  var heroScrollCue = document.querySelector('.hero-scroll-cue');
  var parallaxEls = Array.prototype.slice.call(document.querySelectorAll('[data-parallax]'));
  var fxTicking = false;

  function scrollFx() {
    fxTicking = false;
    var vh = window.innerHeight;
    var max = document.documentElement.scrollHeight - vh;
    progress.style.transform = 'scaleX(' + (max > 0 ? Math.min(window.scrollY / max, 1) : 0) + ')';

    if (!reducedMotionQuery.matches) {
      if (heroTop) {
        var t = Math.min(window.scrollY / (vh * 0.85), 1);
        heroTop.style.transform = 'translateY(' + (t * 70) + 'px) scale(' + (1 - t * 0.06) + ')';
        heroTop.style.opacity = String(1 - t * 0.85);
        /* The photo darkens smoothly into the next section as you scroll past it */
        if (heroOverlay) heroOverlay.style.opacity = String(0.78 + t * 0.22);
        /* The "scroll down" cue only makes sense before scrolling starts */
        if (heroScrollCue) heroScrollCue.style.opacity = String(Math.max(0, 0.8 - t * 4));
      }
      parallaxEls.forEach(function (el) {
        var host = el.parentElement || el;
        var r = host.getBoundingClientRect();
        if (r.bottom < -80 || r.top > vh + 80) return;
        var offset = (r.top + r.height / 2 - vh / 2) * parseFloat(el.getAttribute('data-parallax') || '0');
        offset = Math.max(-48, Math.min(48, offset));
        el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
      });
    }
  }
  window.addEventListener('scroll', function () {
    if (!fxTicking) { fxTicking = true; requestAnimationFrame(scrollFx); }
  }, { passive: true });
  window.addEventListener('resize', function () {
    if (!fxTicking) { fxTicking = true; requestAnimationFrame(scrollFx); }
  }, { passive: true });
  scrollFx();

  /* Count-up stats when they scroll into view */
  var counters = Array.prototype.slice.call(document.querySelectorAll('[data-count]'));
  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var decimals = parseInt(el.getAttribute('data-decimals'), 10) || 0;
    var suffix = el.getAttribute('data-suffix') || '';
    if (reducedMotionQuery.matches) {
      el.textContent = target.toFixed(decimals) + suffix;
      return;
    }
    /* Slow, deliberate count-up rather than a quick tick-up */
    var duration = 2800;
    var startTime = null;
    function tick(ts) {
      if (startTime === null) startTime = ts;
      var p = Math.min((ts - startTime) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 4);
      el.textContent = (target * eased).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if (counters.length && 'IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          cio.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* Product gallery: thumbnail click swaps the main image */
  var mainImg = document.getElementById('pd-main-img');
  var thumbs = Array.prototype.slice.call(document.querySelectorAll('.pd-thumb'));
  if (mainImg && thumbs.length) {
    thumbs.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var src = btn.getAttribute('data-src');
        if (!src || mainImg.getAttribute('src') === src) return;
        thumbs.forEach(function (b) { b.classList.toggle('active', b === btn); });
        mainImg.style.opacity = '0';
        var swap = new Image();
        swap.onload = function () {
          mainImg.src = src;
          mainImg.style.opacity = '1';
        };
        swap.src = src;
      });
    });
  }

  /* Testimonial ticker is pure CSS (continuous marquee-style animation,
     paused on hover/focus via :hover/:focus-within), no JS needed. */
})();
