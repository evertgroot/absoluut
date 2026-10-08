/*
 * Language switcher for imgroot.nl (EN / NL / IT)
 *
 * - English lives in the HTML itself; this file holds the Dutch and Italian versions.
 * - First visit: the language follows the device/browser setting (falls back to English).
 * - A choice made with the EN/NL/IT switch is remembered on that device.
 * - A link can force a language with ?lang=nl or ?lang=it.
 *
 * To edit a translation: find its key below (the same key is in the HTML as data-i18n="...").
 */
(function () {
  'use strict';

  var LANGS = ['en', 'nl', 'it'];
  var STORAGE_KEY = 'imgroot-lang';

  var DICT = {
    /* English strings that are not in the HTML (set by JavaScript) */
    en: {
      'bops.noDate': 'New date coming soon',
      'bops.tickets': 'Get tickets',
      'bops.ticketsSoon': 'Tickets coming soon'
    },

    nl: {
      /* ---------- shared ---------- */
      'lang.label': 'Taal',
      'footer.by': 'Website door',

      /* ---------- homepage ---------- */
      'home.title': 'IM Groot | Contentstrateeg, creator & DJ',
      'home.desc': 'IM Groot: contentstrateeg, popcultuur-creator en DJ.',
      'home.portraitAlt': 'Portret van Evert Groot',
      'home.djAs': 'DJ <strong>Absoluut</strong>',
      'home.eyebrow': 'Contentstrateeg · Creator · DJ',
      'home.h1': 'Strategie met een hartslag. Content met een doel.',
      'home.intro': 'Ik vertaal inzichten en online gedrag naar scherpe strategieën, formats die blijven hangen en ideeën die mensen willen delen. Daarnaast maak ik content over popmuziek en DJ-sets vol queer joy.',
      'home.btnWork': 'Bekijk mijn werk',
      'home.btnContact': 'Neem contact op',

      'services.title': 'Wat ik doe',
      'services.copy': 'Van het eerste inzicht tot een format dat week na week blijft werken.',
      'services.s1.title': 'Contentstrategie',
      'services.s1.text': 'Een helder verhaal, slimme formats en een plan dat past bij jouw publiek.',
      'services.s2.title': 'Creatieve regie',
      'services.s2.text': 'Sterke concepten en een herkenbare creatieve lijn die alles bij elkaar houdt.',
      'services.s3.title': 'DJ & muziek',
      'services.s3.text': 'Pop, queer joy en guilty pleasures zonder schuldgevoel.',

      'portfolio.title': 'Uitgelichte projecten',
      'portfolio.copy': 'Een selectie van strategie, social content en creatieve projecten.',
      'portfolio.swipe': 'Swipe om te ontdekken',
      'portfolio.collab': 'In samenwerking met The Best Social',
      'p1.alt': 'Voorbeelden van TUI-campagnecontent',
      'p1.type': 'Concept · Creatie · Copy',
      'p1.title': 'TUI-campagnecontent',
      'p1.text': 'Conceptontwikkeling, creatieve regie en copy voor social content van TUI.',
      'p2.alt': 'Voorbeelden van short-form social content voor TUI',
      'p2.type': 'Strategie · Concept',
      'p2.title': 'TUI-socialstrategie',
      'p2.text': 'Strategie en concepten voor short-form reiscontent en terugkerende social formats.',
      'p3.alt': 'Samenwerking tussen Netflix en NikkieTutorials',
      'p3.text': 'Creatief concept voor een samenwerking tussen Netflix en NikkieTutorials.',
      'p4.alt': 'Social content gemaakt voor Stichting FORWARD',
      'p4.type': 'Strategie · Contentplanning · Copy',
      'p4.text': 'Contentstrategie, planning, copy en social content die beleid en belangenbehartiging toegankelijk maken voor een breed publiek.',
      'p5.alt': 'Social content van BOPS',
      'p5.type': 'Strategie · Concept · Creatie · Copy',
      'p5.text': 'Strategie, concepten, creatieve regie en copy voor mijn eigen queer popfeest.',
      'p6.type': 'Content · Advertising · Copy',
      'p6.text': 'Inclusieve social content en campagnes voor Man tot Man op Facebook, Instagram en TikTok.',
      'p7.alt': 'Creator-content voor American Eagle en Pearpop',
      'p7.type': 'Contentreview · Copy',
      'p7.text': 'Review van content en copy voor creator-content van American Eagle en Pearpop.',
      'p8.alt': 'Social content voor Earproof en NXTLI',
      'p8.type': 'Concept · Montage · Copy',
      'p8.text': 'Concept, montage en copy voor short-form social content met experts.',

      'dj.alt': 'Evert Groot als DJ Absoluut',
      'dj.eyebrow': 'DJ Absoluut',
      'dj.title': 'Een opzwepende mix voor elk publiek',
      'dj.text1': 'Met 18 jaar ervaring mix ik iconische hits, nostalgische anthems en nieuwe tracks uit pop, disco en house.',
      'dj.text2': 'Van festivals en clubavonden tot bruiloften en brand events: ik stem elke set af op het moment, van ontspannen muziek tijdens de borrel tot een uitzinnige dansvloer diep in de nacht. Ik kan ook een playlist bouwen rond persoonlijke must-plays en die verwerken in een set waar alle generaties op blijven dansen.',
      'dj.readMore': 'Lees meer',
      'dj.gigs': 'Waar ik heb gedraaid',
      'place.antwerpBelgium': 'Antwerpen, België',
      'place.milanItaly': 'Milaan, Italië',
      'place.netherlands': 'Nederland',
      'place.belgium': 'België',

      'bops.logoAlt': 'BOPS-logo',
      'bops.desc': 'Ik ben medeoprichter van BOPS, een queer popfeest in Amsterdam met een twist van house &amp; disco.',
      'bops.next': 'Volgende editie',
      'bops.noDate': 'Nieuwe datum volgt snel',
      'bops.tickets': 'Koop tickets',
      'bops.ticketsSoon': 'Tickets binnenkort beschikbaar',
      'bops.follow': 'Volg BOPS op Instagram',

      'reels.title': 'Bekijk mijn Reels',
      'reels.view': 'Bekijk deze Reel op Instagram',
      'reels.copy': 'Als DJ en contentcreator deel ik mijn liefde voor popmuziek, zet ik ondergewaardeerde artiesten in de spotlight en duik ik in de internetcultuur eromheen. Mijn Reels zijn al meer dan 1 miljoen keer bekeken.',

      'music.eyebrow': 'Nu te horen',
      'music.title': 'Muziekhoek',
      'music.mixes': 'DJ-mixes',
      'music.bopsPlaylist': 'BOPS-playlist',

      'contact.eyebrow': 'Laten we iets maken',
      'contact.title': 'Heb je een idee, campagne of dansvloer in gedachten?',
      'contact.text': 'Vertel me wat je wilt maken. Ik denk graag mee.',
      'contact.btn': 'Mail me',

      /* ---------- DJ page ---------- */
      'djp.desc': 'Absoluut is een DJ uit Amsterdam die pop, disco en house mixt voor clubs, festivals, bruiloften en brand events.',
      'djp.nav': 'Navigatie DJ-pagina',
      'djp.back': 'Homepage van Evert',
      'djp.heroAlt': 'Evert Groot draait als DJ Absoluut',
      'djp.eyebrow': 'DJ uit Amsterdam',
      'djp.lead': 'De juiste soundtrack voor clubs, festivals, bruiloften, brand events en dansvloeren die wel wat extra plezier verdienen.',
      'djp.meta': '18 jaar ervaring',
      'djp.book': 'Boek Absoluut',
      'djp.explore': 'Ontdek de muziek',
      'djp.aboutAlt': 'Portret van DJ Absoluut',
      'djp.aboutEyebrow': 'Over mij',
      'djp.aboutTitle': 'Van Amsterdam tot internationale dansvloeren',
      'djp.about1': 'Ik begon in 2008 met draaien in het iconische Studio 80 in Amsterdam. Inmiddels draai ik overal: van grote festivals en clubavonden tot bruiloften en brand events.',
      'djp.about2': 'Ik ben medeoprichter van BOPS en draaide onder meer in Paradiso en op events in Antwerpen en Milaan.',
      'djp.musicEyebrow': 'Muziek',
      'djp.musicTitle': 'Pop, disco en house met een opzwepende beat',
      'djp.music1': 'Ik mix iconische hits, nostalgische anthems en nieuwe tracks tot sets die aansluiten bij de sfeer en die nog een tandje hoger zetten.',
      'djp.music2': 'Dat kan ontspannen muziek tijdens de borrel zijn, of losgaan tot diep in de nacht. Voor persoonlijke events bouw ik de muziek op rond jullie must-plays en verwerk ik die in een set waar alle generaties op blijven dansen.',
      'djp.listen': 'Luister op SoundCloud',
      'djp.musicAlt': 'Absoluut draait buiten',
      'djp.gigsAlt': 'Absoluut draait voor een festivalpubliek',
      'djp.gigsTitle': 'Clubs, festivals, Prides en merken',
      'djp.venues': 'Locaties',
      'djp.festivals': 'Festivals &amp; Prides',
      'djp.brands': 'Brand events',
      'djp.redBlue': 'Red &amp; Blue, Antwerpen',
      'djp.qClub': 'Q Club, Milaan',
      'djp.contactAlt': 'Absoluut met zicht op de dansvloer',
      'djp.contactEyebrow': 'Contact',
      'djp.contactTitle': 'Laten we de juiste soundtrack vinden',
      'djp.email': 'E-mail',
      'djp.contactLead': 'Neem contact op voor boekingen, samenwerkingen, bruiloften, clubavonden en brand events.'
    },

    it: {
      /* ---------- shared ---------- */
      'lang.label': 'Lingua',
      'footer.by': 'Sito di',

      /* ---------- homepage ---------- */
      'home.title': 'IM Groot | Content strategist, creator e DJ',
      'home.desc': 'IM Groot: content strategist, creator di cultura pop e DJ.',
      'home.portraitAlt': 'Ritratto di Evert Groot',
      'home.djAs': 'DJ <strong>Absoluut</strong>',
      'home.eyebrow': 'Content strategist · Creator · DJ',
      'home.h1': 'Strategia con il battito. Contenuti con un senso.',
      'home.intro': 'Trasformo insight e comportamenti online in strategie mirate, format memorabili e idee che le persone vogliono condividere. Creo anche contenuti sulla musica pop e DJ set pensati per la gioia queer.',
      'home.btnWork': 'Guarda i miei lavori',
      'home.btnContact': 'Contattami',

      'services.title': 'Cosa faccio',
      'services.copy': 'Dal primo insight a un format che continua a funzionare, settimana dopo settimana.',
      'services.s1.title': 'Strategia dei contenuti',
      'services.s1.text': 'Una storia chiara, format intelligenti e un piano su misura per il tuo pubblico.',
      'services.s2.title': 'Direzione creativa',
      'services.s2.text': 'Concept forti e una direzione creativa riconoscibile che tiene insieme tutto.',
      'services.s3.title': 'DJ e musica',
      'services.s3.text': 'Pop, gioia queer e guilty pleasure senza sensi di colpa.',

      'portfolio.title': 'Progetti selezionati',
      'portfolio.copy': 'Una selezione di progetti di strategia, contenuti social e creatività.',
      'portfolio.swipe': 'Scorri per scoprire',
      'portfolio.collab': 'In collaborazione con The Best Social',
      'p1.alt': 'Esempi di contenuti della campagna TUI',
      'p1.type': 'Concept · Creatività · Copy',
      'p1.title': 'Contenuti per la campagna TUI',
      'p1.text': 'Sviluppo del concept, direzione creativa e copy per i contenuti social di TUI.',
      'p2.alt': 'Esempi di contenuti social short-form per TUI',
      'p2.type': 'Strategia · Concept',
      'p2.title': 'Strategia social per TUI',
      'p2.text': 'Strategia e concept per contenuti di viaggio short-form e format social ricorrenti.',
      'p3.alt': 'Collaborazione tra Netflix e NikkieTutorials',
      'p3.text': 'Concept creativo per una collaborazione tra Netflix e NikkieTutorials.',
      'p4.alt': 'Contenuti social creati per Stichting FORWARD',
      'p4.type': 'Strategia · Piano editoriale · Copy',
      'p4.text': 'Strategia dei contenuti, pianificazione, copy e contenuti social che rendono politiche e advocacy accessibili a un pubblico ampio.',
      'p5.alt': 'Contenuti social di BOPS',
      'p5.type': 'Strategia · Concept · Creatività · Copy',
      'p5.text': 'Strategia, concept, direzione creativa e copy per il mio party queer pop.',
      'p6.type': 'Contenuti · Advertising · Copy',
      'p6.text': 'Contenuti social e campagne inclusive per Man tot Man su Facebook, Instagram e TikTok.',
      'p7.alt': 'Contenuti dei creator per American Eagle e Pearpop',
      'p7.type': 'Revisione contenuti · Copy',
      'p7.text': 'Revisione di contenuti e copy per i progetti social con creator di American Eagle e Pearpop.',
      'p8.alt': 'Contenuti social per Earproof e NXTLI',
      'p8.type': 'Concept · Montaggio · Copy',
      'p8.text': 'Concept, montaggio e copy per contenuti social short-form con esperti.',

      'dj.alt': 'Evert Groot come DJ Absoluut',
      'dj.eyebrow': 'DJ Absoluut',
      'dj.title': 'Un mix pieno di energia per ogni tipo di pubblico',
      'dj.text1': 'Con 18 anni di esperienza, mixo hit iconiche, anthem nostalgici e brani freschi tra pop, disco e house.',
      'dj.text2': 'Dai festival e dalle serate in club ai matrimoni e agli eventi aziendali, adatto ogni set al momento: da una selezione rilassata per l’aperitivo a una pista scatenata fino a tarda notte. Posso anche costruire una playlist attorno ai brani che non possono mancare e inserirli in un set che fa ballare generazioni diverse.',
      'dj.readMore': 'Scopri di più',
      'dj.gigs': 'Dove ho suonato',
      'place.antwerpBelgium': 'Anversa, Belgio',
      'place.milanItaly': 'Milano, Italia',
      'place.netherlands': 'Paesi Bassi',
      'place.belgium': 'Belgio',

      'bops.logoAlt': 'Logo BOPS',
      'bops.desc': 'Sono co-fondatore di BOPS, un party queer pop ad Amsterdam con sfumature house e disco.',
      'bops.next': 'Prossimo evento',
      'bops.noDate': 'Nuova data in arrivo',
      'bops.tickets': 'Acquista i biglietti',
      'bops.ticketsSoon': 'Biglietti in arrivo',
      'bops.follow': 'Segui BOPS su Instagram',

      'reels.title': 'Guarda i miei Reel',
      'reels.view': 'Guarda questo Reel su Instagram',
      'reels.copy': 'Come DJ e content creator condivido il mio amore per la musica pop, do voce ad artisti sottovalutati ed esploro la cultura online che li circonda. I miei Reel hanno superato il milione di visualizzazioni.',

      'music.eyebrow': 'In riproduzione',
      'music.title': 'Angolo musicale',
      'music.mixes': 'DJ mix',
      'music.bopsPlaylist': 'Playlist BOPS',

      'contact.eyebrow': 'Creiamo qualcosa insieme',
      'contact.title': 'Hai in mente un’idea, una campagna o una pista da ballo?',
      'contact.text': 'Raccontami cosa vuoi creare. Sarò felice di pensarci insieme a te.',
      'contact.btn': 'Scrivimi',

      /* ---------- DJ page ---------- */
      'djp.desc': 'Absoluut è un DJ di base ad Amsterdam che mixa pop, disco e house per club, festival, matrimoni ed eventi aziendali.',
      'djp.nav': 'Navigazione pagina DJ',
      'djp.back': 'Homepage di Evert',
      'djp.heroAlt': 'Evert Groot durante un set come DJ Absoluut',
      'djp.eyebrow': 'DJ di base ad Amsterdam',
      'djp.lead': 'La colonna sonora giusta per club, festival, matrimoni, eventi aziendali e piste da ballo che meritano un po’ di gioia in più.',
      'djp.meta': '18 anni di esperienza',
      'djp.book': 'Prenota Absoluut',
      'djp.explore': 'Scopri la musica',
      'djp.aboutAlt': 'Ritratto di DJ Absoluut',
      'djp.aboutEyebrow': 'Chi sono',
      'djp.aboutTitle': 'Da Amsterdam alle piste internazionali',
      'djp.about1': 'Ho iniziato a fare il DJ nel 2008 nel leggendario Studio 80 di Amsterdam. Oggi suono ovunque: grandi festival, serate in club, matrimoni ed eventi aziendali.',
      'djp.about2': 'Sono co-fondatore di BOPS e ho suonato in locali come il Paradiso, oltre che a eventi ad Anversa e Milano.',
      'djp.musicEyebrow': 'Musica',
      'djp.musicTitle': 'Pop, disco e house con un’energia contagiosa',
      'djp.music1': 'Mixo hit iconiche, anthem nostalgici e brani freschi in set che seguono l’atmosfera e la amplificano.',
      'djp.music2': 'Può voler dire una selezione rilassata durante l’aperitivo o ballare senza freni fino a notte fonda. Per gli eventi privati posso costruire la musica attorno ai brani che non possono mancare e inserirli in un set che fa ballare generazioni diverse.',
      'djp.listen': 'Ascolta su SoundCloud',
      'djp.musicAlt': 'Absoluut durante un set all’aperto',
      'djp.gigsAlt': 'Absoluut suona per il pubblico di un festival',
      'djp.gigsTitle': 'Club, festival, Pride e brand',
      'djp.venues': 'Locali',
      'djp.festivals': 'Festival e Pride',
      'djp.brands': 'Eventi aziendali',
      'djp.redBlue': 'Red &amp; Blue, Anversa',
      'djp.qClub': 'Q Club, Milano',
      'djp.contactAlt': 'Absoluut davanti alla pista',
      'djp.contactEyebrow': 'Contatti',
      'djp.contactTitle': 'Troviamo la colonna sonora giusta',
      'djp.email': 'Email',
      'djp.contactLead': 'Per booking, collaborazioni, matrimoni, serate in club ed eventi aziendali, contattami.'
    }
  };

  /* Each binding: [attribute holding the key, how to read/write the value] */
  var BINDINGS = [
    ['data-i18n', function (el) { return el.textContent; }, function (el, v) { el.textContent = v; }],
    ['data-i18n-html', function (el) { return el.innerHTML; }, function (el, v) { el.innerHTML = v; }],
    ['data-i18n-alt', function (el) { return el.getAttribute('alt'); }, function (el, v) { el.setAttribute('alt', v); }],
    ['data-i18n-aria', function (el) { return el.getAttribute('aria-label'); }, function (el, v) { el.setAttribute('aria-label', v); }],
    ['data-i18n-content', function (el) { return el.getAttribute('content'); }, function (el, v) { el.setAttribute('content', v); }]
  ];

  var html = document.documentElement;
  var original = {};   // English text captured from the HTML, per key
  var listeners = [];
  var current = 'en';

  function pick(code) {
    if (!code) return null;
    var base = String(code).toLowerCase().split(/[-_]/)[0];
    return LANGS.indexOf(base) !== -1 ? base : null;
  }

  function fromUrl() {
    try { return pick(new URLSearchParams(window.location.search).get('lang')); } catch (e) { return null; }
  }

  function fromStorage() {
    try { return pick(window.localStorage.getItem(STORAGE_KEY)); } catch (e) { return null; }
  }

  function fromDevice() {
    var list = (navigator.languages && navigator.languages.length) ? navigator.languages : [navigator.language];
    for (var i = 0; i < list.length; i++) {
      var hit = pick(list[i]);
      if (hit) return hit;
    }
    return 'en';
  }

  function t(key) {
    var dict = DICT[current] || {};
    if (Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
    if (Object.prototype.hasOwnProperty.call(original, key)) return original[key];
    return DICT.en[key] || '';
  }

  function eachBound(fn) {
    BINDINGS.forEach(function (b) {
      var nodes = document.querySelectorAll('[' + b[0] + ']');
      for (var i = 0; i < nodes.length; i++) fn(nodes[i], b);
    });
  }

  function captureOriginals() {
    eachBound(function (el, b) {
      var key = el.getAttribute(b[0]);
      if (!Object.prototype.hasOwnProperty.call(original, key)) original[key] = b[1](el);
    });
  }

  function apply() {
    eachBound(function (el, b) {
      var key = el.getAttribute(b[0]);
      var value = t(key);
      if (value && b[1](el) !== value) b[2](el, value);
    });

    html.setAttribute('lang', current);

    var buttons = document.querySelectorAll('[data-set-lang]');
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].setAttribute('aria-pressed', buttons[i].getAttribute('data-set-lang') === current ? 'true' : 'false');
    }
  }

  function setLang(lang, remember) {
    lang = pick(lang) || 'en';
    current = lang;
    if (remember) {
      try { window.localStorage.setItem(STORAGE_KEY, lang); } catch (e) {}
    }
    apply();
    listeners.forEach(function (fn) { try { fn(lang); } catch (e) {} });
  }

  /* Decide the language right away, so the page can be hidden until translated */
  current = fromUrl() || fromStorage() || fromDevice();
  html.setAttribute('lang', current);
  if (current !== 'en') {
    html.classList.add('i18n-pending');
    setTimeout(function () { html.classList.remove('i18n-pending'); }, 1500); // never leave the page hidden
  }

  function init() {
    captureOriginals();
    apply();
    html.classList.remove('i18n-pending');

    document.addEventListener('click', function (event) {
      var button = event.target.closest && event.target.closest('[data-set-lang]');
      if (!button) return;
      setLang(button.getAttribute('data-set-lang'), true);
    });

    listeners.forEach(function (fn) { try { fn(current); } catch (e) {} });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* Small public API, used by the BOPS event block */
  window.I18N = {
    t: t,
    get lang() { return current; },
    set: function (lang) { setLang(lang, true); },
    refresh: apply,
    onChange: function (fn) { listeners.push(fn); },
    locale: function () { return { en: 'en-GB', nl: 'nl-NL', it: 'it-IT' }[current]; }
  };
})();
