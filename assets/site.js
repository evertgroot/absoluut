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
