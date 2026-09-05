# FK Bausanierung Kastrati — Website

Statische Website (HTML, CSS, JavaScript — kein Build, keine Abhängigkeiten).
Doppelklick auf `index.html` genügt zum Ansehen; zum Veröffentlichen einfach den
kompletten Ordner auf den Webspace laden.

## Aufbau der Seite

| Reihenfolge | Abschnitt              | Anker         |
|-------------|------------------------|---------------|
| 1 | Eröffnung — „Bausanierung in Kempten und Allgäu", Google-Bewertung, Porträt des Inhabers, Vertrauensleiste | `#start` |
| 2 | 01 Leistungen — 9 Kacheln, jede öffnet das Kontaktfenster mit vorausgewählter Leistung | `#leistungen` |
| 3 | 02 Warum wir — 4 kurze Karten **plus die Kennzahlen** | `#warum` |
| 4 | 03 Projekte — Karussell mit 10 Fotos | `#projekte` |
| 5 | Abschlussband und Fußzeile | — |

**Kontakt:** steht nicht mehr in der Seite, sondern öffnet sich als Fenster —
über „Kontakt" oben, „Kostenlos beraten lassen" im Startbereich, „Eigenes
Projekt anfragen" unter den Projekten und „Jetzt Termin anfragen" im blauen
Band. Es schließt über das ✕, einen Klick daneben oder die Esc-Taste; der
Cursor steht beim Öffnen im Feld „Name". Ohne JavaScript erscheint es über die
`:target`-Regel trotzdem. Telefon, Adresse und E-Mail stehen zusätzlich
dauerhaft in der Fußzeile.

Die Projekte erscheinen ausschließlich unten im Karussell: seitlich scrollbar,
mit Pfeiltasten links und rechts, Bildunterschrift je Foto und Großansicht per
Klick. Auf dem Handy entfallen die Pfeile — dort wird gewischt.

In der Eröffnung steht rechts das Porträt des Inhabers mit Zertifikat; oben
links und in der Fußzeile steht das Firmenlogo.

Die neun Leistungen: Bodenverlegung · Trockenbau · Fliesenverlegung ·
Malerarbeiten · Hausmeisterservice · Gebäudereinigung · Garten- &
Landschaftsbau · Winterdienst · Abriss & Entkernung.

Zusätzlich: Sprungmenü oben, Handy-Menü, Schnellkontakt (Anruf + WhatsApp) unten
rechts, Lightbox für die Galerie, Impressum und Datenschutz als Unterseiten.

**Farben:** Die Seite läuft in Dunkelblau; hell ist nur der Abschnitt
„Leistungen". Das Akzentblau `#244C8C` ist direkt aus dem Logo entnommen,
`#4A8ADB` ist die hellere Variante für Text, Icons und Linien auf dunklem
Grund. Alle Farben stehen als CSS-Variablen ganz oben in
`assets/css/styles.css` — eine Änderung dort wirkt auf die ganze Seite.

## Vor dem Livegang ausfüllen

Alle Platzhalter sind im Code mit `TODO` markiert (`grep -rn "TODO" .`):

1. **E-Mail-Adresse** — als einziger Kontaktpunkt noch ein Platzhalter
   (`info@fk-bausanierung.de`). Anschrift (Webergasse 39, 87435 Kempten) und
   Mobilnummer (0176 / 75 05 48 07) sind eingetragen — an vier Stellen:
   Kontaktbereich, Fußzeile, Schnellkontakt-Buttons und im
   `application/ld+json`-Block im `<head>` (der Block ist für Google und muss
   dieselben Daten enthalten). Die Festnetznummer vom Firmenwagen
   (0831 / 57 05 37 99) steht noch nirgends.
2. **Kennzahlen** in der Statistik — „11 Jahre Erfahrung" ist bestätigt, die
   drei übrigen Werte (120+ Projekte, 9 Leistungen, 100 % Festpreis) noch prüfen.
3. **Impressum** — Rechtsform, USt-IdNr., zuständige Handwerkskammer.
   In Deutschland gesetzlich vorgeschrieben.
4. **Datenschutzerklärung** — Hosting-Anbieter eintragen und den Text prüfen lassen.
5. **Fotos** — siehe `images/README.md`. Ohne Fotos zeigt die Seite gestaltete
   Farbverläufe als Platzhalter, sie sieht also nie „kaputt" aus.

## Kontaktformular scharf schalten

Ohne Konfiguration öffnet das Formular das E-Mail-Programm des Besuchers mit
vorausgefüllter Nachricht. Für echten Versand in
`assets/js/main.js` ganz oben eintragen:

```js
var CONFIG = {
  formEndpoint: 'https://formspree.io/f/XXXXXXX',  // oder eigenes PHP-Skript
  mailTo: 'info@fk-bausanierung.de'
};
```

Anbieter ohne eigenen Server: [Formspree](https://formspree.io),
[Netlify Forms](https://docs.netlify.com/forms/setup/) oder das Formular-Skript
des eigenen Hosters.

## Datenschutz-Hinweis zu den Schriften

Die Schriften werden aktuell von Google Fonts geladen. DSGVO-sicherer ist es,
sie lokal einzubinden: Schriften herunterladen, unter `assets/fonts/` ablegen und
den `<link>` auf `fonts.googleapis.com` in allen drei HTML-Dateien durch eigene
`@font-face`-Regeln ersetzen. Dann kann auch der entsprechende Absatz in der
Datenschutzerklärung entfallen.

## Struktur

```
fk-bausanierung/
├─ index.html          Startseite (alle Abschnitte)
├─ impressum.html
├─ datenschutz.html
├─ assets/
│  ├─ css/styles.css   gesamtes Design
│  ├─ js/main.js       Menü, Kontaktfenster, Karussell, Zähler, Lightbox, Formular
│  └─ favicon.svg
└─ images/             Fotos (siehe images/README.md)
```
