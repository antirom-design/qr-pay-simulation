# QR-Pay Simulation: Feature Release Notes aktualisieren

Die Seite `/release-notes` (verlinkt im Kopf von Generator, Hilfe und Konzept) listet alle Features der App nach Tag, vom ersten Prototyp (26.10.2026) bis zum Stichtag. Inhalt und Stichtag stehen **nur** in `src/releaseNotes.js`; `releaseNotes()` in `src/views.js` rendert sie im Stil der Hilfe-Seite.

Bei der Bitte „Release Notes aktualisieren“ (und nach jeder Änderung, die Nutzer bemerken):
1. **Stichtag lesen:** `RELEASE_NOTES_STAND` in `src/releaseNotes.js` (Datum, Uhrzeit, Commit). Alles danach ist neu.
2. **Quellen:** `TZ=Europe/Berlin git log <commit>..HEAD --format='%h %ad %s' --date=format-local:'%d.%m. %H:%M'` sowie der Projekt-Thread mit den Abschlussmeldungen in Nutzersprache.
3. **Format:** Neuen Tag oben in `releaseNotes` einfügen (bestehender Tag: Einträge ergänzen), Datum wie `Do 29.10.2026`. Die Seite gruppiert die Einträge je Tag nach `uhr`, späteste Stunde zuerst. Pro Eintrag `titel` (kurz, Substantiv), `uhr` (Stunde 0–23 in deutscher Zeit, an der die Änderung auf `main` ging: bei PRs die Merge-Zeit, sonst die Commit-Zeit) und `text` (ein bis drei Sätze, Deutsch, wie ein Nutzer es erlebt, ohne Dateinamen oder Technik). Zusammengehörende Commits zu einem Eintrag bündeln; reine Pflege (Refactor, Infrastruktur, Docs, Release-Notes-Commits) weglassen.
4. **Stichtag setzen:** `RELEASE_NOTES_STAND` auf den neuesten berücksichtigten Commit (Datum, Uhrzeit in deutscher Zeit, Kurz-Hash). Der Release-Notes-Commit selbst zählt nicht.
5. **Prüfen:** `npm test` (prüft Seite, Stichtag und Links). Jeder Push auf `main` wird von Vercel deployt.
