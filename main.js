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
      window.scrollTo(0, startY + distance * easeInOutCubic(progress));
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
      window.scrollTo(0, wheelCurrent);
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

  /* Reveal-on-scroll for cards, benefits, FAQ items */
  var revealEls = document.querySelectorAll('.reveal');
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

  /* Testimonial ticker is pure CSS (continuous marquee-style animation,
     paused on hover/focus via :hover/:focus-within) — no JS needed. */
})();
