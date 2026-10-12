/* imgroot.nl — small site script
 * 1. Remembers the language a visitor picks (used by the redirect on the English homepage).
 * 2. Fills in the next BOPS event from assets/bops-event.json (updated daily by a GitHub Action).
 * 3. Sends the contact form through Web3Forms without leaving the page (with an email fallback on errors).
 */
(function () {
  'use strict';
  var lang = document.documentElement.lang || 'en';
  var calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
      bannerLink.href = '/' + suggest + (location.pathname.indexOf('/dj/') === 0 ? '/dj/' : '/');
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
     mobile  - the page's main call to action (contact or booking) floats at the bottom right,
               and steps aside once the form or the footer is on screen */
  var menuBtn = document.querySelector('.menu-btn');
  var menu = document.getElementById('mobile-menu');
  var header = document.querySelector('header');
  if (menuBtn && menu) {
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
      document.body.appendChild(fab);
    }
    /* while the menu is open, everything behind it is out of reach for keyboard and screen readers */
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
      if (!open) document.documentElement.classList.remove('sw-menu');
      if (open) { var c = menu.querySelector('[data-close]'); if (c) c.focus(); }
      else if (opener && !opener.hidden) { try { opener.focus({ preventScroll: true }); } catch (e) {} }
    };
    menuBtn.addEventListener('click', function () { setMenu(menu.hidden, menuBtn); });
    menu.querySelectorAll('a, [data-close]').forEach(function (el) {
      if (el.closest('.site-sw')) return; /* the site switch keeps the menu open (it reopens on the other site) */
      el.addEventListener('click', function () { if (!menu.hidden) setMenu(false); });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });
    window.addEventListener('resize', function () { if (!menu.hidden && getComputedStyle(menuBtn).display === 'none') setMenu(false); });
    /* arrived through the site switch in the menu: the menu was reopened before first paint (inline script); sync its state */
    var viaSwitch = null;
    try { viaSwitch = sessionStorage.getItem('imgroot-menu'); sessionStorage.removeItem('imgroot-menu'); } catch (e) {}
    if (viaSwitch && !menu.hidden) {
      opener = menuBtn;
      menuBtn.setAttribute('aria-expanded', 'true');
      setInert(true);
      document.documentElement.style.overflow = 'hidden';
    }

    var css = document.createElement('style');
    css.textContent =
      '.cta-fab{position:fixed;font-family:Manrope,sans-serif;right:16px;bottom:calc(16px + env(safe-area-inset-bottom,0px));z-index:55;display:inline-flex;align-items:center;min-height:52px;padding:0 24px;border-radius:999px;font-size:16px;font-weight:800;text-decoration:none;white-space:nowrap;box-shadow:0 10px 28px rgba(0,0,0,.35);animation:fab-in .25s ease both}' +
      '.cta-fab[hidden]{display:none}.cta-fab:focus-visible{outline:3px solid #ffffff;outline-offset:3px}' +
      'header.hdr-stuck{position:fixed !important;left:0 !important;right:0 !important;top:0 !important;z-index:50 !important;max-width:none !important;padding:10px calc(max(0px, (100% - 1360px) / 2) + clamp(20px, 4vw, 48px)) !important;background:rgba(23,21,95,.94);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-bottom:1px solid rgba(255,255,255,.12);box-shadow:0 10px 30px rgba(0,0,0,.25);animation:bar-in .25s ease both}' +
      '@keyframes fab-in{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:none}}' +
      '@keyframes bar-in{from{transform:translateY(-100%)}to{transform:none}}' +
      '@media (prefers-reduced-motion: reduce){.cta-fab,header.hdr-stuck{animation:none}}' +
      'section[id]{scroll-margin-top:76px}' +
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
    var update = function () {
      var past = window.scrollY > limit();
      var mobile = getComputedStyle(menuBtn).display !== 'none';
      if (header) header.classList.toggle('hdr-stuck', past && !mobile);
      fab.hidden = !(cta && past && mobile && !inView);
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* 1b3. Gold band: keeps drifting on its own, but visitors can swipe, drag or scroll it themselves */
  var bands = document.querySelectorAll('.marquee');
  if (bands.length) {
    var css = document.createElement('style');
    css.textContent = '.marquee.mq-js{overflow-x:auto !important;scrollbar-width:none;cursor:grab;overscroll-behavior-x:contain;-webkit-user-select:none;user-select:none}' +
      '.marquee.mq-js::-webkit-scrollbar{display:none}.marquee.mq-js.mq-drag{cursor:grabbing}' +
      '.marquee.mq-js .marquee-track{animation:none !important}' +
      '.marquee.mq-js:focus-visible{outline:2px solid #2a1d36;outline-offset:-4px}';
    document.head.appendChild(css);
  }
  bands.forEach(function (box) {
    var track = box.querySelector('.marquee-track');
    if (!track) return;
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    box.classList.add('mq-js');
    box.setAttribute('tabindex', '0');
    if (still) return; /* no drift, list wraps; nothing to scroll */
    var pos = 0, seen = 0, last = null, hold = 0, hover = false, focus = false, drag = null, onScreen = true, looping = false;
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
      if (!drag && !hover && !focus && t > hold) {
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

  /* 1c2. Review cards: on small screens they scroll sideways; the dots follow and can be tapped */
  document.querySelectorAll('[data-reviews]').forEach(function (grid) {
    var cards = grid.querySelectorAll('.qcard');
    var dots = grid.parentNode.querySelectorAll('.qdot');
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
  });

  /* 1c2b. Site switch (Evert Groot | DJ Absoluut).
     Clicking is a normal link: the page transition (CSS @view-transition in the page) cross-fades
     the pages and glides the white thumb to the other side. Here we only add dragging the thumb. */
  document.querySelectorAll('.site-sw').forEach(function (sw) {
    var links = [].slice.call(sw.querySelectorAll('a'));
    var thumb = sw.querySelector('.sw-thumb');
    if (links.length !== 2 || !thumb) return;
    var cur = links[1].hasAttribute('aria-current') ? 1 : 0;
    var inMenu = !!sw.closest('#mobile-menu');
    var keepMenu = function () {
      if (!inMenu) return;
      document.documentElement.classList.add('sw-menu');
      try { sessionStorage.setItem('imgroot-menu', '1'); } catch (e) {}
    };
    var leave = function (href) {
      keepMenu();
      location.href = href;
    };
    links.forEach(function (a) {
      a.setAttribute('draggable', 'false');
      a.addEventListener('click', function (e) {
        if (eat) { e.preventDefault(); eat = false; return; }
        if (!a.hasAttribute('aria-current')) keepMenu();
      });
    });
    var drag = null, eat = false;
    var reset = function () {
      sw.classList.remove('sw-drag', 'sw-flip', 'sw-peek');
      thumb.style.transform = '';
    };
    sw.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      drag = { x: e.clientX, id: e.pointerId, moved: false, flip: false };
      if (!inMenu && e.pointerType === 'mouse') sw.classList.add('sw-peek'); /* unfold the other site while the thumb is dragged */
    });
    sw.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x;
      if (!drag.moved) {
        if (Math.abs(dx) < 6) return;
        drag.moved = true;
        sw.classList.add('sw-drag');
        if (!inMenu) sw.classList.add('sw-peek');
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
      if (!d.moved) { sw.classList.remove('sw-peek'); return; }
      eat = true;
      setTimeout(function () { eat = false; }, 60);
      if (e.type === 'pointerup' && d.flip) { sw.classList.remove('sw-drag'); leave(links[1 - cur].getAttribute('href')); }
      else reset();
    };
    sw.addEventListener('pointerup', end);
    sw.addEventListener('pointercancel', end);
    /* each visit: show both names for a moment, then fold the other one into its dot */
    if (!inMenu) {
      var seen = null, key = 'imgroot-sw-peek-' + (cur === 1 ? 'dj' : 'home'); /* once per visit, on each of the two sites */
      try { seen = sessionStorage.getItem(key); sessionStorage.setItem(key, '1'); } catch (err) { seen = '1'; }
      if (!seen) {
        setTimeout(function () { sw.classList.add('sw-peek'); }, 700);
        setTimeout(function () { if (!drag) sw.classList.remove('sw-peek'); }, 2600);
      }
    }
    window.addEventListener('pageshow', function (e) {
      if (e.persisted) { reset(); document.documentElement.classList.remove('sw-menu'); }
    });
  });

  /* 1c2c. Language: current language with an arrow; the other two in a small panel */
  document.querySelectorAll('.lang-dd').forEach(function (dd) {
    var btn = dd.querySelector('.lg-btn'), pop = dd.querySelector('.lg-pop');
    if (!btn || !pop) return;
    var set = function (open, focusFirst) {
      pop.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open && focusFirst) { var a = pop.querySelector('a'); if (a) a.focus(); }
    };
    btn.addEventListener('click', function (e) { set(pop.hidden, e.detail === 0); });
    document.addEventListener('click', function (e) { if (!pop.hidden && !dd.contains(e.target)) set(false); });
    dd.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !pop.hidden) { set(false); btn.focus(); }
    });
    dd.addEventListener('focusout', function (e) { if (!pop.hidden && e.relatedTarget && !dd.contains(e.relatedTarget)) set(false); });
    window.addEventListener('pageshow', function (e) { if (e.persisted) set(false); });
  });

  /* 1c3. Menu: mark the section you're reading (gold line on desktop, gold item in the mobile menu) */
  var spyLinks = [].slice.call(document.querySelectorAll('.nav-links a[href^="#"], #mobile-menu .mm-link[href^="#"]'));
  var spyIds = [];
  spyLinks.forEach(function (a) {
    var id = a.getAttribute('href').slice(1);
    if (spyIds.indexOf(id) < 0 && document.getElementById(id)) spyIds.push(id);
  });
  if (spyIds.length) {
    var spyNow = null, spyTick = false;
    var spySet = function (id) {
      if (id === spyNow) return;
      spyNow = id;
      spyLinks.forEach(function (a) {
        if (id && a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'location');
        else a.removeAttribute('aria-current');
      });
    };
    var spy = function () {
      spyTick = false;
      var line = Math.min(160, window.innerHeight * 0.3), hit = null;
      spyIds.forEach(function (id) {
        var r = document.getElementById(id).getBoundingClientRect();
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

  /* 1d. Press kit: save as PDF (print dialog) and copy the biography */
  document.querySelectorAll('[data-print]').forEach(function (b) {
    b.addEventListener('click', function () { window.print(); });
  });
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
        if (!ev.date) {
          labelEl.textContent = cardEl.getAttribute('data-none');
          dateEl.textContent = '';
          ticketEl.hidden = true;
          return;
        }
        var p = ev.date.split('-').map(Number);
        var d = new Date(p[0], p[1] - 1, p[2]);
        var locale = { en: 'en-US', nl: 'nl-NL', it: 'it-IT' }[lang] || 'en-US';
        var opts = lang === 'en' ? { month: 'long', day: 'numeric' } : { day: 'numeric', month: 'long' };
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
          performer: { '@type': 'Person', name: 'DJ Absoluut', url: 'https://imgroot.nl/' },
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
          status.textContent = form.getAttribute('data-success');
          status.style.color = getComputedStyle(document.documentElement).getPropertyValue('--hv-acc') || '#7bd6e0';
        })
        .catch(function () {
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
    /* buttons with data-pick preselect the category, then the anchor scrolls to the form */
    [].forEach.call(document.querySelectorAll('[data-pick]'), function (a) {
      a.addEventListener('click', function () { pick(a.getAttribute('data-pick')); });
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
