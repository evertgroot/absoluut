/* imgroot.nl — small site script
 * 1. Remembers the language a visitor picks (used by the redirect on the English homepage).
 * 2. Fills in the next BOPS event from assets/bops-event.json (updated daily by a GitHub Action).
 * 3. Sends the contact form through Web3Forms without leaving the page.
 */
(function () {
  'use strict';
  var lang = document.documentElement.lang || 'en';

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

  /* 1b2. Mobile menu, plus a menu that stays reachable after scrolling:
     desktop - the header turns into a slim bar fixed to the top;
     mobile  - a round menu button floats at the bottom right */
  var menuBtn = document.querySelector('.menu-btn');
  var menu = document.getElementById('mobile-menu');
  var header = document.querySelector('header');
  if (menuBtn && menu) {
    var opener = menuBtn;
    var fab = document.createElement('button');
    fab.type = 'button';
    fab.className = 'menu-fab';
    fab.hidden = true;
    fab.setAttribute('aria-label', menuBtn.getAttribute('aria-label') || 'Menu');
    fab.setAttribute('aria-controls', 'mobile-menu');
    fab.setAttribute('aria-expanded', 'false');
    fab.innerHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 8h16M4 16h16"></path></svg>';
    document.body.appendChild(fab);
    var setMenu = function (open, from) {
      if (open) opener = from || menuBtn;
      menu.hidden = !open;
      menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
      fab.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.documentElement.style.overflow = open ? 'hidden' : '';
      if (open) { var c = menu.querySelector('[data-close]'); if (c) c.focus(); }
      else if (opener && !opener.hidden) { try { opener.focus({ preventScroll: true }); } catch (e) {} }
    };
    menuBtn.addEventListener('click', function () { setMenu(menu.hidden, menuBtn); });
    fab.addEventListener('click', function () { setMenu(menu.hidden, fab); });
    menu.querySelectorAll('a, [data-close]').forEach(function (el) {
      el.addEventListener('click', function () { if (!menu.hidden) setMenu(false); });
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !menu.hidden) setMenu(false); });
    window.addEventListener('resize', function () { if (!menu.hidden && getComputedStyle(menuBtn).display === 'none') setMenu(false); });

    var css = document.createElement('style');
    css.textContent =
      '.menu-fab{position:fixed;right:18px;bottom:calc(20px + env(safe-area-inset-bottom,0px));z-index:55;display:inline-flex;align-items:center;justify-content:center;width:58px;height:58px;padding:0;border:2px solid #dbad72;border-radius:999px;background:#17155f;color:#fff;box-shadow:0 10px 28px rgba(0,0,0,.35);cursor:pointer;animation:fab-in .25s ease both}' +
      '.menu-fab[hidden]{display:none}.menu-fab:focus-visible{outline:3px solid #dbad72;outline-offset:3px}' +
      'header.hdr-stuck{position:fixed !important;left:0 !important;right:0 !important;top:0 !important;z-index:50 !important;max-width:none !important;padding:10px calc(max(0px, (100% - 1360px) / 2) + clamp(20px, 4vw, 48px)) !important;background:rgba(23,21,95,.94);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);border-bottom:1px solid rgba(255,255,255,.12);box-shadow:0 10px 30px rgba(0,0,0,.25);animation:bar-in .25s ease both}' +
      '@keyframes fab-in{from{opacity:0;transform:scale(.8)}to{opacity:1;transform:none}}' +
      '@keyframes bar-in{from{transform:translateY(-100%)}to{transform:none}}' +
      '@media (prefers-reduced-motion: reduce){.menu-fab,header.hdr-stuck{animation:none}}' +
      'section[id]{scroll-margin-top:76px}' +
      '@media print{.menu-fab{display:none !important}header.hdr-stuck{position:static !important}}';
    document.head.appendChild(css);
    var limit = function () { return Math.max(320, window.innerHeight * 0.6); };
    var update = function () {
      var past = window.scrollY > limit();
      var mobile = getComputedStyle(menuBtn).display !== 'none';
      if (header) header.classList.toggle('hdr-stuck', past && !mobile);
      fab.hidden = !(past && mobile);
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
    var pos = 0, seen = 0, last = null, hold = 0, hover = false, drag = null;
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
      if (!drag && !hover && t > hold) {
        var u = unit();
        pos += (u / 48) * dt;
        if (pos > track.scrollWidth - box.clientWidth - 1) pos -= u;
        box.scrollLeft = pos;
        seen = box.scrollLeft;
      }
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
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
      track.scrollTo({ left: i * track.clientWidth, behavior: instant ? 'auto' : 'smooth' });
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
        grid.scrollTo({ left: cards[n].offsetLeft - cards[0].offsetLeft, behavior: 'smooth' });
        mark(n);
      });
    });
  });

  /* 1c2b. Site switch (Evert Groot | DJ Absoluut): the white thumb slides to your choice.
     Click or drag it; it slides across, then the other page opens and the thumb settles there. */
  var switches = document.querySelectorAll('.site-sw');
  if (switches.length) {
    var swCss = document.createElement('style');
    swCss.textContent =
      '.site-sw.sw-js{position:relative;isolation:isolate;touch-action:pan-y;-webkit-user-select:none;user-select:none}' +
      '.sw-thumb{position:absolute;left:0;top:3px;bottom:3px;border-radius:999px;background:#fff;z-index:-1;box-shadow:0 2px 10px rgba(0,0,0,.22);transition:transform .34s cubic-bezier(.3,.7,.2,1),width .34s cubic-bezier(.3,.7,.2,1)}' +
      '.site-sw.sw-js a,.site-sw.sw-js a[aria-current],.site-sw.sw-js a[aria-current]:hover{background:transparent;color:#b3afe0;font-weight:700;-webkit-user-drag:none;transition:color .3s ease}' +
      '.site-sw.sw-js a:hover{color:#fff}' +
      '.site-sw.sw-js a.sw-on,.site-sw.sw-js a.sw-on:hover{color:#17155f}' +
      '.site-sw.sw-drag{cursor:grabbing}.site-sw.sw-drag .sw-thumb,.site-sw.sw-still .sw-thumb{transition:none}' +
      '@media (prefers-reduced-motion: reduce){.sw-thumb{transition:none}}';
    document.head.appendChild(swCss);
    var swCalm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var swCame = null;
    try { swCame = sessionStorage.getItem('imgroot-sw'); sessionStorage.removeItem('imgroot-sw'); } catch (e) {}
    switches.forEach(function (sw) {
      var links = [].slice.call(sw.querySelectorAll('a'));
      if (links.length !== 2) return;
      var cur = links[1].hasAttribute('aria-current') ? 1 : 0;
      var thumb = document.createElement('span');
      thumb.className = 'sw-thumb';
      thumb.setAttribute('aria-hidden', 'true');
      sw.insertBefore(thumb, sw.firstChild);
      sw.classList.add('sw-js');
      links.forEach(function (a) { a.setAttribute('draggable', 'false'); });
      var shown = cur, ready = false, sliding = false, drag = null;
      var mark = function (i) { links.forEach(function (a, n) { a.classList.toggle('sw-on', n === i); }); };
      var put = function (x, w) { thumb.style.width = w + 'px'; thumb.style.transform = 'translateX(' + x + 'px)'; };
      var place = function (i, animate) {
        var a = links[i];
        if (!a.offsetWidth) return false;
        if (!animate) sw.classList.add('sw-still');
        put(a.offsetLeft, a.offsetWidth);
        thumb.setAttribute('data-at', Math.round(a.offsetLeft) + 'x' + Math.round(a.offsetWidth));
        mark(i);
        shown = i;
        if (!animate) { void thumb.offsetWidth; sw.classList.remove('sw-still'); }
        return true;
      };
      var go = function (i) {
        var href = links[i].getAttribute('href');
        if (swCalm) { location.href = href; return; }
        sliding = true;
        place(i, true);
        try { sessionStorage.setItem('imgroot-sw', href); } catch (e) {}
        setTimeout(function () { location.href = href; }, 300);
      };
      var start = function () {
        if (ready || !links[cur].offsetWidth) return;
        ready = true;
        if (!swCalm && swCame && swCame === links[cur].getAttribute('href')) {
          place(1 - cur, false); /* arrive from the other side, then settle */
          sliding = true;
          requestAnimationFrame(function () { requestAnimationFrame(function () { place(cur, true); setTimeout(function () { sliding = false; refit(); }, 420); }); });
        } else {
          place(cur, false);
        }
      };
      var refit = function () {
        if (!ready) { start(); return; }
        if (sliding || drag) return;
        var a = links[shown];
        if (a.offsetWidth && (Math.round(a.offsetLeft) + 'x' + Math.round(a.offsetWidth)) === thumb.getAttribute('data-at')) return;
        place(shown, false);
      };
      if (window.ResizeObserver) new ResizeObserver(refit).observe(sw);
      window.addEventListener('resize', refit);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(refit);
      window.addEventListener('pageshow', function (e) { if (e.persisted) place(cur, false); });
      start();

      /* click */
      var eatClick = false;
      links.forEach(function (a, i) {
        a.addEventListener('click', function (e) {
          if (eatClick) { e.preventDefault(); eatClick = false; return; }
          if (i === cur || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
          e.preventDefault();
          go(i);
        });
      });

      /* drag */
      sw.addEventListener('pointerdown', function (e) {
        if (e.button !== 0 || !ready) return;
        drag = { x: e.clientX, id: e.pointerId, moved: false };
      });
      sw.addEventListener('pointermove', function (e) {
        if (!drag || e.pointerId !== drag.id) return;
        var dx = e.clientX - drag.x;
        if (!drag.moved) {
          if (Math.abs(dx) < 6) return;
          drag.moved = true;
          sw.classList.add('sw-drag');
          try { sw.setPointerCapture(drag.id); } catch (err) {}
        }
        var a0 = links[0], a1 = links[1];
        var from = links[cur].offsetLeft;
        var x = Math.max(a0.offsetLeft, Math.min(a1.offsetLeft, from + dx));
        var t = (x - a0.offsetLeft) / ((a1.offsetLeft - a0.offsetLeft) || 1);
        put(x, a0.offsetWidth + (a1.offsetWidth - a0.offsetWidth) * t);
        mark(t > 0.5 ? 1 : 0);
      });
      var end = function (e) {
        if (!drag || e.pointerId !== drag.id) return;
        var d = drag; drag = null;
        if (!d.moved) return;
        sw.classList.remove('sw-drag');
        eatClick = true;
        setTimeout(function () { eatClick = false; }, 60);
        var target = links[1].classList.contains('sw-on') ? 1 : 0;
        if (e.type === 'pointerup' && target !== cur) go(target);
        else place(cur, true);
      };
      sw.addEventListener('pointerup', end);
      sw.addEventListener('pointercancel', end);
    });
  }

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

  /* 1d. Press kit: save as PDF (print dialog) and copy the biography */
  document.querySelectorAll('[data-print]').forEach(function (b) {
    b.addEventListener('click', function () { window.print(); });
  });
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    var src = document.getElementById(b.getAttribute('data-copy'));
    if (!src) return;
    var label = b.textContent;
    var done = { en: 'Copied ✓', nl: 'Gekopieerd ✓', it: 'Copiato ✓' }[lang] || 'Copied ✓';
    b.addEventListener('click', function () {
      var text = Array.prototype.map.call(src.querySelectorAll('p'), function (p) { return p.textContent.trim(); }).join('\n\n');
      var ok = function () { b.textContent = done; setTimeout(function () { b.textContent = label; }, 2000); };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(ok, function () {});
      } else {
        var t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select();
        try { document.execCommand('copy'); ok(); } catch (e) {}
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
          var choice = (form.querySelector('select') || {}).selectedIndex;
          var isDj = form.getAttribute('data-form') === 'dj';
          var names = isDj ? ['wedding', 'private-party', 'club-festival', 'brand-event', 'other'] : ['strategy', 'dj', 'event', 'creator', 'other'];
          if (window.goatcounter && window.goatcounter.count) {
            window.goatcounter.count({
              path: (isDj ? 'dj-booking-sent-' : 'form-sent-') + (names[choice] || 'other') + '-' + lang,
              title: isDj ? 'DJ booking request sent' : 'Contact form sent',
              event: true
            });
          }
          form.reset();
          status.textContent = form.getAttribute('data-success');
          status.style.color = '#dbad72';
        })
        .catch(function () {
          status.textContent = form.getAttribute('data-error');
          status.style.color = '#ffb3c8';
        })
        .then(function () {
          button.disabled = false;
          button.textContent = label;
        });
    });
  }
})();
