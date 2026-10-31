# QR-Pay Simulation

Die komplette Strecke „Bezahlen per QR-Code“ zum Durchklicken. Es wird kein echtes Geld bewegt.

- **Service 1: QR-Code-Manager.** Codes mit Variablen anlegen, bearbeiten, deaktivieren, löschen. Gespeichert in einer Datenbank.
  Die Code-ID beginnt mit der **Code-Art** (`PAY-7K3QX9`, `INFO-…`). Die Art legt fest, welche Variablen ein Code hat.
- **Service 2: Bezahlen.** Ein `PAY`-Code trägt **12-stellige Kundennummer, Betrag und Gebühr** signiert in sich.
  Scan mit dem Handy oder „Simulation starten“ (Handy als Modal) → Decoding mit Fortschritt → Betrag, Gebühr, Endbetrag →
  „Sofort bezahlen mit“ PayPal, Wero, Banking-App, Kreditkarte, Apple Pay, Google Pay, Klarna, SEPA → simulierter Checkout beim Anbieter →
  Webhook und Verbuchung → Rücksprung → Bestätigung mit Beleg.
- **Weitere Code-Arten:** `KONTO` (Kontostand nach Anmeldung mit Geburtsdatum, offenen Betrag direkt bezahlen, Sperre nach 3 Fehlversuchen),
  `ADR` (Adressänderung nach Anmeldung mit Geburtsdatum), `DOK` (Dokument wie eine Befreiungsbescheinigung einreichen nach Online-Ausweis,
  Video-Ident oder Bank-Ident, verschlüsselt gespeichert, im Manager abrufbar), `INFO` (verwalteter Link, z. B. auf `/info`).
  Geheime Variablen (Name, Geburtsdatum, Adresse, Kontostand) stehen nur in der Datenbank, nie im QR-Code.
- **Statuslog pro Code:** Jeder Schritt erscheint live neben dem Handy und gehört zu genau einer Komponente:
  Code-Manager, Handy-Frontend, Link-Management, Vorgangslogik, Zahlungslogik (Eigenentwicklung), Zahlungsdienst und Ident-Dienst
  (extern angebunden, hier simuliert) sowie Übergabe ans Fachsystem (Platzhalter, noch zu bauen). Der Verlauf lässt sich nach
  Komponente oder Art filtern und als Text kopieren. So sieht man pro Vorgang, wo programmiert werden muss.

## Was alles simuliert wird

| Fall | Wie auslösen | Ergebnis |
|---|---|---|
| Erfolg | Normal durchklicken | Beleg, Code wird „bezahlt“ (Einmal-Code) |
| Abbruch | „Abbrechen“ beim Anbieter | Code bleibt offen, „Erneut versuchen“ |
| Ablehnung | Testfall „Ablehnen“ oder Karte `4000 0000 0000 0002` | Fehlerseite, erneut zahlbar |
| Timeout | Testfall „Keine Antwort“ | Nach 10 s abgebrochen; liegengebliebene Zahlungen laufen nach 15 Min. ab |
| Manipulierter Code | Betrag im QR-Inhalt ändern | Signaturprüfung schlägt fehl |
| Veralteter Code | Betrag im Manager ändern, alten QR scannen | „Code veraltet“ |
| Deaktiviert / abgelaufen | Im Manager | Scan wird abgelehnt |
| Schon bezahlt | Code nach Zahlung erneut scannen | Zeigt nur den Beleg |
| Doppelzahlung | Zwei Checkouts parallel, beide bestätigen | Zweite wird erkannt und als Erstattung markiert |

## Was im QR-Code steht

`https://<host>/s/<base64url(JSON)>.<HMAC-SHA256>` mit JSON `{ v, id, t (Art), n (Version), d: { kundennummer, betrag, gebuehr, zweck } }`.
Die Daten sind lesbar, aber durch die Signatur nicht fälschbar. Beträge stehen in Cent. Bezahlt wird immer der Betrag aus der Datenbank.

## Release Notes

Unter `/release-notes` stehen alle Features nach Tag und Stunde, neueste zuerst. Wie sie gepflegt werden, steht in `AGENTS.md`.

## Lokal starten

Node 22.13 oder neuer.

```bash
npm install
npm start          # http://localhost:3000
npm test           # End-to-end-Test der ganzen Strecke
```

Lokal speichert die App in SQLite (`data/qr.sqlite`). Die QR-Codes zeigen automatisch auf die WLAN-Adresse des Rechners,
damit ein Handy im selben WLAN sie scannen kann.

## Vercel

Jeder Push auf `main` wird deployt. Auf Vercel braucht die App Postgres (z. B. Neon über den Storage-Tab des Projekts),
die Tabellen legt sie beim ersten Aufruf selbst an.

| Variable | Zweck |
|---|---|
| `DATABASE_URL` | Postgres-Verbindung (setzt Neon automatisch). Ohne: SQLite |
| `CODE_SECRET` | Schlüssel für die Signatur der QR-Codes. **Unbedingt setzen** |
| `ADMIN_PASSWORD` | Optional: schützt den Manager per Passwort (Bezahlseiten bleiben offen) |
| `PUBLIC_URL` | Optional: feste Adresse für die QR-Codes |

## Aufbau

```
src/db.js         Datenbank (Postgres oder SQLite), Tabellen code_types, codes, payments, events
src/codes.js      Service 1: Code-Arten, Codes, Signatur, Statuslog
src/payments.js   Service 2: Decoding-Schritte, Zahlung starten, Anbieter-Ergebnis verbuchen
src/flows.js      Anmeldung (Geburtsdatum, Ident), Kontostand, Adressänderung, Dokument-Upload (AES-256-GCM)
src/app.js        HTTP-Routen und API
src/views.js      HTML-Seiten
src/releaseNotes.js  Inhalt der Seite /release-notes (Pflege siehe AGENTS.md)
public/           manager.js, pay.js + flows.js (Handy), provider.js (Anbieter-Checkouts), style.css
api/index.js      Einstieg für Vercel
```
