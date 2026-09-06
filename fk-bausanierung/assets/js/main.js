/* =====================================================================
   FK Bausanierung Kastrati — Interaktion

   1 Konfiguration      2 Bildplatzhalter    3 Navigation
   4 Einblenden/Zahlen  5 Kontaktfenster     6 Leistungskacheln
   7 Projekt-Karussell  8 Großansicht        9 Formular
   ===================================================================== */
(function () {
  'use strict';

  /* ---------------- 1 — Konfiguration ----------------
     Hier eintragen, sobald die Daten feststehen.        */
  var CONFIG = {
    // Leer lassen = das Formular öffnet das E-Mail-Programm des Besuchers.
    // Für echten Versand eine Formular-URL eintragen (Formspree, Netlify
    // Forms oder ein PHP-Skript des eigenen Hosters).
    formEndpoint: '',
    // TODO: echte Empfängeradresse
    mailTo: 'info@fk-bausanierung.de'
  };

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  // Erst wenn das Skript läuft, dürfen Inhalte für die Einblendung
  // ausgeblendet werden — sonst bliebe die Seite bei einem Fehler leer.
  document.documentElement.classList.add('js-reveal');

  /* ---------------- 2 — Bildplatzhalter ersetzen ----------------
     Jedes Element mit data-img lädt sein Foto nach. Fehlt die Datei,
     bleibt der gestaltete Verlauf stehen.                          */
  $$('[data-img]').forEach(function (el) {
    var src = el.getAttribute('data-img');
    if (!src) return;
    var probe = new Image();
    probe.onload = function () {
      el.style.backgroundImage = 'url("' + src + '")';
      el.classList.add('has-img');
    };
    probe.src = src;
  });

  /* ---------------- 3 — Navigation ---------------- */
  var nav = $('#nav');
  var navToggle = $('#navToggle');
  var navLinks = $('#navLinks');
  var sectionLinks = $$('.nav__links a[href^="#"]:not(.btn)');
  var sections = sectionLinks.map(function (a) { return $(a.getAttribute('href')); });

  var onScroll = function () {
    if (nav && !nav.classList.contains('nav--solid')) {
      nav.classList.toggle('is-stuck', window.scrollY > 30);
    }
    // Aktiven Menüpunkt markieren
    var pos = window.scrollY + 140;
    var current = -1;
    sections.forEach(function (sec, i) {
      if (sec && sec.offsetTop <= pos) current = i;
    });
    sectionLinks.forEach(function (a, i) { a.classList.toggle('is-active', i === current); });
  };

  var closeMenu = function () {
    if (!navLinks) return;
    navLinks.classList.remove('is-open');
    if (navToggle) {
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Menü öffnen');
    }
  };

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    });
    navLinks.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });
  }

  /* ---------------- 4 — Einblenden und Zahlen ----------------
     Ohne IntersectionObserver, damit auch Abschnitte erscheinen, die
     beim Laden schon im Bild sind (z. B. beim Aufruf von …/#projekte). */
  var pending = $$('.reveal');
  var pendingStats = $$('.stat__num');

  var inView = function (el, margin) {
    var r = el.getBoundingClientRect();
    var h = window.innerHeight || document.documentElement.clientHeight;
    return r.top < h - (margin || 0) && r.bottom > 0;
  };

  var renderStat = function (el, value) {
    var suffix = el.getAttribute('data-suffix') || '';
    el.innerHTML = value + (suffix ? '<span>' + suffix + '</span>' : '');
  };

  var runCount = function (el) {
    var target = parseInt(el.getAttribute('data-count'), 10) || 0;
    if (reduceMotion || document.hidden) { renderStat(el, target); return; }
    var duration = 1400, start = null;
    var step = function (ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      renderStat(el, Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  var checkInView = function () {
    pending = pending.filter(function (el) {
      if (!inView(el, 60)) return true;
      el.classList.add('is-in');
      return false;
    });
    pendingStats = pendingStats.filter(function (el) {
      if (!inView(el, 40)) return true;
      runCount(el);
      return false;
    });
  };

  if (reduceMotion) {
    pending.forEach(function (el) { el.classList.add('is-in'); });
    pending = [];
  }

  // Drosselung über setTimeout: läuft auch in Hintergrund-Tabs weiter.
  var scheduled = false;
  var onScrollThrottled = function () {
    onScroll();
    if (scheduled) return;
    scheduled = true;
    setTimeout(function () { scheduled = false; checkInView(); }, 60);
  };

  /* ---------------- 5 — Kontaktfenster ----------------
     Der Kontaktbereich steht nicht in der Seite, sondern öffnet sich
     über jeden Verweis auf #kontakt. Ohne JavaScript greift die
     :target-Regel im Stylesheet.                                     */
  var modal = $('#kontakt');
  var serviceSelect = $('#f-service');
  var firstField = $('#f-name');
  var modalOpener = null;

  var openModal = function (opener, service) {
    if (!modal) return;
    modalOpener = opener || null;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    if (service && serviceSelect) {
      var found = Array.prototype.some.call(serviceSelect.options, function (o) {
        if (o.text.replace(/\s+/g, ' ').trim() === service.replace(/\s+/g, ' ').trim()) {
          serviceSelect.value = o.value || o.text;
          return true;
        }
        return false;
      });
      if (!found) serviceSelect.value = '';
    }
    setTimeout(function () {
      if (firstField) firstField.focus({ preventScroll: true });
    }, reduceMotion ? 0 : 240);
  };

  var closeModal = function () {
    if (!modal || modal.hidden) return;
    modal.hidden = true;
    document.body.style.overflow = '';
    if (modalOpener) modalOpener.focus();
  };

  $$('a[href="#kontakt"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      closeMenu();
      openModal(link);
    });
  });

  if (modal) {
    // Schließen: Kreuz, Fläche daneben, Klick auf den Fensterrahmen selbst
    modal.addEventListener('click', function (e) {
      if (e.target === modal || e.target.closest('[data-close]')) closeModal();
    });
    // Tastatur bleibt im Fenster
    modal.addEventListener('keydown', function (e) {
      if (e.key !== 'Tab') return;
      var f = $$('button, input, select, textarea, a[href]', modal).filter(function (el) {
        return !el.disabled && el.offsetParent !== null;
      });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---------------- 6 — Leistungskacheln ----------------
     Jede Kachel öffnet das Kontaktfenster mit vorausgewählter Leistung. */
  $$('.tile[data-service]').forEach(function (tile) {
    tile.addEventListener('click', function () {
      openModal(tile, tile.getAttribute('data-service'));
    });
  });

  /* ---------------- 7 — Projekt-Karussell ---------------- */
  var strip = $('#strip');
  var stripPrev = $('#stripPrev');
  var stripNext = $('#stripNext');
  var stripCount = $('#stripCount');
  var stripBar = $('#stripBar');
  var shots = strip ? $$('.shot', strip) : [];

  var pad = function (n) { return (n < 10 ? '0' : '') + n; };

  if (strip) {
    var cardStep = function () {
      var card = shots[0];
      if (!card) return 340;
      var gap = parseFloat(getComputedStyle(strip).columnGap) || 18;
      return card.getBoundingClientRect().width + gap;
    };

    var updateStrip = function () {
      var max = strip.scrollWidth - strip.clientWidth;
      var noScroll = max < 8;

      if (stripPrev && stripNext) {
        stripPrev.disabled = strip.scrollLeft < 8;
        stripNext.disabled = strip.scrollLeft > max - 8;
        stripPrev.hidden = noScroll;
        stripNext.hidden = noScroll;
      }

      var perView = Math.max(1, Math.round(strip.clientWidth / cardStep()));
      // Am rechten Anschlag steht das letzte Bild vollständig im Bild —
      // dann zeigt der Zähler auch die letzte Nummer.
      var index = strip.scrollLeft > max - 8
        ? shots.length
        : Math.min(shots.length, Math.round(strip.scrollLeft / cardStep()) + 1);
      if (stripCount) stripCount.textContent = pad(index) + ' / ' + pad(shots.length);
      if (stripBar) {
        var share = Math.min(100, (perView / shots.length) * 100);
        var progress = max > 0 ? (strip.scrollLeft / max) * (100 - share) : 0;
        stripBar.style.width = share + '%';
        stripBar.style.transform = 'translateX(' + (progress / share) * 100 + '%)';
      }
    };

    var slide = function (dir) {
      var before = strip.scrollLeft;
      var max = strip.scrollWidth - strip.clientWidth;
      var target = Math.max(0, Math.min(max, before + dir * cardStep()));
      strip.scrollTo({ left: target, behavior: reduceMotion ? 'auto' : 'smooth' });
      // Sicherheitsnetz: läuft die weiche Bewegung nicht an (manche
      // eingebetteten Browser), wird hart gesetzt.
      setTimeout(function () {
        if (Math.abs(strip.scrollLeft - before) < 4 && Math.abs(target - before) > 4) {
          // Ohne weiche Bewegung setzen, sonst greift dieselbe Bremse erneut.
          strip.style.scrollBehavior = 'auto';
          strip.scrollLeft = target;
          strip.style.scrollBehavior = '';
        }
        updateStrip();
      }, 420);
    };

    if (stripPrev) stripPrev.addEventListener('click', function () { slide(-1); });
    if (stripNext) stripNext.addEventListener('click', function () { slide(1); });
    strip.addEventListener('scroll', updateStrip, { passive: true });
    window.addEventListener('resize', updateStrip);

    strip.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); slide(1); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); slide(-1); }
    });

    // Mit der Maus ziehen
    var dragging = false, dragStartX = 0, dragStartLeft = 0, dragMoved = 0;
    strip.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') return;      // Touch macht der Browser selbst
      dragging = true; dragMoved = 0;
      dragStartX = e.clientX; dragStartLeft = strip.scrollLeft;
      strip.classList.add('is-dragging');
    });
    window.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - dragStartX;
      dragMoved = Math.abs(dx);
      strip.scrollLeft = dragStartLeft - dx;
    });
    window.addEventListener('pointerup', function () {
      if (!dragging) return;
      dragging = false;
      strip.classList.remove('is-dragging');
      updateStrip();
    });

    updateStrip();
    window.addEventListener('load', updateStrip);
  }

  /* ---------------- 8 — Großansicht (Lightbox) ---------------- */
  var lightbox = $('#lightbox');
  var lightboxImg = $('#lightboxImg');
  var lightboxCap = $('#lightboxCap');
  var lightboxClose = $('#lightboxClose');
  var lightboxPrev = $('#lightboxPrev');
  var lightboxNext = $('#lightboxNext');
  var lbIndex = 0;
  var lbOpener = null;

  var showShot = function (i) {
    if (!shots.length) return;
    lbIndex = (i + shots.length) % shots.length;
    var shot = shots[lbIndex];
    var bild = shot.querySelector('[data-img]') || shot;
    var src = bild.getAttribute('data-img');
    lightboxImg.style.backgroundImage = bild.classList.contains('has-img') ? 'url("' + src + '")' : '';
    if (lightboxCap) lightboxCap.textContent = shot.getAttribute('data-caption') || '';
  };

  var openLightbox = function (shot) {
    if (!lightbox) return;
    lbOpener = shot;
    showShot(shots.indexOf(shot));
    lightbox.hidden = false;
    document.body.style.overflow = 'hidden';
    if (lightboxClose) lightboxClose.focus();
  };

  var closeLightbox = function () {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.style.overflow = '';
    if (lbOpener) lbOpener.focus();
  };

  shots.forEach(function (shot) {
    shot.addEventListener('click', function () {
      if (strip && strip.classList.contains('is-dragging')) return;
      openLightbox(shot);
    });
  });

  if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener('click', function () { showShot(lbIndex - 1); });
  if (lightboxNext) lightboxNext.addEventListener('click', function () { showShot(lbIndex + 1); });
  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeLightbox(); closeModal(); }
    if (lightbox && !lightbox.hidden) {
      if (e.key === 'ArrowLeft') showShot(lbIndex - 1);
      if (e.key === 'ArrowRight') showShot(lbIndex + 1);
    }
  });

  /* ---------------- 9 — Kontaktformular ---------------- */
  var form = $('#contactForm');
  var status = $('#formStatus');

  var setError = function (input, hasError) {
    var field = input.closest('.field');
    if (field) field.classList.toggle('has-error', hasError);
  };

  var validate = function () {
    var ok = true;
    $$('[required]', form).forEach(function (input) {
      var invalid = input.type === 'checkbox' ? !input.checked : (!input.checkValidity() || !input.value.trim());
      setError(input, invalid);
      if (invalid && ok) input.focus();
      if (invalid) ok = false;
    });
    return ok;
  };

  var showDone = function (text) {
    var card = $('#anfrage');
    if (!card) return;
    card.innerHTML =
      '<div class="form-done">' +
        '<span class="form-done__icon" aria-hidden="true">' +
          '<svg viewBox="0 0 24 24" width="26" height="26"><path fill="currentColor" d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>' +
        '</span>' +
        '<h3>Vielen Dank!</h3>' +
        '<p>' + text + '</p>' +
        '<a class="btn btn--accent" href="tel:+4917675054807">Oder direkt anrufen: 0176 / 75 05 48 07</a>' +
      '</div>';
  };

  if (form) {
    $$('[required]', form).forEach(function (input) {
      input.addEventListener('input', function () { setError(input, false); });
      input.addEventListener('change', function () { setError(input, false); });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      status.textContent = '';
      status.classList.remove('is-ok');

      if (!validate()) {
        status.textContent = 'Bitte prüfen Sie die markierten Felder.';
        return;
      }

      var data = new FormData(form);

      if (CONFIG.formEndpoint) {
        status.textContent = 'Anfrage wird gesendet …';
        fetch(CONFIG.formEndpoint, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
          .then(function (res) {
            if (!res.ok) throw new Error('Fehler beim Senden');
            showDone('Ihre Anfrage ist bei uns eingegangen. Wir melden uns innerhalb von 24 Stunden.');
          })
          .catch(function () {
            status.textContent = 'Senden fehlgeschlagen. Bitte rufen Sie uns an oder schreiben Sie eine E-Mail.';
          });
        return;
      }

      // Kein Endpunkt hinterlegt: E-Mail-Programm mit fertiger Anfrage öffnen.
      var body = [
        'Name: ' + (data.get('name') || ''),
        'E-Mail: ' + (data.get('email') || ''),
        'Telefon: ' + (data.get('phone') || ''),
        'Leistung: ' + (data.get('service') || '—'),
        '',
        'Nachricht:',
        data.get('message') || ''
      ].join('\n');

      window.location.href = 'mailto:' + CONFIG.mailTo +
        '?subject=' + encodeURIComponent('Anfrage über die Website') +
        '&body=' + encodeURIComponent(body);

      showDone('Ihr E-Mail-Programm wurde mit der fertigen Anfrage geöffnet. Bitte dort noch auf „Senden" klicken.');
    });
  }

  /* ---------------- Jahreszahl und Start ---------------- */
  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

  window.addEventListener('scroll', onScrollThrottled, { passive: true });
  window.addEventListener('resize', checkInView);
  window.addEventListener('load', function () { checkInView(); onScroll(); });
  onScroll();
  checkInView();
  setTimeout(checkInView, 400);   // nach dem Laden der Schriften
})();
