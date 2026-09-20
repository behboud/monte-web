# Datenschutz: technischer Plan

## Zweck

Dieses Dokument beschreibt den technischen Stand der Website. Es ist keine rechtliche Prüfung.

Es enthält keine Einzelfälle zu Personen, keine privaten Kontaktdaten und keine internen Zustimmungsnachweise. Solche Unterlagen gehören nicht in dieses öffentliche Repository.

## Erledigt

- PWA, Manifest, Service Worker und Workbox wurden entfernt.
- mmenu und Font Awesome werden lokal geladen.
- Die benötigten Schriftdateien liegen lokal im Projekt.
- Unnötige externe Preconnects und DNS-Prefetches wurden entfernt.
- Die geprüften öffentlichen Seiten laden keine externen Ressourcen.
- Die öffentlichen Seiten setzen keine Cookies.
- Das Spenden-Popup nutzt nur kurzlebigen `sessionStorage`.
- Das CMS enthält Hinweise zur Prüfung von Bild- und Veröffentlichungsrechten.
- Die bestehenden Inhalte wurden nicht geändert oder gelöscht.

## Offen

- Hosting-Anbieter festlegen und die Datenschutzerklärung daran anpassen.
- Datenschutzerklärung an die tatsächlich genutzten Funktionen anpassen.
- Namen, Kontaktdaten, Fotos sowie Angaben zu Unterstützern intern prüfen.
- Zustimmungen und andere Rechtsgrundlagen in einem geschützten internen Verfahren dokumentieren.
- Bei jeder Änderung prüfen, ob Analytics, Karten, Videos, Newsletter, Formulare, Bewerbungen oder andere externe Dienste dazukommen.
- Rechtliche Einstufung von `sessionStorage` und des CMS-Bereichs klären.
- Die technische Übersicht an die Datenschutzberatung geben.

## Regeln für weitere Änderungen

- Keine neuen externen Dienste ohne vorherige Prüfung.
- Keine internen Zustimmungsnachweise oder privaten Kontaktdaten in dieses Repository schreiben.
- CMS-Prüffelder dienen nur als Hinweis. Sie entfernen oder verstecken keine Inhalte.
- Die öffentlichen Seiten nach jeder relevanten Änderung erneut prüfen.

## Tests

`npm run test:ui` ist erfolgreich: 58 Tests liefen durch, 4 wurden übersprungen.
