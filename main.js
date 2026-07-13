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

  /* Testimonial carousel: autoplay, arrows, dots, pause on hover/focus */
  var carousel = document.querySelector('.testi-carousel');
  if (carousel) {
    var track = carousel.querySelector('.testi-track');
    var slides = Array.prototype.slice.call(carousel.querySelectorAll('.testi-slide'));
    var dotsWrap = carousel.querySelector('.testi-dots');
    var prevBtn = carousel.querySelector('.testi-arrow.prev');
    var nextBtn = carousel.querySelector('.testi-arrow.next');
    var index = 0;
    var timer = null;
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var autoplayMs = parseInt(carousel.getAttribute('data-autoplay'), 10) || 5000;
    var dots = [];

    if (dotsWrap) {
      slides.forEach(function (_, i) {
        var dot = document.createElement('button');
        dot.className = 'testi-dot' + (i === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Go to testimonial ' + (i + 1));
        dot.addEventListener('click', function () { goTo(i); restart(); });
        dotsWrap.appendChild(dot);
        dots.push(dot);
      });
    }

    function render() {
      track.style.transform = 'translateX(-' + (index * 100) + '%)';
      dots.forEach(function (d, i) { d.classList.toggle('active', i === index); });
    }
    function goTo(i) { index = (i + slides.length) % slides.length; render(); }
    function next() { goTo(index + 1); }
    function prev() { goTo(index - 1); }
    function start() {
      if (reducedMotion || slides.length < 2) return;
      stop();
      timer = setInterval(next, autoplayMs);
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } }
    function restart() { stop(); start(); }

    if (nextBtn) nextBtn.addEventListener('click', function () { next(); restart(); });
    if (prevBtn) prevBtn.addEventListener('click', function () { prev(); restart(); });
    carousel.addEventListener('mouseenter', stop);
    carousel.addEventListener('mouseleave', start);
    carousel.addEventListener('focusin', stop);
    carousel.addEventListener('focusout', start);

    render();
    start();
  }
})();
