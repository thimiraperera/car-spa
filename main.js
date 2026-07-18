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
      /* behavior:'instant' bypasses html{scroll-behavior:smooth}; without
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
      /* behavior:'instant' bypasses html{scroll-behavior:smooth}; see note
         in smoothScrollTo() above, same double-easing risk applies here. */
      window.scrollTo({ top: wheelCurrent, left: 0, behavior: 'instant' });
      if (wheelTicking) requestAnimationFrame(wheelRender);
    }

    window.addEventListener('wheel', function (e) {
      if (e.ctrlKey) return; /* let pinch-zoom behave natively */
      /* let sideways trackpad scrolling work inside horizontal carousels */
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && e.target.closest && e.target.closest('.prod-carousel-viewport')) return;
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
  var heroPanel = document.querySelector('.hero-panel');
  var heroCar = document.getElementById('hero-car');
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
        /* The brand-mark car drives across the hero as the visitor scrolls,
           wheels spinning with the distance travelled */
        if (heroCar && heroPanel) {
          var panelW = heroPanel.clientWidth;
          var carW = heroCar.offsetWidth || 120;
          /* starts mostly rolled-in at the left, exits fully right */
          var x = -carW * 0.3 + t * (panelW + carW * 1.3);
          heroCar.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,0)';
          var deg = (x / (carW * 0.19)) * 57.3;
          var wheels = heroCar.querySelectorAll('.wheel');
          for (var w = 0; w < wheels.length; w++) {
            wheels[w].style.transform = 'rotate(' + deg.toFixed(1) + 'deg)';
          }
        }
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

  /* Featured products carousel: arrow buttons page through the strip */
  document.querySelectorAll('.prod-carousel').forEach(function (car) {
    var viewport = car.querySelector('.prod-carousel-viewport');
    if (!viewport) return;
    var step = function () { return Math.max(viewport.clientWidth * 0.8, 280); };
    var prev = car.querySelector('.carousel-btn.prev');
    var next = car.querySelector('.carousel-btn.next');
    if (prev) prev.addEventListener('click', function () { viewport.scrollBy({ left: -step(), behavior: 'smooth' }); });
    if (next) next.addEventListener('click', function () { viewport.scrollBy({ left: step(), behavior: 'smooth' }); });
  });

  /* Testimonial ticker is pure CSS (continuous marquee-style animation,
     paused on hover/focus via :hover/:focus-within), no JS needed. */

  /* Hero background slideshow: crossfade whichever slides actually loaded.
     Broken slides remove themselves via onerror, so with one image this is
     simply a static background and with none the gradient shows. */
  var heroBg = document.querySelector('.hero-bg');
  if (heroBg) {
    var slideIndex = 0;
    var firstSlide = heroBg.querySelector('.hero-bg-img');
    if (firstSlide) firstSlide.classList.add('active');
    if (!reducedMotionQuery.matches) {
      setInterval(function () {
        var slides = Array.prototype.slice.call(heroBg.querySelectorAll('.hero-bg-img'));
        if (slides.length < 2) return;
        slideIndex = (slideIndex + 1) % slides.length;
        slides.forEach(function (s, i) { s.classList.toggle('active', i === slideIndex); });
      }, 7000);
    }
  }

  /* Smooth FAQ accordion: <details> snaps open/closed natively, so animate
     the body height by hand in both directions. */
  document.querySelectorAll('.faq-item').forEach(function (item) {
    var summary = item.querySelector('summary');
    var body = item.querySelector('.faq-body');
    if (!summary || !body) return;
    var animating = false;
    summary.addEventListener('click', function (e) {
      e.preventDefault();
      if (animating || reducedMotionQuery.matches) {
        if (!animating) item.open = !item.open;
        return;
      }
      animating = true;
      /* border-box means height can never animate below the body's own
         padding, so the padding has to collapse along with the height or
         the motion visibly snags at the end. Animate both together. */
      var pad = getComputedStyle(body).paddingBottom;
      if (item.open) {
        var h = body.offsetHeight;
        body.style.height = h + 'px';
        body.style.paddingBottom = pad;
        body.style.overflow = 'hidden';
        body.style.transition = 'height .45s cubic-bezier(.22,1,.36,1), padding-bottom .45s cubic-bezier(.22,1,.36,1), opacity .3s ease';
        requestAnimationFrame(function () {
          body.style.height = '0px';
          body.style.paddingBottom = '0px';
          body.style.opacity = '0';
        });
        setTimeout(function () {
          item.open = false;
          body.style.cssText = '';
          animating = false;
        }, 470);
      } else {
        item.open = true;
        var target = body.offsetHeight;
        body.style.height = '0px';
        body.style.paddingBottom = '0px';
        body.style.opacity = '0';
        body.style.overflow = 'hidden';
        body.style.transition = 'height .5s cubic-bezier(.22,1,.36,1), padding-bottom .5s cubic-bezier(.22,1,.36,1), opacity .4s ease .1s';
        requestAnimationFrame(function () {
          body.style.height = target + 'px';
          body.style.paddingBottom = pad;
          body.style.opacity = '1';
        });
        setTimeout(function () {
          body.style.cssText = '';
          animating = false;
        }, 630);
      }
    });
  });

  /* Cursor follower: a single soft blob that inverts whatever it passes over
     (mix-blend-mode difference), swells over interactive elements and squeezes
     on click. Fine-pointer devices only; the native cursor stays visible. */
  if (window.matchMedia('(pointer: fine)').matches && !reducedMotionQuery.matches) {
    var blob = document.createElement('div');
    blob.className = 'cursor-blob';
    blob.setAttribute('aria-hidden', 'true');
    var blobInner = document.createElement('div');
    blobInner.className = 'cursor-blob-inner';
    blob.appendChild(blobInner);
    document.body.appendChild(blob);
    var mouseX = -100, mouseY = -100, blobX = -100, blobY = -100;
    var cursorSeen = false;
    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX; mouseY = e.clientY;
      if (!cursorSeen) {
        cursorSeen = true;
        blobX = mouseX; blobY = mouseY;
        blob.classList.add('visible');
      }
    }, { passive: true });
    document.addEventListener('mouseleave', function () {
      blob.classList.remove('visible');
      cursorSeen = false;
    });
    document.addEventListener('mouseover', function (e) {
      var interactive = e.target.closest('a, button, summary, input, textarea, select, [role="button"]');
      blob.classList.toggle('hover', !!interactive);
    }, { passive: true });
    document.addEventListener('mousedown', function () { blob.classList.add('press'); });
    document.addEventListener('mouseup', function () { blob.classList.remove('press'); });
    (function cursorLoop() {
      blobX += (mouseX - blobX) * 0.13;
      blobY += (mouseY - blobY) * 0.13;
      blob.style.transform = 'translate(' + (blobX - 12) + 'px,' + (blobY - 12) + 'px)';
      requestAnimationFrame(cursorLoop);
    })();
  }

  /* ---------------- Cart ---------------- */
  var CART_KEY = 'carspa_cart_v1';

  function cartRead() {
    try {
      var raw = localStorage.getItem(CART_KEY);
      var items = raw ? JSON.parse(raw) : [];
      return Array.isArray(items) ? items : [];
    } catch (err) { return []; }
  }
  function cartWrite(items) {
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); } catch (err) { /* private mode */ }
    cartRenderBadge();
  }
  function cartCount() {
    return cartRead().reduce(function (n, it) { return n + it.qty; }, 0);
  }
  function cartAdd(item) {
    var items = cartRead();
    var found = null;
    items.forEach(function (it) { if (it.slug === item.slug) found = it; });
    if (found) found.qty += 1;
    else { item.qty = 1; items.push(item); }
    cartWrite(items);
  }
  function cartSetQty(slug, qty) {
    var items = cartRead().map(function (it) {
      if (it.slug === slug) it.qty = qty;
      return it;
    }).filter(function (it) { return it.qty > 0; });
    cartWrite(items);
  }
  function cartClear() { cartWrite([]); }
  function fmtRs(n) { return 'Rs. ' + n.toLocaleString('en-US'); }

  function cartRenderBadge() {
    var n = cartCount();
    document.querySelectorAll('.cart-count').forEach(function (b) {
      b.textContent = String(n);
      b.classList.toggle('show', n > 0);
    });
  }
  cartRenderBadge();

  /* Add-to-cart buttons (product detail pages) */
  document.querySelectorAll('.add-to-cart').forEach(function (btn) {
    btn.addEventListener('click', function () {
      cartAdd({
        slug: btn.getAttribute('data-slug'),
        name: btn.getAttribute('data-name'),
        price: parseInt(btn.getAttribute('data-price'), 10),
        size: btn.getAttribute('data-size'),
        img: btn.getAttribute('data-img')
      });
      var label = btn.querySelector('.atc-label');
      if (label && !btn.classList.contains('added')) {
        btn.classList.add('added');
        var original = label.textContent;
        label.textContent = 'Added to cart';
        setTimeout(function () {
          label.textContent = original;
          btn.classList.remove('added');
        }, 1600);
      }
    });
  });

  /* Cart page */
  var cartRoot = document.getElementById('cart-page');
  function renderCartPage() {
    if (!cartRoot) return;
    var items = cartRead();
    var list = cartRoot.querySelector('.cart-items');
    var empty = cartRoot.querySelector('.cart-empty');
    var summary = cartRoot.querySelector('.cart-summary');
    if (!items.length) {
      list.innerHTML = '';
      empty.hidden = false;
      summary.hidden = true;
      return;
    }
    empty.hidden = true;
    summary.hidden = false;
    var total = 0;
    list.innerHTML = items.map(function (it) {
      var line = it.price * it.qty;
      total += line;
      return '<div class="cart-row" data-slug="' + it.slug + '">' +
        '<a class="cart-thumb" href="products/' + it.slug + '.html"><img src="' + it.img + '" alt="' + it.name + '"></a>' +
        '<div class="cart-info"><a href="products/' + it.slug + '.html"><h4>' + it.name + '</h4></a>' +
        '<small>' + it.size + '</small><span class="cart-unit">' + fmtRs(it.price) + ' each</span></div>' +
        '<div class="cart-qty"><button class="qty-btn" data-d="-1" aria-label="Decrease quantity">&#8722;</button>' +
        '<span>' + it.qty + '</span>' +
        '<button class="qty-btn" data-d="1" aria-label="Increase quantity">+</button></div>' +
        '<div class="cart-line">' + fmtRs(line) + '</div>' +
        '<button class="cart-remove" aria-label="Remove ' + it.name + '">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
        '</button></div>';
    }).join('');
    cartRoot.querySelector('.cart-total-value').textContent = fmtRs(total);
    list.querySelectorAll('.qty-btn').forEach(function (qb) {
      qb.addEventListener('click', function () {
        var row = qb.closest('.cart-row');
        var slug = row.getAttribute('data-slug');
        var current = cartRead().filter(function (it) { return it.slug === slug; })[0];
        if (current) cartSetQty(slug, current.qty + parseInt(qb.getAttribute('data-d'), 10));
        renderCartPage();
      });
    });
    list.querySelectorAll('.cart-remove').forEach(function (rb) {
      rb.addEventListener('click', function () {
        cartSetQty(rb.closest('.cart-row').getAttribute('data-slug'), 0);
        renderCartPage();
      });
    });
  }
  renderCartPage();

  /* Checkout page */
  var checkoutRoot = document.getElementById('checkout-page');
  if (checkoutRoot) {
    var items = cartRead();
    var listEl = checkoutRoot.querySelector('.co-items');
    var form = checkoutRoot.querySelector('#checkout-form');
    if (!items.length) {
      checkoutRoot.querySelector('.co-grid').hidden = true;
      checkoutRoot.querySelector('.co-empty').hidden = false;
    } else {
      var total = 0;
      listEl.innerHTML = items.map(function (it) {
        var line = it.price * it.qty;
        total += line;
        return '<div class="co-item"><img src="' + it.img + '" alt="' + it.name + '">' +
          '<div><h4>' + it.name + '</h4><small>' + it.size + ' &times; ' + it.qty + '</small></div>' +
          '<b>' + fmtRs(line) + '</b></div>';
      }).join('');
      checkoutRoot.querySelector('.co-total-value').textContent = fmtRs(total);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var data = new FormData(form);
        var lines = ['Hi Car Spa LK! I would like to place an order:', ''];
        cartRead().forEach(function (it) {
          lines.push('- ' + it.name + ' (' + it.size + ') x ' + it.qty + ' = ' + fmtRs(it.price * it.qty));
        });
        lines.push('', 'Total: ' + fmtRs(total), '');
        lines.push('Name: ' + data.get('name'));
        lines.push('Phone: ' + data.get('phone'));
        lines.push('Address: ' + data.get('address') + (data.get('city') ? ', ' + data.get('city') : ''));
        lines.push('Payment: ' + data.get('payment'));
        if (data.get('notes')) lines.push('Notes: ' + data.get('notes'));
        var url = 'https://wa.me/94742388588?text=' + encodeURIComponent(lines.join('\n'));
        cartClear();
        checkoutRoot.querySelector('.co-grid').hidden = true;
        checkoutRoot.querySelector('.co-done').hidden = false;
        window.open(url, '_blank', 'noopener');
      });
    }
  }

  /* Contact form: opens the visitor's email app with everything pre-filled */
  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = new FormData(contactForm);
      var subject = '[carspa.lk] ' + data.get('subject');
      var body = data.get('message') +
        '\n\nName: ' + data.get('name') +
        '\nPhone: ' + (data.get('phone') || 'not given');
      window.location.href = 'mailto:info@carspa.lk?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      var note = contactForm.querySelector('.form-note');
      if (note) note.hidden = false;
    });
  }
})();
