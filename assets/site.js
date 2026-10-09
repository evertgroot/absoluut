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

  /* 1b. On the English page, suggest Dutch or Italian to visitors whose device uses that language.
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
      bannerLink.href = '/' + suggest + '/';
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
          eventStatus: 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          location: {
            '@type': 'Place',
            name: 'The Other Side',
            address: { '@type': 'PostalAddress', addressLocality: 'Amsterdam', addressCountry: 'NL' }
          },
          image: ['https://imgroot.nl/assets/img/dj-absoluut-bops.jpg'],
          description: 'Queer pop party with house and disco twists in Amsterdam.',
          organizer: { '@type': 'Organization', name: 'BOPS', url: 'https://www.instagram.com/bops.ams/' },
          performer: { '@type': 'Person', name: 'DJ Absoluut', url: 'https://imgroot.nl/' },
          offers: ev.ticketUrl ? { '@type': 'Offer', url: ev.ticketUrl, availability: 'https://schema.org/InStock' } : undefined
        });
        document.head.appendChild(ld);
        if (ev.ticketUrl) {
          ticketEl.href = ev.ticketUrl;
          ticketEl.hidden = false;
        } else {
          ticketEl.hidden = true;
        }
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
          var topic = (form.querySelector('select[name="topic"]') || {}).selectedIndex;
          var topicNames = ['strategy', 'dj', 'event', 'creator', 'other'];
          if (window.goatcounter && window.goatcounter.count) {
            window.goatcounter.count({ path: 'form-sent-' + (topicNames[topic] || 'other') + '-' + lang, title: 'Contact form sent', event: true });
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
