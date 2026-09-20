# Datenschutz: technischer Stand

## Erledigt

- PWA, Manifest, Service Worker und Workbox wurden entfernt.
- mmenu und Font Awesome werden lokal geladen.
- Font Awesome 6.7.1 liegt mit Lizenzhinweis im Projekt.
- Unnötige externe Preconnects und DNS-Prefetches wurden entfernt.
- Die öffentlichen Seiten erzeugen im Browser keine externen Anfragen.
- Es werden keine Cookies gesetzt. Die Spenden-Popup nutzt nur `sessionStorage`.
- Das CMS zeigt Hinweise zur Prüfung von Bildrechten und Veröffentlichungen.
- Spenden-, Förderer- und Projekt-Einträge haben optionale Prüfhinweise. Diese Hinweise ändern oder verstecken keinen Inhalt.
- Es wurden keine Inhalte gelöscht oder geändert.

Tests: `npm run test:ui` ist erfolgreich. 58 Tests liefen durch, 4 Tests wurden übersprungen.

## Noch offen

- [ ] Hosting-Anbieter festlegen. Danach Deployment-Dokumentation und Datenschutzerklärung anpassen.
- [ ] Datenschutzerklärung an die tatsächlich verwendeten Funktionen anpassen.
- [ ] Bei jeder Iteration prüfen, ob Analytics, Karten, Videos, Newsletter, Formulare, Bewerbungen, Teams oder Bildungsspender dazukommen.
- [ ] Namen, Beträge, Beschreibungen, Logos und Links auf der Spenden- und Förderer-Seite prüfen. Die Inhalte bleiben bis dahin unverändert.
- [ ] Fotos sowie genannte Kontaktpersonen und Mailboxen prüfen. Auch die Angaben im Impressum prüfen.
- [ ] Rechtliche Einstufung von `sessionStorage` und des CMS-Bereichs klären.
- [ ] Technische Übersicht und offene Inhaltsfragen an die Datenschutzberatung geben.

Die ausführliche Zuordnung steht in [privacy-relaunch-plan.md](privacy-relaunch-plan.md).
