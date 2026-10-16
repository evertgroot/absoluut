/* imgroot.nl — small site script
 * 1. Remembers the language a visitor picks (used by the redirect on the English homepage).
 * 2. Fills in the next BOPS event from assets/bops-event.json (updated daily by a GitHub Action).
 * 3. Sends the contact form through Web3Forms without leaving the page (with an email fallback on errors).
 */
(function () {
  'use strict';
  var lang = document.documentElement.lang || 'en';
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 0. Links to a part of the page glide there instead of jumping (not with reduced motion).
     Arriving from another page with #section: start at the top and glide down once the page has settled.
     A link to Upcoming Gigs falls back to Where I've Played while no upcoming gig is public. */
  var target = function (id) {
    var el = document.getElementById(id);
    if (id === 'upcoming' && (!el || el.hidden)) el = document.getElementById('gigs');
    return el;
  };
  /* our own glide instead of the browser's smooth scroll (which takes 1-1.5s and differs per browser):
     0.45-0.8s depending on distance, fast start and a soft landing; it re-aims every frame, so content that
     appears on the way (Upcoming Gigs, the Next up line) doesn't throw it off, and any scroll by the visitor stops it */
  var glideRun = null;
  var stopGlide = function () { if (glideRun) { cancelAnimationFrame(glideRun); glideRun = null; } };
  ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (ev) { window.addEventListener(ev, stopGlide, { passive: true }); });
  var glide = function (el) {
    if (!el) return;
    stopGlide();
    var dest = function () {
      var m = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      return Math.max(0, Math.min(max, el.getBoundingClientRect().top + window.scrollY - m));
    };
    if (calm) { window.scrollTo(0, dest()); return; }
    var from = window.scrollY, dur = Math.min(800, Math.max(450, 300 + Math.abs(dest() - from) * 0.09)), t0 = null;
    var ease = function (p) { return 1 - Math.pow(1 - p, 3); }; /* ~58% of the way in the first quarter: quick, but the travel stays visible */
    var step = function (t) {
      if (t0 === null) t0 = t;
      var p = Math.min(1, (t - t0) / dur);
      window.scrollTo(0, from + (dest() - from) * ease(p));
      glideRun = p < 1 ? requestAnimationFrame(step) : null;
    };
    glideRun = requestAnimationFrame(step);
  };
  document.addEventListener('click', function (e) {
    if (e.defaultPrevented) return; /* a link with its own scroll handling (e.g. data-pick) already took care of it */
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || a.getAttribute('href').length < 2 || a.hasAttribute('data-noglide')) return;
    var id = a.getAttribute('href').slice(1), el = target(id);
    if (!el || id === 'main' || id === 'cs-form') return; /* skip link and the case-page form keep their own handling */
    e.preventDefault();
    glide(el);
    /* like a normal anchor jump, keyboard focus continues from the section */
    if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1');
    try { el.focus({ preventScroll: true }); } catch (err) {}
    if (history.pushState) history.pushState(null, '', '#' + id);
  });
  var arrive = /^#[\w-]+$/.test(location.hash) ? location.hash.slice(1) : null;
  if (arrive && arrive !== 'main' && !calm && document.getElementById(arrive)) {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo({ top: 0, behavior: 'instant' });
    /* if the visitor scrolls, swipes or uses a key before the glide starts, they stay where they are */
    var tookOver = false, mine = function () { tookOver = true; };
    ['wheel', 'touchstart', 'keydown', 'mousedown'].forEach(function (ev) { window.addEventListener(ev, mine, { passive: true, once: true }); });
    var tries = 0, go = function () {
      if (tookOver) { done(); return; }
      var el = document.getElementById(arrive);
      /* Upcoming Gigs is filled in from the gig list; give it a moment before falling back */
      if (arrive === 'upcoming' && el && el.hidden && tries++ < 15) return setTimeout(go, 100);
      glide(target(arrive));
      setTimeout(done, 900);
    };
    /* afterwards the browser remembers scroll positions again (back and forward land where they should) */
    var done = function () { if ('scrollRestoration' in history) history.scrollRestoration = 'auto'; };
    setTimeout(go, 350); /* the page is parsed by now (deferred script); a short beat at the top, then the glide */
  }

  /* 1. Language choice */
  document.querySelectorAll('a[data-lang]').forEach(function (link) {
    link.addEventListener('click', function () {
      try { localStorage.setItem('imgroot-lang', link.getAttribute('data-lang')); } catch (e) {}
    });
  });

  /* 1b. On the English homepage and DJ page, suggest Dutch or Italian to visitors whose device uses that language.
     No automatic redirect (Google advises against it); the visitor decides. */
  var banner = document.getElementById('lang-banner');
  if (banner) {
    var stored = null;
    try { stored = localStorage.getItem('imgroot-lang'); } catch (e) {}
    var langs = navigator.languages || [navigator.language];
    var suggest = null;
    for (var i = 0; i < langs.length; i++) {
      var code = String(langs[i] || '').slice(0, 2).toLowerCase();
      if (code === 'en') break;
      if (code === 'nl' || code === 'it') { suggest = code; break; }
    }
    if (suggest && !stored) {
      var copy = {
        nl: ['Deze website is ook beschikbaar in het Nederlands.', 'Bekijk in het Nederlands →'],
        it: ['Questo sito è disponibile anche in italiano.', 'Vai alla versione italiana →']
      }[suggest];
      document.getElementById('lang-banner-text').textContent = copy[0];
      var bannerLink = document.getElementById('lang-banner-link');
      bannerLink.textContent = copy[1];
      bannerLink.href = '/' + suggest + (location.pathname.indexOf('/absoluut/') === 0 ? '/absoluut/' : '/');
      bannerLink.setAttribute('data-lang', suggest);
      bannerLink.setAttribute('lang', suggest);
      bannerLink.addEventListener('click', function () {
        try { localStorage.setItem('imgroot-lang', suggest); } catch (e) {}
      });
      banner.hidden = false;
      document.getElementById('lang-banner-close').addEventListener('click', function () {
        banner.hidden = true;
        try { localStorage.setItem('imgroot-lang', 'en'); } catch (e) {}
      });
    }
  }

  /* 1b2. Mobile menu, plus a way forward after scrolling:
     desktop - the header turns into a slim bar fixed to the top;
     mobile  - the same slim bar slides back in whenever the visitor scrolls up or stops scrolling (and out again when
               they read on), and the page's main call to action (contact or booking) floats at the
               bottom right once the hero's own button is gone, stepping aside at the form and footer */
  var menuBtn = document.querySelector('.menu-btn');
  var menu = document.getElementById('mobile-menu');
  var header = document.querySelector('header');
  /* phone/tablet layout: same breakpoint as the CSS that swaps the nav links for the menu button */
  var compact = function () { return window.matchMedia('(max-width: 1060px)').matches; };
  if (header) {
    var opener = menuBtn;
    var cta = document.querySelector('header .hdr-cta');
    var fab = document.createElement('a');
    fab.className = 'cta-fab';
    fab.hidden = true;
    if (cta) {
      fab.href = cta.getAttribute('href');
      fab.textContent = cta.textContent.trim();
      fab.style.background = getComputedStyle(cta).backgroundColor;
      fab.style.color = getComputedStyle(cta).color;
      if (cta.hasAttribute('data-goatcounter-click')) fab.setAttribute('data-goatcounter-click', cta.getAttribute('data-goatcounter-click') + '-fab');
      var mainEl = document.querySelector('main'); /* right after the content in tab order, before the footer */
      if (mainEl) mainEl.parentNode.insertBefore(fab, mainEl.nextSibling); else document.body.appendChild(fab);
    }
    /* while the menu is open, everything behind it is out of reach for keyboard and screen readers */
    if (menuBtn && menu) {
      var setInert = function (on) {
        for (var node = menu; node && node !== document.body; node = node.parentNode) {
          [].forEach.call(node.parentNode.children, function (sib) {
            if (sib === node || sib.tagName === 'SCRIPT' || sib.tagName === 'STYLE') return;
            if (on) sib.setAttribute('inert', ''); else sib.removeAttribute('inert');
          });
        }
      };
      var setMenu = function (open, from) {
        if (open) opener = from || menuBtn;
        menu.hidden = !open;
        setInert(open);
        menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
        document.documentElement.style.overflow = open ? 'hidden' : '';
        if (open) { var c = menu.querySelector('[data-close]'); if (c) c.focus(); }
        else if (opener && !opener.hidden) { try { opener.focus({ preventScroll: true }); } catch (e) {} }
      };
      menuBtn.addEventListener('click', function () { setMenu(menu.hidden, menuBtn); });
      menu.querySelectorAll('a, [data-close]').forEach(function (el) {
        el.addEventListener('click', function () {
          if (menu.hidden) return;
          setMenu(false);
          var target = el.hash && el.pathname === location.pathname && document.getElementById(el.hash.slice(1));
          if (target) {
            if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
            setTimeout(function () { try { target.focus({ preventScroll: true }); } catch (e) {} }, 0);
          }
        });
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });
      window.addEventListener('resize', function () { if (!menu.hidden && getComputedStyle(menuBtn).display === 'none') setMenu(false); });
      /* coming back with the back button: the page may be restored with the menu still open */
      window.addEventListener('pageshow', function (e) { if (e.persisted && !menu.hidden) setMenu(false); });
    }

    var css = document.createElement('style');
    css.textContent =
      '.cta-fab{position:fixed;font-family:Manrope,sans-serif;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:55;display:inline-flex;align-items:center;min-height:52px;padding:0 24px;border-radius:999px;font-size:16px;font-weight:800;text-decoration:none;white-space:nowrap;box-shadow:0 10px 28px rgba(0,0,0,.35);animation:fab-in .25s ease both}' +
      '.cta-fab[hidden]{display:none}.cta-fab:focus-visible{outline:3px solid #ffffff;outline-offset:3px}' +
      'header.hdr-stuck{position:fixed !important;left:0 !important;right:0 !important;top:0 !important;z-index:50 !important;max-width:none !important;padding:10px calc(max(0px, (100% - 1360px) / 2) + clamp(20px, 4vw, 48px)) !important;border-bottom:1px solid rgba(255,255,255,.12);box-shadow:0 10px 30px rgba(0,0,0,.25);animation:bar-in .25s ease both}' +
      '@keyframes fab-in{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:none}}' +
      '@keyframes bar-in{from{transform:translateY(-100%)}to{transform:none}}' +
      '@media (max-width: 1060px){header.hdr-stuck{transition:transform .25s cubic-bezier(.2,.7,.2,1)}header.hdr-stuck.hdr-hide{transform:translateY(-110%);box-shadow:none}}' +
      '@media (prefers-reduced-motion: reduce){.cta-fab,header.hdr-stuck{animation:none;transition:none}}' +
      '@media (min-width: 1061px){section[id]{scroll-margin-top:76px}}' +
      '@media print{.cta-fab{display:none !important}header.hdr-stuck{position:static !important}}';
    document.head.appendChild(css);
    var limit = function () { return Math.max(320, window.innerHeight * 0.6); };
    /* the button steps aside where it would only cover what it points to */
    var inView = 0;
    var goal = cta && cta.getAttribute('href').charAt(0) === '#' ? document.querySelector(cta.getAttribute('href')) : null;
    var asides = [goal, document.querySelector('footer')].filter(Boolean);
    if (asides.length && 'IntersectionObserver' in window) {
      var showing = new Map();
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { showing.set(en.target, en.isIntersecting); });
        inView = 0; showing.forEach(function (v) { if (v) inView++; });
        update();
      });
      asides.forEach(function (el) { io.observe(el); });
    }
    var lastY = window.scrollY, quietUntil = 0;
    var update = function () {
      var y = window.scrollY;
      var past = y > limit();
      var mobile = compact();
      if (!mobile) { header.classList.toggle('hdr-stuck', past); header.classList.remove('hdr-hide'); }
      else if (!past) header.classList.remove('hdr-stuck', 'hdr-hide');
      else if (Math.abs(y - lastY) > 6) {
        if (y < lastY && performance.now() > quietUntil) { header.classList.add('hdr-stuck'); header.classList.remove('hdr-hide'); }
        else if (header.classList.contains('hdr-stuck')) header.classList.add('hdr-hide');
      }
      if (!past || Math.abs(y - lastY) > 6) lastY = y;
      fab.hidden = !(cta && past && mobile && !inView && heroOut);
    };
    /* the hero's own button: while it is fully on screen the header leaves its copy out (CSS),
       and the floating button waits until it has scrolled away */
    var heroBtn = document.querySelector('.hero-cta a');
    var heroOut = !heroBtn;
    if (heroBtn && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        var en = entries[entries.length - 1];
        heroOut = !en.isIntersecting;
        document.body.classList.toggle('hero-cta-out', en.intersectionRatio < 0.99);
        update();
      }, { threshold: [0, 1] }).observe(heroBtn);
    }
    /* jumping to a section is not a scroll up: keep the bar out of the way */
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href*="#"]');
      if (a && a.hash && a.pathname === location.pathname) {
        quietUntil = performance.now() + 700;
        if (header && header.classList.contains('hdr-stuck') && compact()) header.classList.add('hdr-hide');
      }
    });
    /* phones: when the visitor stops scrolling, the bar comes back too */
    var idle = null;
    window.addEventListener('scroll', function () {
      update();
      clearTimeout(idle);
      idle = setTimeout(function reveal() {
        if (!compact() || window.scrollY <= limit()) return;
        if (performance.now() < quietUntil) { idle = setTimeout(reveal, quietUntil - performance.now() + 50); return; }
        header.classList.add('hdr-stuck'); header.classList.remove('hdr-hide');
      }, 350);
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* 1b3. Logo band: keeps drifting on its own, but visitors can swipe, drag or scroll it themselves */
  var bands = document.querySelectorAll('.marquee');
  if (bands.length) {
    var css = document.createElement('style');
    css.textContent = '.marquee.mq-js{overflow-x:auto !important;scrollbar-width:none;cursor:grab;overscroll-behavior-x:contain;-webkit-user-select:none;user-select:none}' +
      '.marquee.mq-js::-webkit-scrollbar{display:none}.marquee.mq-js.mq-drag{cursor:grabbing}' +
      '.marquee.mq-js .marquee-track{animation:none !important}' +
      '.marquee.mq-js:focus-visible{outline:2px solid #ffffff;outline-offset:-4px;box-shadow:inset 0 0 0 4px rgba(0,0,0,.35)}';
    document.head.appendChild(css);
  }
  bands.forEach(function (box) {
    var track = box.querySelector('.marquee-track');
    if (!track || box.classList.contains('marquee-static')) return; /* a static row (homepage) needs none of this */
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    box.classList.add('mq-js');
    if (still) return; /* no drift, list wraps; nothing to scroll or focus */
    box.setAttribute('tabindex', '0');
    var pos = 0, seen = 0, last = null, hold = 0, hover = false, focus = false, drag = null, onScreen = true, looping = false, stopped = false;
    /* a visible pause/play button (WCAG 2.2.2): the band keeps moving otherwise, so visitors can stop it for good */
    var ML = { en: ['Pause the logo band', 'Play the logo band'], nl: ['Logoband pauzeren', 'Logoband afspelen'], it: ['Metti in pausa i loghi', 'Riproduci i loghi'] }[lang] || ['Pause the logo band', 'Play the logo band'];
    var wrapEl = document.createElement('div');
    wrapEl.className = 'mq-wrap';
    box.parentNode.insertBefore(wrapEl, box);
    wrapEl.appendChild(box);
    var pb = document.createElement('button');
    pb.type = 'button'; pb.className = 'mq-pause';
    pb.setAttribute('aria-label', ML[0]); pb.setAttribute('aria-pressed', 'false');
    pb.innerHTML = '<span class="mq-ic" aria-hidden="true"></span>';
    pb.addEventListener('click', function () {
      stopped = !stopped;
      pb.setAttribute('aria-pressed', String(stopped));
      pb.setAttribute('aria-label', stopped ? ML[1] : ML[0]);
      if (!stopped) { pos = box.scrollLeft; last = null; }
    });
    wrapEl.appendChild(pb);
    var first = track.firstElementChild, dup = track.querySelector('.marquee-dup');
    function unit() { return first ? first.offsetWidth : track.scrollWidth / 2; }
    function fill() { /* enough copies that the band never runs out on wide screens */
      if (!dup) return;
      var n = 0;
      while (track.scrollWidth < unit() + box.clientWidth + 2 && n++ < 6) track.appendChild(dup.cloneNode(true));
    }
    fill();
    window.addEventListener('resize', fill);
    function wrap() {
      var u = unit(), max = track.scrollWidth - box.clientWidth;
      if (u <= 0) return;
      if (box.scrollLeft < 1) box.scrollLeft += u;
      else if (box.scrollLeft > max - 1) box.scrollLeft -= u;
      pos = box.scrollLeft; seen = pos;
    }
    function pause(ms) { hold = Math.max(hold, performance.now() + ms); }
    function tick(t) {
      var dt = last === null ? 0 : Math.min((t - last) / 1000, 0.1);
      last = t;
      if (Math.abs(box.scrollLeft - seen) > 2) { pos = box.scrollLeft; wrap(); }
      if (!stopped && !drag && !hover && !focus && t > hold) {
        var u = unit();
        pos += (u / 48) * dt;
        if (pos > track.scrollWidth - box.clientWidth - 1) pos -= u;
        box.scrollLeft = pos;
        seen = box.scrollLeft;
      }
      if (onScreen) requestAnimationFrame(tick); else { looping = false; last = null; }
    }
    function start() { if (!looping) { looping = true; requestAnimationFrame(tick); } }
    start();
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        if (onScreen) start();
      }).observe(box);
    }
    box.addEventListener('focusin', function () { focus = true; });
    box.addEventListener('focusout', function () { focus = false; pause(600); });
    box.addEventListener('scroll', function () { if (drag || performance.now() < hold) { pos = box.scrollLeft; wrap(); } }, { passive: true });
    box.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') hover = true; });
    box.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') { hover = false; pause(600); } });
    box.addEventListener('touchstart', function () { pause(2500); }, { passive: true });
    box.addEventListener('touchmove', function () { pause(2500); }, { passive: true });
    box.addEventListener('wheel', function () { pause(1500); }, { passive: true });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault(); pause(2500);
        box.scrollLeft += e.key === 'ArrowRight' ? 160 : -160;
        pos = box.scrollLeft; wrap();
      }
    });
    box.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      drag = { x: e.clientX, s: box.scrollLeft };
      box.classList.add('mq-drag');
      box.setPointerCapture(e.pointerId);
    });
    box.addEventListener('pointermove', function (e) {
      if (!drag) return;
      box.scrollLeft = drag.s - (e.clientX - drag.x);
      var before = box.scrollLeft; wrap();
      if (box.scrollLeft !== before) drag.s += box.scrollLeft - before;
    });
    function endDrag() { if (!drag) return; drag = null; box.classList.remove('mq-drag'); pause(1500); }
    box.addEventListener('pointerup', endDrag);
    box.addEventListener('pointercancel', endDrag);
  });

  /* 1c. Testimonial slider: changes only when the visitor swipes, drags, scrolls, taps a dot or uses the arrow keys */
  document.querySelectorAll('[data-carousel]').forEach(function (box) {
    var track = box.querySelector('.quote-track');
    var slides = box.querySelectorAll('.quote-slide');
    var dots = box.querySelectorAll('.quote-dot');
    if (!track || !slides.length) return;
    var current = 0, drag = null, timer = null;
    function mark(i) {
      current = i;
      slides.forEach(function (s, n) {
        var on = n === current;
        s.setAttribute('aria-hidden', on ? 'false' : 'true');
        if (on) { s.removeAttribute('inert'); } else { s.setAttribute('inert', ''); }
      });
      dots.forEach(function (d, n) {
        if (n === current) { d.setAttribute('aria-current', 'true'); } else { d.removeAttribute('aria-current'); }
      });
    }
    function show(i, instant) {
      i = (i + slides.length) % slides.length;
      track.scrollTo({ left: i * track.clientWidth, behavior: instant || calm ? 'auto' : 'smooth' });
      mark(i);
    }
    track.addEventListener('scroll', function () {
      if (drag) return;
      clearTimeout(timer);
      timer = setTimeout(function () {
        var i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
        if (i !== current) mark(Math.max(0, Math.min(slides.length - 1, i)));
      }, 90);
    }, { passive: true });
    dots.forEach(function (d) {
      d.addEventListener('click', function () { show(Number(d.getAttribute('data-goto'))); });
    });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }
    });
    /* mouse: drag the quotes sideways like the gold band (touch scrolls natively) */
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('a')) return;
      drag = { x: e.clientX, s: track.scrollLeft, moved: false };
      track.classList.add('q-drag');
      track.setPointerCapture(e.pointerId);
    });
    track.addEventListener('pointermove', function (e) {
      if (!drag) return;
      var dx = e.clientX - drag.x;
      if (Math.abs(dx) > 3) drag.moved = true;
      track.scrollLeft = drag.s - dx;
    });
    function endDrag(e) {
      if (!drag) return;
      var dx = (e && e.clientX !== undefined) ? e.clientX - drag.x : 0;
      drag = null;
      track.classList.remove('q-drag');
      var target = current;
      if (dx < -50) target = Math.min(slides.length - 1, current + 1);
      else if (dx > 50) target = Math.max(0, current - 1);
      show(target);
    }
    track.addEventListener('pointerup', endDrag);
    track.addEventListener('pointercancel', endDrag);
    window.addEventListener('resize', function () { show(current, true); });
  });

  /* 1c2. Review cards (and the Selected Work cards on phones): one sideways row; the dots follow and can be tapped, and a mouse can drag */
  document.querySelectorAll('[data-reviews]').forEach(function (grid) {
    var cards = grid.querySelectorAll('.qcard, :scope > li, :scope > figure');
    /* dots right after the row belong to it (a page can have several rows); otherwise look in the parent */
    var next = grid.nextElementSibling;
    var dots = next && next.classList.contains('qdots') ? next.querySelectorAll('.qdot') : grid.parentNode.querySelectorAll('.qdot');
    if (!cards.length || !dots.length) return;
    var t = null;
    function mark(i) {
      dots.forEach(function (d, n) { if (n === i) { d.setAttribute('aria-current', 'true'); } else { d.removeAttribute('aria-current'); } });
    }
    grid.addEventListener('scroll', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        var best = 0, dist = Infinity, left = grid.getBoundingClientRect().left;
        cards.forEach(function (c, n) { var d = Math.abs(c.getBoundingClientRect().left - left - parseFloat(getComputedStyle(grid).paddingLeft || 0)); if (d < dist) { dist = d; best = n; } });
        if (grid.scrollLeft + grid.clientWidth >= grid.scrollWidth - 4) best = cards.length - 1;
        mark(best);
      }, 60);
    }, { passive: true });
    dots.forEach(function (d, n) {
      d.addEventListener('click', function () {
        grid.scrollTo({ left: cards[n].offsetLeft - cards[0].offsetLeft, behavior: calm ? 'auto' : 'smooth' });
        mark(n);
      });
    });
    var drag = null;
    grid.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button !== 0 || e.target.closest('a')) return;
      drag = { x: e.clientX, s: grid.scrollLeft };
      grid.classList.add('q-drag');
      grid.setPointerCapture(e.pointerId);
    });
    grid.addEventListener('pointermove', function (e) { if (drag) grid.scrollLeft = drag.s - (e.clientX - drag.x); });
    var endDrag = function () {
      if (!drag) return;
      drag = null;
      grid.classList.remove('q-drag');
      /* settle on the nearest card */
      var best = 0, dist = Infinity;
      cards.forEach(function (c, n) { var d = Math.abs(c.offsetLeft - cards[0].offsetLeft - grid.scrollLeft); if (d < dist) { dist = d; best = n; } });
      grid.scrollTo({ left: cards[best].offsetLeft - cards[0].offsetLeft, behavior: calm ? 'auto' : 'smooth' });
    };
    grid.addEventListener('pointerup', endDrag);
    grid.addEventListener('pointercancel', endDrag);
  });

  /* 1c2b. Site switch (Evert Groot | Absoluut).
     Both names are always written out. Clicking is a normal link: the page transition (CSS @view-transition
     in the page) cross-fades the pages and glides the white thumb to the other side. Here we only add
     dragging the thumb; from the mobile menu the menu closes and the visitor lands on the other site's hero. */
  document.querySelectorAll('.site-sw').forEach(function (sw) {
    var links = [].slice.call(sw.querySelectorAll('a'));
    var thumb = sw.querySelector('.sw-thumb');
    if (links.length !== 2 || !thumb) return;
    if (!sw.querySelector('a[aria-current]')) return; /* shared pages (privacy) belong to neither site: plain links, no thumb to drag */
    var cur = links[1].hasAttribute('aria-current') ? 1 : 0;
    var menuEl = sw.closest('#mobile-menu');
    var leave = function (href) {
      if (menuEl) { var x = menuEl.querySelector('[data-close]'); if (x && !menuEl.hidden) x.click(); }
      location.href = href;
    };
    links.forEach(function (a) {
      a.setAttribute('draggable', 'false');
      a.addEventListener('click', function (e) {
        if (eat) { e.preventDefault(); eat = false; }
      });
    });
    var drag = null, eat = false;
    var reset = function () {
      sw.classList.remove('sw-drag', 'sw-flip');
      thumb.style.transform = '';
    };
    sw.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      drag = { x: e.clientX, id: e.pointerId, moved: false, flip: false };
    });
    sw.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (e.pointerType === 'mouse' && e.buttons === 0) { drag = null; reset(); return; } /* button released outside the switch */
      var dx = e.clientX - drag.x;
      if (!drag.moved) {
        if (Math.abs(dx) < 6) return;
        drag.moved = true;
        sw.classList.add('sw-drag');
        try { sw.setPointerCapture(drag.id); } catch (err) {}
      }
      var dist = links[1].offsetLeft - links[0].offsetLeft;
      var x = cur === 0 ? Math.max(0, Math.min(dist, dx)) : Math.max(-dist, Math.min(0, dx));
      thumb.style.transform = 'translateX(' + x + 'px)';
      drag.flip = Math.abs(x) > dist / 2;
      sw.classList.toggle('sw-flip', drag.flip);
    });
    var end = function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var d = drag; drag = null;
      if (!d.moved) return;
      eat = true;
      setTimeout(function () { eat = false; }, 60);
      if (e.type === 'pointerup' && d.flip) { sw.classList.remove('sw-drag'); leave(links[1 - cur].getAttribute('href')); }
      else reset();
    };
    /* a press that ends anywhere (also outside the switch) ends the drag */
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    window.addEventListener('pageshow', function (e) { if (e.persisted) reset(); });
  });

  /* 1c3. Menu: mark the section you are reading (accent line on desktop, accent item in the mobile menu) */
  var spyLinks = [].slice.call(document.querySelectorAll('.nav-links a[href^="#"], #mobile-menu .mm-link[href^="#"]'));
  var spyIds = [];
  /* a link can stand for more than one section (data-spy): "Gigs" lights up for Upcoming Gigs and Where I've Played */
  var spyFor = function (a) { return (a.getAttribute('data-spy') || a.getAttribute('href').slice(1)).split(' '); };
  spyLinks.forEach(function (a) {
    spyFor(a).forEach(function (id) { if (spyIds.indexOf(id) < 0 && document.getElementById(id)) spyIds.push(id); });
  });
  if (spyIds.length) {
    var spyNow = null, spyTick = false;
    var spySet = function (id) {
      if (id === spyNow) return;
      spyNow = id;
      spyLinks.forEach(function (a) {
        if (id && spyFor(a).indexOf(id) > -1) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      });
    };
    var spy = function () {
      spyTick = false;
      var line = Math.min(160, window.innerHeight * 0.3), hit = null;
      spyIds.forEach(function (id) {
        var el = document.getElementById(id);
        if (el.hidden) return;
        var r = el.getBoundingClientRect();
        if (r.top <= line && r.bottom > line) hit = id;
      });
      spySet(hit);
    };
    var spyQueue = function () { if (!spyTick) { spyTick = true; requestAnimationFrame(spy); } };
    window.addEventListener('scroll', spyQueue, { passive: true });
    window.addEventListener('resize', spyQueue);
    spy();
  }

  /* 1c4. "18 years behind the decks": count full years since the first gig (12 January 2008) */
  document.querySelectorAll('[data-years-since]').forEach(function (el) {
    var p = el.getAttribute('data-years-since').split('-');
    var start = new Date(+p[0], +p[1] - 1, +p[2]), now = new Date();
    var years = now.getFullYear() - start.getFullYear();
    if (now.getMonth() < start.getMonth() || (now.getMonth() === start.getMonth() && now.getDate() < start.getDate())) years--;
    if (years > 0) el.textContent = years;
  });

  /* 1c3. Case-page videos: load and play only while on screen, with a pause/play button;
     with reduced motion they stay still until the visitor presses play */
  document.querySelectorAll('video[data-inview]').forEach(function (v) {
    var btn = v.parentNode.querySelector('.cs-ad-toggle');
    var held = calm; /* paused by the visitor (or by reduced motion): don't resume on scroll */
    var sync = function () {
      if (!btn) return;
      btn.setAttribute('aria-label', btn.getAttribute(v.paused ? 'data-play' : 'data-pause'));
      btn.classList.toggle('is-paused', v.paused);
    };
    var play = function () { v.preload = 'auto'; var p = v.play(); if (p && p.catch) p.catch(function () {}); };
    v.addEventListener('play', sync); v.addEventListener('pause', sync);
    var toggle = function () { if (v.paused) { held = false; play(); } else { held = true; v.pause(); } };
    if (btn) btn.addEventListener('click', toggle);
    v.addEventListener('click', toggle);
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { if (!held) play(); } else if (!v.paused) v.pause();
      }, { threshold: 0.25 }).observe(v);
    } else if (!held) play();
    sync();
  });

  /* 1d. Press kit: copy the biography (the PDF is built by GitHub, see .github/workflows/press-kit-pdf.yml) */
  /* Press kit logo: one preview with a colour switch (black on a light tile, white on a dark tile) and a file-format
     switch (PNG by default); the Download button always fetches the chosen colour in the chosen format */
  var lgWrap = document.querySelector('[data-logos] .pk-logo');
  if (lgWrap) {
    var lgSync = function () {
      var tone = (lgWrap.querySelector('input[name="logo-tone"]:checked') || {}).value || 'black';
      var ext = (lgWrap.querySelector('input[name="logo-fmt"]:checked') || {}).value || 'png';
      var name = lgWrap.getAttribute('data-logo') + '-' + tone;
      var art = lgWrap.querySelector('.pk-logo-art');
      art.classList.toggle('pk-logo-dark', tone === 'white');
      art.classList.toggle('pk-logo-light', tone !== 'white');
      lgWrap.querySelectorAll('.pk-logo-art img').forEach(function (img) { img.hidden = img.getAttribute('data-tone') !== tone; });
      var a = lgWrap.querySelector('.pk-logo-dl');
      a.href = '/assets/logo/' + name + '.' + ext;
      a.setAttribute('data-goatcounter-click', 'press-logo-' + tone + '-' + ext);
    };
    lgWrap.addEventListener('change', lgSync);
    lgSync();
  }

  /* Press kit photos: a thumbnail opens a larger preview first (with a description, the file size and a full-size
     download); arrows and the arrow keys move between photos; Escape or the close button returns to the grid */
  var pkWrap = document.querySelector('[data-photos]');
  if (pkWrap && window.HTMLDialogElement) {
    var PK = { en: ['Close', 'Previous photo', 'Next photo', 'Download', 'Photos', 'Photo by'], nl: ['Sluiten', 'Vorige foto', 'Volgende foto', 'Download', 'Foto’s', 'Foto door'],
               it: ['Chiudi', 'Foto precedente', 'Foto successiva', 'Scarica', 'Foto', 'Foto di'] }[lang] || ['Close', 'Previous photo', 'Next photo', 'Download', 'Photos', 'Photo by'];
    var thumbs = [].slice.call(pkWrap.querySelectorAll('.pk-thumb')), cur = 0;
    var box = document.createElement('dialog');
    box.className = 'pk-box';
    box.setAttribute('aria-label', PK[4]);
    /* photo on top, as large as fits; underneath: photographer and count, then ← Download → */
    box.innerHTML = '<div class="pk-stage"><img class="pk-big" alt=""></div><div class="pk-bar"><p class="pk-box-cap" aria-live="polite"><span class="pk-who"></span><span class="pk-count"></span></p><div class="pk-box-acts">' +
      '<button type="button" class="pk-ico" data-pk="-1" aria-label="' + PK[1] + '">←</button>' +
      '<a class="pk-all pk-full" download>' + PK[3] + '<span class="hv-ar hv-dl" aria-hidden="true">↓</span></a>' +
      '<button type="button" class="pk-ico" data-pk="1" aria-label="' + PK[2] + '">→</button>' +
      '</div></div><button type="button" class="pk-ico pk-close" data-pk="close" aria-label="' + PK[0] + '">×</button>';
    document.body.appendChild(box);
    var big = box.querySelector('.pk-big'), cap = box.querySelector('.pk-box-cap'), full = box.querySelector('.pk-full'), count = box.querySelector('.pk-count');
    var showPk = function (i) {
      cur = (i + thumbs.length) % thumbs.length;
      var t = thumbs[cur];
      var src = t.getAttribute('data-big');
      if (big.getAttribute('src') !== src) { big.classList.add('pk-loading'); big.onload = big.onerror = function () { big.classList.remove('pk-loading'); }; big.src = src; }
      big.alt = t.getAttribute('data-alt');
      cap.querySelector('.pk-who').textContent = t.getAttribute('data-credit') ? PK[5] + ' ' + t.getAttribute('data-credit') : '';
      full.href = t.getAttribute('data-full');
      full.setAttribute('data-goatcounter-click', 'press-photo-full-' + (cur + 1));
      count.textContent = (cur + 1) + ' / ' + thumbs.length;
    };
    var opener = null;
    thumbs.forEach(function (t, i) { t.addEventListener('click', function () { opener = t; showPk(i); box.showModal(); }); });
    /* back on the grid, focus lands on the photo that was last shown */
    box.addEventListener('close', function () { var t = thumbs[cur] || opener; if (t) { try { t.focus({ preventScroll: true }); } catch (e) {} } });
    box.addEventListener('click', function (e) {
      var b = e.target.closest('[data-pk]');
      if (b) { var v = b.getAttribute('data-pk'); if (v === 'close') box.close(); else showPk(cur + Number(v)); return; }
      if (e.target === box || e.target.classList.contains('pk-stage')) box.close(); /* a click beside the photo closes */
    });
    box.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); showPk(cur + 1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); showPk(cur - 1); }
    });
    /* swipe left or right on the photo to move between photos */
    var sx = null, sy = 0;
    box.addEventListener('touchstart', function (e) { if (e.touches.length === 1) { sx = e.touches[0].clientX; sy = e.touches[0].clientY; } }, { passive: true });
    box.addEventListener('touchend', function (e) {
      if (sx === null) return;
      var dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
      if (Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy) * 1.5) showPk(cur + (dx < 0 ? 1 : -1));
    }, { passive: true });
    /* preload the larger version when someone points at a thumbnail */
    thumbs.forEach(function (t) { t.addEventListener('pointerenter', function () { var im = new Image(); im.src = t.getAttribute('data-big'); }, { once: true }); });
  }

  document.querySelectorAll('[data-copy]').forEach(function (b) {
    var src = document.getElementById(b.getAttribute('data-copy'));
    if (!src) return;
    var label = b.textContent;
    var selectBio = function () {
      var r = document.createRange(); r.selectNodeContents(src);
      var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
    };
    var done = { en: 'Copied ✓', nl: 'Gekopieerd ✓', it: 'Copiato ✓' }[lang] || 'Copied ✓';
    b.addEventListener('click', function () {
      var text = Array.prototype.map.call(src.querySelectorAll('p'), function (p) { return p.textContent.trim(); }).join('\n\n');
      var ok = function () { b.textContent = done; setTimeout(function () { b.textContent = label; }, 2000); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(ok, function () { selectBio(); });
      } else {
        var t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select();
        try { if (document.execCommand('copy')) ok(); else selectBio(); } catch (e) { selectBio(); }
        document.body.removeChild(t);
      }
    });
  });

  /* 2. Next BOPS event */
  var dateEl = document.getElementById('bops-date');
  var labelEl = document.getElementById('bops-label');
  var ticketEl = document.getElementById('bops-tickets');
  var cardEl = document.getElementById('bops-card');
  if (dateEl && ticketEl) {
    fetch('/assets/bops-event.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (ev) {
        var past = false;
        if (ev.date) {
          var q = ev.date.split('-').map(Number);
          past = new Date(q[0], q[1] - 1, q[2] + 1) <= new Date(); /* the night after the party has passed */
        }
        if (!ev.date || past) {
          labelEl.textContent = cardEl.getAttribute('data-none');
          dateEl.textContent = '';
          ticketEl.hidden = true;
          return;
        }
        var p = ev.date.split('-').map(Number);
        var d = new Date(p[0], p[1] - 1, p[2]);
        var locale = { en: 'en-US', nl: 'nl-NL', it: 'it-IT' }[lang] || 'en-US';
        var opts = lang === 'en' ? { month: 'short', day: 'numeric' } : { day: 'numeric', month: 'short' };
        dateEl.textContent = ' · ' + d.toLocaleDateString(locale, opts);
        /* Structured data so the next BOPS can show up in Google's event results */
        var ld = document.createElement('script');
        ld.type = 'application/ld+json';
        ld.textContent = JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: ev.title === 'BOPS' ? 'BOPS – queer pop party' : ev.title,
          startDate: ev.date,
          /* BOPS runs past midnight, so it ends the next day */
          endDate: ev.endDate || (function () { var e = new Date(Date.UTC(p[0], p[1] - 1, p[2] + 1)); return e.toISOString().slice(0, 10); })(),
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          location: {
            '@type': 'Place',
            name: 'The Other Side',
            address: { '@type': 'PostalAddress', streetAddress: 'Rigakade 10', addressLocality: 'Amsterdam', addressCountry: 'NL' }
          },
          image: ['https://imgroot.nl/assets/img/dj-absoluut-bops.jpg'],
          description: 'Queer pop party with house and disco twists in Amsterdam.',
          organizer: { '@type': 'Organization', name: 'BOPS', url: 'https://www.instagram.com/bops.ams/' },
          performer: { '@type': 'Person', name: 'Absoluut', url: 'https://imgroot.nl/' },
          /* Only describe an offer when the price is known; a price-less offer triggers Search Console warnings */
          offers: (ev.ticketUrl && ev.price !== undefined) ? {
            '@type': 'Offer', url: ev.ticketUrl, price: String(ev.price), priceCurrency: ev.priceCurrency || 'EUR',
            validFrom: ev.validFrom || undefined, availability: 'https://schema.org/InStock'
          } : undefined
        });
        document.head.appendChild(ld);
        /* The button always points to the BOPS Linktree (set in the HTML) */
        ticketEl.hidden = false;
      })
      .catch(function () {});
  }

  /* 2b. DJ page: upcoming gigs from /assets/gigs.json.
     Each gig: { date: "YYYY-MM-DD", event, venue, city, url, show, logo, note, private }. Past gigs appear under
     the "Past events" button, newest first; a private gig shows "Private Wedding/Event" instead of a name, and no link. A gig with "show": false stays hidden
     until it is switched on; add ?gigs=preview to the URL to see hidden gigs too. A gig counts as upcoming
     until 06:00 the next morning, so a late set doesn't disappear at midnight. */
  var upSec = document.getElementById('upcoming');
  var upList = document.getElementById('upcoming-list');
  if (upSec && upList) {
    var preview = /[?&]gigs=preview\b/.test(location.search);
    var T = {
      en: { recent: 'Past Gigs', priv: { wedding: 'Wedding', event: 'Private Event' }, next: 'Next up', more: 'More Dates', all: 'All Upcoming Dates', info: 'Tickets & Info', nt: 'opens in a new tab', preview: 'Preview: Hidden Gigs Are Shown' },
      nl: { recent: 'Afgelopen gigs', priv: { wedding: 'Bruiloft', event: 'Besloten event' }, next: 'Volgende gig', more: 'Meer data', all: 'Alle aankomende data', info: 'Tickets & info', nt: 'opent in een nieuw tabblad', preview: 'Voorbeeld: verborgen gigs worden getoond' },
      it: { recent: 'Date passate', priv: { wedding: 'Matrimonio', event: 'Evento privato' }, next: 'Prossima data', more: 'Altre date', all: 'Tutte le prossime date', info: 'Biglietti e info', nt: 'si apre in una nuova scheda', preview: 'Anteprima: vengono mostrate le date nascoste' }
    }[lang] || null;
    var CITY = {
      nl: { Milan: 'Milaan', Antwerp: 'Antwerpen', Rome: 'Rome', 'The Hague': 'Den Haag', Brussels: 'Brussel' },
      it: { Milan: 'Milano', Antwerp: 'Anversa', Rome: 'Roma', 'The Hague': "L'Aia", Brussels: 'Bruxelles' }
    }[lang] || {};
    var upLoc = { en: 'en-GB', nl: 'nl-NL', it: 'it-IT' }[lang] || 'en-GB';
    var esc = function (t) { return String(t == null ? '' : t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
    fetch('/assets/gigs.json', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(); })
      .then(function (gigs) {
        var now = new Date();
        var list = (gigs || []).filter(function (g) {
          if (!g || !g.date || (g.show === false && !preview)) return false;
          var q = g.date.split('-').map(Number);
          return new Date(q[0], q[1] - 1, q[2] + 1, 6) > now;
        }).sort(function (a, b) { return a.date < b.date ? -1 : 1; });
        var past = (gigs || []).filter(function (g) {
          if (!g || !g.date || (g.show === false && !preview)) return false;
          var q = g.date.split('-').map(Number);
          return new Date(q[0], q[1] - 1, q[2] + 1, 6) <= now;
        }).sort(function (a, b) { /* newest year first; earlier years January to December, the current year newest first */
          var ya = a.date.slice(0, 4), yb = b.date.slice(0, 4);
          if (ya !== yb) return ya < yb ? 1 : -1;
          var asc = a.date < b.date ? -1 : 1;
          return ya === String(now.getFullYear()) ? -asc : asc;
        });
        if (!T) return;
        var thisYear = now.getFullYear();
        var prevYear = String(thisYear);
        var row = function (g) {
          var q = g.date.split('-').map(Number), d = new Date(q[0], q[1] - 1, q[2]);
          var wd = d.toLocaleDateString(upLoc, { weekday: 'short' }).replace('.', '');
          var mo = d.toLocaleDateString(upLoc, { month: 'short' }).replace('.', '').slice(0, 3);
          /* the year shows once, on the first gig of a new year */
          var y = String(q[0]), yr = y !== prevYear ? '<span class="up-yr">' + y + '</span>' : '';
          prevYear = y;
          var city = CITY[g.city] || g.city || '';
          var note = g.note ? (typeof g.note === 'string' ? g.note : (g.note[lang] || g.note.en)) : '';
          var where = [g.venue, note, city].filter(Boolean).join(' · ');
          var name = g.private ? (T.priv[g.private] || T.priv.event) : g.event;
          /* upcoming gigs show the logo; once a gig is past it falls back to its name in plain text */
          var logos = g._past ? [] : g.logos || (g.logo ? [{ src: g.logo, h: g.logoHeight, r: g.logoRatio }] : []);
          var inner = '<time class="up-date" datetime="' + esc(g.date) + '"><span class="up-wd">' + esc(wd) + '</span><span class="up-day">' + q[2] +
            '</span><span class="up-mo">' + esc(mo) + yr + '</span></time><span class="up-what"><span class="up-event">' + (logos.length && !g.private ? '<span class="up-logos" role="img" aria-label="' + esc(g.event) + '">' + logos.map(function (l) { return '<span class="up-logo' + (l.color ? ' is-color' : '') + '" style="--logo:url(\'' + esc(l.src) + '\');height:' + Number(l.h || 20) + 'px;aspect-ratio:' + Number(l.r || 5.56) + '"></span>'; }).join('<span class="up-x" aria-hidden="true">×</span>') + (g.logoName ? '<span class="up-logo-name" aria-hidden="true">' + esc(g.event) + '</span>' : '') + '</span>' : esc(name)) +
            '</span><span class="up-where">' + esc(where) + '</span></span>';
          return g.url && !g.private && !g._past
            ? '<li><a class="up-row" href="' + esc(g.url) + '" target="_blank" rel="noopener noreferrer">' + inner +
              '<span class="up-go hv-ar hv-ne" aria-hidden="true">↗</span><span class="sr-only"> (' + esc(T.info) + ', ' + esc(T.nt) + ')</span></a></li>'
            : '<li><div class="up-row">' + inner + '</div></li>';
        };
        var build = function (arr) { return arr.map(row).join(''); };
        /* on wide screens the two columns read top to bottom, so the dates run in order */
        var cols = function (ul) {
          var half = Math.ceil(ul.children.length / 2);
          ul.classList.add('up-cols'); ul.style.setProperty('--rows', half);
          if (ul.children[half]) ul.children[half].classList.add('up-c2');
        };
        /* past gigs: proof of where I play, so they live at the end of "Where I've Played" (#gigs), behind a button,
           as plain names without links. Grouped per year (newest year first, each year in date order), each year a short list that lines up with
           the three columns above (two on tablets, one on phones), read top to bottom. They show even when no
           upcoming gig is public. */
        var gigsWrap = document.querySelector('#gigs .d-where-div');
        if (past.length && gigsWrap) {
          var rg = document.createElement('div');
          rg.className = 'rg';
          var panel = document.createElement('div');
          panel.className = 'rg-panel'; panel.id = 'recent-gigs'; panel.hidden = true;
          panel.setAttribute('role', 'region'); panel.setAttribute('aria-labelledby', 'recent-gigs-toggle');
          var years = [];
          past.forEach(function (g) { var y = g.date.slice(0, 4); if (!years.length || years[years.length - 1].y !== y) years.push({ y: y, gigs: [] }); years[years.length - 1].gigs.push(g); });
          /* the most recent year is open; earlier years fold up behind their year heading */
          panel.innerHTML = years.map(function (yr, i) {
            prevYear = yr.y; /* the year heading says it, so no year under the month */
            var list = '<ul class="up-list up-past rg-list" id="rg-list-' + yr.y + '" aria-labelledby="rg-' + yr.y + '"' + (i ? ' hidden' : '') +
              ' style="--rows2:' + Math.ceil(yr.gigs.length / 2) + ';--rows3:' + Math.ceil(yr.gigs.length / 3) + '">' +
              yr.gigs.map(function (g) { g._past = true; return row(g); }).join('') + '</ul>';
            if (!i) return '<h4 class="rg-year" id="rg-' + yr.y + '">' + yr.y + '</h4>' + list;
            return '<h4 class="rg-year"><button type="button" class="rg-year-btn" id="rg-' + yr.y + '" aria-expanded="false" aria-controls="rg-list-' + yr.y + '">' +
              yr.y + '<span class="up-past-ar hv-ar hv-d" aria-hidden="true">↓</span></button></h4>' + list;
          }).join('');
          [].forEach.call(panel.querySelectorAll('.rg-year-btn'), function (btn) {
            btn.addEventListener('click', function () {
              var ul = document.getElementById(btn.getAttribute('aria-controls')), open = ul.hidden;
              ul.hidden = !open; btn.setAttribute('aria-expanded', String(open));
            });
          });
          var hd = document.createElement('h3');
          hd.className = 'rg-h';
          var pb = document.createElement('button');
          pb.type = 'button'; pb.className = 'up-past-toggle'; pb.id = 'recent-gigs-toggle';
          pb.setAttribute('aria-expanded', 'false'); pb.setAttribute('aria-controls', 'recent-gigs');
          pb.innerHTML = esc(T.recent) + '<span class="up-past-ar hv-ar hv-d" aria-hidden="true">↓</span>';
          pb.addEventListener('click', function () {
            var open = panel.hidden;
            panel.hidden = !open; pb.setAttribute('aria-expanded', String(open));
          });
          hd.appendChild(pb);
          rg.appendChild(hd); rg.appendChild(panel);
          gigsWrap.appendChild(rg);
        }
        if (!list.length) return;
        var first = list.slice(0, 8), rest = list.slice(8);
        prevYear = String(thisYear); /* the past list above has moved the year on; upcoming starts from this year */
        upList.innerHTML = build(first);
        cols(upList);
        /* the list control (All Upcoming Dates, phones only) sits under the list */
        var actions = document.createElement('div');
        actions.className = 'up-actions';
        upList.parentNode.insertBefore(actions, upList.nextSibling);
        /* on phones only the first three show; a button reveals the rest */
        if (first.length > 3) {
          upList.classList.add('up-collapsed');
          var tg = document.createElement('button');
          tg.type = 'button'; tg.className = 'up-toggle';
          tg.textContent = T.all + ' (' + list.length + ')';
          tg.setAttribute('aria-expanded', 'false'); tg.setAttribute('aria-controls', 'upcoming-list');
          tg.addEventListener('click', function () { upList.classList.remove('up-collapsed'); tg.setAttribute('aria-expanded', 'true'); tg.hidden = true; });
          actions.appendChild(tg);
        }
        var more = document.getElementById('upcoming-more');
        if (more && rest.length) {
          more.querySelector('summary').textContent = T.more + ' (' + rest.length + ')';
          more.querySelector('ul').innerHTML = build(rest);
          cols(more.querySelector('ul'));
          more.hidden = false;
        }
        if (preview) {
          var note = document.createElement('p');
          note.className = 'up-preview'; note.textContent = T.preview;
          upList.parentNode.insertBefore(note, upList);
        } else {
          /* Structured data so public gigs can show up in Google's event results */
          var ld = document.createElement('script');
          ld.type = 'application/ld+json';
          ld.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': list.filter(function (g) { return !g.private; }).map(function (g) {
            return {
              '@type': 'Event', name: g.event + (g.venue ? ' at ' + g.venue : ''), startDate: g.date,
              /* club nights run past midnight, so they end the next day */
              endDate: (function () { var q = g.date.split('-').map(Number); return new Date(Date.UTC(q[0], q[1] - 1, q[2] + 1)).toISOString().slice(0, 10); })(),
              image: ['https://imgroot.nl/assets/img/dj-absoluut-bops.jpg'],
              eventStatus: 'https://schema.org/EventScheduled',
              eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
              location: { '@type': 'Place', name: g.venue || g.event, address: { '@type': 'PostalAddress', addressLocality: g.city } },
              performer: { '@type': 'Person', name: 'Absoluut', url: 'https://imgroot.nl/absoluut/' },
              url: g.url || undefined
            };
          }) });
          document.head.appendChild(ld);
        }
        upSec.hidden = false;
        /* hero: one line with the next gig, linking down to the list */
        var heroNext = document.getElementById('hero-next');
        if (heroNext) {
          /* one quiet line under the buttons, in the hero's own text style: a red status dot, the label and a linked
             date · event · city. No box and no arrow, so it doesn't read as a third button */
          var n = list[0], nq = n.date.split('-').map(Number), nd = new Date(nq[0], nq[1] - 1, nq[2]);
          var nOpts = { weekday: 'short', day: 'numeric', month: 'short' };
          if (nq[0] !== thisYear) nOpts.year = 'numeric';
          var nDate = nd.toLocaleDateString(upLoc, nOpts).replace(/\./g, '');
          var nPlace = CITY[n.city] || n.city || ''; /* city only; the venue is in the list below */
          heroNext.innerHTML = '<a class="hn" href="#upcoming"><span class="hn-dot" aria-hidden="true"></span><span class="hn-label">' + esc(T.next) + '</span>' +
            '<span class="hn-text">' + esc([nDate, n.event, nPlace].filter(Boolean).join(' · ')) + '</span></a>';
          heroNext.hidden = false;
        }
      })
      .catch(function () {});
  }

  /* 2c. Case pages: "Talk Strategy" unfolds the contact form in place; the header and floating
     "Let's Collaborate" buttons (href="#cs-form") open the same form instead of leaving the page */
  var csPanel = document.getElementById('cs-form');
  if (csPanel) {
    var csToggles = [].slice.call(document.querySelectorAll('[data-expand="cs-form"]'));
    var setPanel = function (open, scrollTo) {
      csPanel.hidden = !open;
      csToggles.forEach(function (b) { b.setAttribute('aria-expanded', open ? 'true' : 'false'); });
      if (!open) return;
      var first = csPanel.querySelector('input:not([type="hidden"]):not([type="checkbox"]), textarea');
      csPanel.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: scrollTo || 'nearest' });
      if (first) { try { first.focus({ preventScroll: true }); } catch (e) {} }
    };
    csToggles.forEach(function (b) {
      b.addEventListener('click', function () { setPanel(csPanel.hidden); });
    });
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href="#cs-form"]');
      if (!a) return;
      e.preventDefault();
      setTimeout(function () { setPanel(true, 'center'); }, 0);
    });
  }

  /* 3. Contact form */
  var form = document.getElementById('contact-form');
  if (form) {
    var status = document.getElementById('form-status');
    var button = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var label = button.textContent;
      button.disabled = true;
      button.textContent = form.getAttribute('data-sending');
      status.textContent = '';
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (!res.success) throw new Error(res.message || 'error');
          var sel = form.querySelector('select');
          var opt = sel && sel.options[sel.selectedIndex];
          var key = (opt && opt.getAttribute('data-k')) || 'other';
          var isDj = form.getAttribute('data-form') === 'dj';
          if (window.goatcounter && window.goatcounter.count) {
            window.goatcounter.count({
              path: (isDj ? 'dj-booking-sent-' : 'form-sent-') + key + '-' + lang,
              title: isDj ? 'DJ booking request sent' : 'Contact form sent',
              event: true
            });
          }
          form.reset();
          form.dispatchEvent(new Event('f-reset'));
          status.setAttribute('role', 'status');
          status.textContent = form.getAttribute('data-success');
          status.style.color = getComputedStyle(document.documentElement).getPropertyValue('--hv-acc') || '#7bd6e0';
        })
        .catch(function () {
          status.setAttribute('role', 'alert');
          status.textContent = form.getAttribute('data-error') + ' ';
          var alt = form.getAttribute('data-error-mail');
          if (alt) {
            var mail = document.createElement('a');
            mail.href = 'mailto:evert@imgroot.nl';
            mail.textContent = 'evert@imgroot.nl';
            status.appendChild(document.createTextNode(alt + ' '));
            status.appendChild(mail);
          }
          status.style.color = '#ffb3c8';
        })
        .then(function () {
          button.disabled = false;
          button.textContent = label;
        });
    });
  }

  /* 3b. Form prompts per category, preselect buttons, DJ referral */
  var promptsEl = document.getElementById('form-prompts');
  if (form && promptsEl) {
    var P = {};
    try { P = JSON.parse(promptsEl.textContent); } catch (e) {}
    var fsel = form.querySelector('select');
    var q = function (k) { return form.querySelector('[data-f="' + k + '"]'); };
    var msg = form.querySelector('[name="message"]');
    var details = form.querySelector('[name="details"]');
    var loc = form.querySelector('[name="location"]');
    var hint = q('hint');
    var ref = q('ref');
    var keyOf = function () {
      var o = fsel.options[fsel.selectedIndex];
      return (o && o.getAttribute('data-k')) || '';
    };
    /* everything after the select label, except the referral box, hides for a DJ booking on the home form */
    var rest = [];
    var selLabel = fsel.closest('label');
    for (var el = selLabel.nextElementSibling; el; el = el.nextElementSibling) {
      if (el !== ref && el.tagName !== 'SCRIPT') rest.push(el);
    }
    var apply = function () {
      var k = keyOf();
      var c = (P.cats && P.cats[k]) || P['default'] || {};
      var toRef = P.kind === 'home' && k === 'dj';
      if (ref) {
        ref.hidden = !toRef;
        rest.forEach(function (el) {
          if (el === hint) return;
          el.hidden = toRef;
          [].forEach.call(el.querySelectorAll('input,textarea,button'), function (f) { f.disabled = toRef; });
          if (el.matches('input,textarea,button')) el.disabled = toRef;
        });
      }
      if (P.kind === 'home') {
        if (q('dl') && c.dl) q('dl').textContent = c.dl;
        if (details && c.dp) details.placeholder = c.dp;
      } else {
        if (q('ll') && c.ll) q('ll').textContent = c.ll;
        if (loc && c.lp) loc.placeholder = c.lp;
      }
      if (msg && c.mp) msg.placeholder = c.mp;
      if (hint) { hint.textContent = c.h || ''; hint.hidden = toRef || !c.h; }
    };
    var pick = function (k) {
      for (var i = 0; i < fsel.options.length; i++) {
        if (fsel.options[i].getAttribute('data-k') === k) { fsel.selectedIndex = i; break; }
      }
      apply();
    };
    fsel.addEventListener('change', apply);
    form.addEventListener('f-reset', function () { fsel.selectedIndex = 0; apply(); });
    /* buttons with data-pick preselect the category and land on the form heading (not on the section's
       top padding); focus goes to the preset field so keyboard and screen-reader users arrive there too */
    [].forEach.call(document.querySelectorAll('[data-pick]'), function (a) {
      a.addEventListener('click', function (e) {
        pick(a.getAttribute('data-pick'));
        var sec = form.closest('section'), head = sec && sec.querySelector('h2');
        if (!head) return;
        e.preventDefault();
        glide(head);
        if (history.replaceState) history.replaceState(null, '', '#' + sec.id);
        try { fsel.focus({ preventScroll: true }); } catch (err) {}
      });
    });
    /* arriving with ?type=wedding (e.g. from a shared link) */
    var m = /[?&]type=([a-z-]+)/.exec(location.search);
    if (m) pick(m[1]);
    /* the home form hands typed name and email to the DJ form (same browser tab only) */
    var go = q('ref-go');
    if (go) {
      go.addEventListener('click', function () {
        try {
          sessionStorage.setItem('imgroot-carry', JSON.stringify({
            name: (form.querySelector('[name="name"]') || {}).value || '',
            email: (form.querySelector('[name="email"]') || {}).value || ''
          }));
        } catch (e) {}
      });
    }
    try {
      var carry = JSON.parse(sessionStorage.getItem('imgroot-carry') || 'null');
      if (carry && P.kind === 'dj') {
        sessionStorage.removeItem('imgroot-carry');
        if (carry.name) form.querySelector('[name="name"]').value = carry.name;
        if (carry.email) form.querySelector('[name="email"]').value = carry.email;
      }
    } catch (e) {}
    apply();
  }
})();
