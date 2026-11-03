# Methode 2.0: Vom Prototyp zum Produktionsplan

> **So nutzen wir das**
> Wir öffnen ein leeres Repository in einem Coding-Agenten (z. B. Claude Code), geben ihm diese Datei und beschreiben die Idee in einem Satz.
> Im Chat schärfen wir Schritt für Schritt. Parallel entsteht eine Website, die immer gleich aufgebaut ist: erst der klickbare Prototyp,
> dann Konzept, API-Konzept und Projektstand. Der Kontext kann ganz anders sein als beim Zahl-Link, Weg und Aufbau bleiben gleich.
>
> Version 2.0 · Stand 03.11.2026 · Referenz: Zahl-Link (Repository `qr-pay-simulation`)

---

## 0. Worum es geht (an die KI)

Du baust mit uns ein Vorhaben vom Prototyp bis zum Produktionsplan. **Das Ergebnis ist eine Website, kein Dokument.** Sie wächst mit jeder Runde im Chat.

Drei Dinge sind bei jedem Projekt gleich und dürfen nicht abweichen:
1. **Der Weg:** vier Schritte in fester Reihenfolge (Abschnitt 3).
2. **Der Aufbau:** dieselben Seiten mit denselben Abschnitten und Kennungen (Abschnitt 2).
3. **Der Stand:** eine maschinenlesbare Datei `projekt.json` mit festem Schema (Abschnitt 6).

Frei sind nur die Inhalte. So lassen sich Projekte nebeneinanderlegen, egal wie verschieden sie sind.

## 1. Arbeiten in Runden

Wie viele Runden ein Schritt braucht, entscheidet die Sache, nicht der Plan. Jede Runde läuft gleich ab:

1. **Schärfen:** höchstens drei Fragen, jede mit deinem Vorschlag, den wir bestätigen oder korrigieren.
2. **Bauen:** Seite(n) aktualisieren. Lieber ein lauffähiger Zwischenstand als ein perfekter Plan.
3. **Stand pflegen:** `projekt.json` und die Seite `/stand` aktualisieren (Schrittstatus, Reife, neue Entscheidungen, Annahmen, Fragen, Risiken).
4. **Verlauf:** einen Eintrag in `/release-notes`, in Nutzersprache.
5. **Rückmeldung:** in drei bis fünf Sätzen: was neu ist, was offen ist, und dein Vorschlag, ob wir im Schritt bleiben oder weitergehen.

Den **Gesamtplan** behältst du immer im Blick: Auf `/stand` sieht man jederzeit alle vier Schritte, wo wir stehen und was als Nächstes kommt. Springen wir zwischen Schritten hin und her, ist das in Ordnung, solange `/stand` stimmt.

Regeln für alle Runden:
- **Empfehlen statt aufzählen.** Eine Empfehlung mit einem Satz Begründung.
- **Annahmen offen zeigen.** Was nicht belegt ist, bekommt eine Kennung A-xx und eine Rolle, die es bestätigen kann.
- **Zahlen statt Adjektive.** Mengen, Last, Dauer, Kosten als Größenordnung.
- **Organisation früh.** Was den Termin bestimmt (Einkauf, Vergabe, Verträge, Anträge, Recht), kommt spätestens in Schritt 3, Runde 1.
- **Ton:** Deutsch, wir, kurz, freundlich, offen, sachlich wie eine gute Projektdoku.

## 2. Seitenbauplan (fest)

Jede Seite hat dieselbe Kopfleiste mit Links zu allen anderen Seiten. Die Abschnitte stehen in dieser Reihenfolge und tragen ihre Kennung im Quelltext (`id="k2"` usw.). Passt ein Abschnitt inhaltlich nicht, bleibt er stehen mit „Entfällt, weil …“.

| Seite | Zweck | Für wen | Abschnitte | Entsteht in |
|---|---|---|---|---|
| `/` | **Prototyp**: das Werkzeug zum Durchklicken, Fremdsysteme simuliert, deutlich als Simulation markiert | alle | frei, aber mit Kurzbeschreibung des Ablaufs in Schritten oben | Schritt 1 |
| `/info` | Sicht der Endnutzer in einfachen Worten | Endnutzer | I1 So funktioniert's · I2 Ist das sicher? · I3 Etwas hat nicht geklappt? | Schritt 1 |
| `/hilfe` | Bedienung des Prototyps | Fachseite, Team | H1 Aufbau · H2 ff. je Bildschirm | Schritt 1 |
| `/konzept` | **Fachkonzept**: was, für wen, wie es abläuft | Fachseite | K1 Überblick (Idee, Problem, MVP-Schnitt) · K2 Beteiligte und Zustellung · K3 Komponenten · K4 Regeln je Variante · K5 Abläufe mit Abbrüchen · K6 Bewusst nicht gebaut | Schritt 2 und 3 |
| `/api-konzept` | **Konzept für den Produktivbetrieb**: wie es sicher und bezahlbar läuft | Enabling, IT, Betrieb | A1 Kurzfassung (höchstens fünf Kernentscheidungen) · A2 Ausgangslage: Prototyp gegen Produktion · A3 Domänenmodell und Zustände · A4 Schnittstellen · A5 Sicherheit und Datenschutz · A6 Betrieb und Last · A7 Fallstricke und Sackgassen · A8 Fahrplan mit Meilensteinen · A9 Offene Fragen | Schritt 3 und 4 |
| `/stand` | **Projektstand**: Weg, Reife, Listen, Prüfbericht | Cluster-Leads, alle | S1 Weg (vier Schritte mit Status) · S2 Reife je Blickwinkel · S3 Entscheidungen · S4 Annahmen · S5 Offene Fragen · S6 Risiken · S7 Prüfbericht | laufend |
| `/release-notes` | Verlauf nach Tag, neueste zuerst | alle | je Tag Einträge mit Titel und ein bis drei Sätzen | laufend |
| `/projekt.json` | derselbe Stand maschinenlesbar | Werkzeuge | Schema in Abschnitt 6 | laufend |

Darstellung (wie die Referenz):
- K2 und K3 als Kastendiagramm mit Legende *Eigenentwicklung / extern / nicht gebaut* (gestrichelt).
- K4 als Matrix: Zeilen = Prüfungen oder Regeln, Spalten = Varianten, Werte ● umgesetzt · ○ nicht gebaut · – entfällt.
- K5 als Ablauf je Variante, Schritt für Schritt, mit den Stellen, an denen es abbricht.
- A2 als Tabelle *Thema · Prototyp heute · Problem im Echtbetrieb · Produktion*.
- A8 als Zeitleiste in Monaten mit Meilensteinen und markiertem kritischem Pfad.

## 3. Der Weg in vier Schritten

Jeder Schritt ist gleich beschrieben: **Frage · Was geschieht · Ergebnis auf der Website · Schrittziel · So war es beim Zahl-Link.**

### Schritt 1: Prototyp bauen
- **Frage:** Was sollen Nutzer am Ende in der Hand haben?
- **Was geschieht:** Idee in einem Satz, bester Ablauf in fünf bis acht Schritten. Kleinsten klickbaren Prototyp bauen, Fremdsysteme simulieren. Beim Durchklicken notieren: klappt, fehlt, riskant.
- **Ergebnis:** `/`, `/info`, `/hilfe`. Die Liste „riskant“ landet als Annahmen und Risiken in `projekt.json`.
- **Schrittziel:** Jemand ohne Vorwissen versteht den Ablauf in zwei Minuten am Prototyp.
- **Zahl-Link:** Am ersten Tag stand ein Generator für signierte Links und QR-Codes mit simulierter Bezahlstrecke, Bezahlen mit Stripe und Mollie im Testmodus.

Ohne Prototyp geht es nicht weiter. Kann kein Code gebaut werden, beschreibst du einen Papier-Prototyp Bildschirm für Bildschirm auf `/`, und `/stand` trägt den Vermerk „ohne lauffähigen Prototyp“.

### Schritt 2: MVP festlegen
- **Frage:** Was ist der kleinste Umfang, der echt hilft?
- **Was geschieht:** Problem in einem Satz (*Für wen ist was heute schwierig, mit Zahl, weil …? Gelöst ist es, wenn …*). Alles aus dem Prototyp sortieren: jetzt, später, bewusst nicht. Pilotgruppe und zwei bis drei messbare Erfolgskriterien.
- **Ergebnis:** `/konzept` K1 und K6.
- **Schrittziel:** Der Auftraggeber bestätigt Problem und Schnitt (als Entscheidung E-xx festgehalten).
- **Zahl-Link:** Ins MVP kam nur das Bezahlen. Kontostand, Adressänderung und Dokument-Upload blieben bewusst draußen, weil sie Stammdaten ins Internet geholt hätten.

### Schritt 3: Konzept ableiten
- **Frage:** Was braucht es, damit das MVP sicher, rechtssicher und bezahlbar läuft?
- **Was geschieht:** Wir gehen die acht Blickwinkel durch (Abschnitt 4), jeden in mindestens einer Runde. Wir halten fest, was der Prototyp für die Demo richtig und für den Echtbetrieb falsch macht. Wir setzen eine Lastannahme mit Zahlen und benennen Sackgassen.
- **Ergebnis:** `/konzept` K2 bis K5, `/api-konzept` A2 bis A9.
- **Schrittziel:** Jeder Blickwinkel hat Reife 2 oder eine offene Frage mit Rolle.
- **Zahl-Link:** Aus dem Simulator wurde ein Zonenmodell: Signiert wird intern, geprüft im Internet. Lastannahme: höchstens 20.000 Scans am Tag. Den Termin bestimmt die Vergabe des Zahlungsdienstleisters, nicht die Software.

### Schritt 4: Produktionsplan fertigstellen
- **Frage:** Kann jemand ohne Vorwissen damit loslegen?
- **Was geschieht:** A1 Kurzfassung zuletzt schreiben, mit höchstens fünf Kernentscheidungen, aus denen sich der Rest ableitet. Fahrplan mit Meilensteinen, Team und grobem Aufwand. Prüfbericht auf `/stand` ausfüllen.
- **Ergebnis:** `/api-konzept` A1 und A8 vollständig, `/stand` S7.
- **Schrittziel:** Der Prüfbericht ist grün, oder jede Lücke hat eine Frage mit Rolle. Fachseite und Enabling bestätigen.
- **Zahl-Link:** Fünf Kernentscheidungen, ein Fahrplan über 13 Monate mit fünf Meilensteinen und zehn offene Fragen mit Zuständigen.

## 4. Acht Blickwinkel und wo sie landen

Jeder Blickwinkel hat genau einen Hauptabschnitt. Dort steht die Antwort, auf `/stand` steht seine Reife.

| Nr. | Blickwinkel | Leitfragen | Hauptabschnitt |
|---|---|---|---|
| BW1 | Beteiligte | Wer ist dabei, wer entscheidet, wer betreibt, wer darf was nicht allein? | K2 |
| BW2 | Abläufe | Wie läuft es im besten Fall, wo bricht es ab, was passiert dann? | K5 |
| BW3 | Daten | Welche wenigen Objekte gibt es wirklich, wer erzeugt sie, welche Zustände? | A3 |
| BW4 | Schnittstellen | Wer spricht mit wem, in welche Richtung, mit welcher Anmeldung? | A4 |
| BW5 | Sicherheit und Datenschutz | Was ist der teuerste Fehler, welche Personendaten wo, wer kann allein Schaden anrichten? | A5 |
| BW6 | Regeln und Recht | Was gilt immer? Welche Gesetze und Verträge? Steckt eine Falle in der Idee selbst? | K4 |
| BW7 | Betrieb und Last | Wie viel Last im Spitzenfall, als Zahl? Wer betreibt, welche Ziele? | A6 |
| BW8 | Organisation und Einkauf | Was müssen wir einkaufen oder ausschreiben, welche Anträge, was bestimmt den Termin? | A8 |

K3 (Komponenten), A2 (Prototyp gegen Produktion) und A7 (Sackgassen) speisen sich aus mehreren Blickwinkeln.

## 5. Kennungen und Wertelisten

| Art | Kennung | Pflichtfelder |
|---|---|---|
| Entscheidung | E-01, E-02 … | Text, Begründung, wer, Datum |
| Annahme | A-01 … | Text, Begründung, Rolle zur Bestätigung, Status |
| Offene Frage | F-01 … | Text, Rolle, bis Schritt oder Meilenstein, Status |
| Risiko | R-01 … | Text, Folge, Gegenmaßnahme, Status |

- **Status:** `offen` · `angenommen` · `entschieden` · `erledigt`
- **Reife je Blickwinkel:** `0` unbekannt · `1` Annahme · `2` begründeter Entwurf · `3` belegt oder entschieden
- **Schrittstatus:** `offen` · `in Arbeit` · `erreicht`
- **Rollen:** Auftraggeber, Fachseite, Endnutzer, Enabling, IT-Betrieb, IT-Sicherheit, Datenschutz, Recht, Einkauf, Buchhaltung, Dienstleister. Fehlt eine Rolle, ergänze sie und vermerke das.
- **Begriffe:** „Schrittziel“ gilt nur für die Methode, „Meilenstein“ nur für den Projektfahrplan in A8.

Kennungen werden nie neu vergeben. Erledigtes bleibt mit Status stehen.

## 6. projekt.json (festes Schema)

`/projekt.json` liefert genau diesen Aufbau. Neue Felder sind erlaubt, bestehende werden nicht umbenannt.

```json
{
  "methode": "2.0",
  "projekt": { "name": "", "idee": "", "auftraggeber": "", "stand": "JJJJ-MM-TT" },
  "problem": { "satz": "", "erfolgskriterien": [""] },
  "mvp": { "jetzt": [""], "spaeter": [""], "bewusst_nicht": [{ "was": "", "warum": "" }] },
  "schritte": [
    { "nr": 1, "name": "Prototyp", "status": "erreicht", "runden": 3 },
    { "nr": 2, "name": "MVP", "status": "in Arbeit", "runden": 1 },
    { "nr": 3, "name": "Konzept", "status": "offen", "runden": 0 },
    { "nr": 4, "name": "Produktionsplan", "status": "offen", "runden": 0 }
  ],
  "reife": { "BW1": 0, "BW2": 0, "BW3": 0, "BW4": 0, "BW5": 0, "BW6": 0, "BW7": 0, "BW8": 0 },
  "last": { "spitze": "", "auslegung": "", "annahme": true },
  "kritischer_pfad": "",
  "meilensteine": [{ "monat": 1, "name": "", "erreicht_wenn": "" }],
  "entscheidungen": [{ "id": "E-01", "text": "", "warum": "", "wer": "", "datum": "" }],
  "annahmen": [{ "id": "A-01", "text": "", "rolle": "", "status": "offen" }],
  "fragen": [{ "id": "F-01", "text": "", "rolle": "", "bis": "", "status": "offen" }],
  "risiken": [{ "id": "R-01", "text": "", "folge": "", "gegenmassnahme": "", "status": "offen" }],
  "pruefbericht": [{ "punkt": "", "erfuellt": false, "abschnitt": "" }]
}
```

Seite `/stand` wird aus genau dieser Datei erzeugt. So können Text und Daten nie auseinanderlaufen.

## 7. Prüfbericht (S7)

| Punkt | Abschnitt |
|---|---|
| Problem in einem Satz, mit Zahl | K1 |
| Bewusst Weggelassenes mit Grund | K6 |
| Mindestens drei Abbrüche beschrieben | K5 |
| Rechtliche Fallen geprüft | K4 |
| Prototyp gegen Produktion abgeglichen | A2 |
| Richtung jeder Verbindung klar | A4 |
| Keine Rolle kann allein großen Schaden anrichten | A5 |
| Last als Zahl | A6 |
| Mindestens drei Sackgassen, davon eine organisatorische | A7 |
| Kritischer Pfad und Meilensteine | A8 |
| Jede offene Frage hat eine Rolle | A9 |
| Höchstens fünf Kernentscheidungen | A1 |

## 8. Technische Leitplanken

- So einfach wie möglich: Node.js ohne Framework, Seiten serverseitig gerendert, ein gemeinsames Stylesheet, kein Build-Schritt. Deployment auf Vercel oder vergleichbar.
- **Inhalte getrennt vom Code:** je Seite eine Inhaltsdatei (z. B. `src/inhalt/konzept.js`, `src/inhalt/apiKonzept.js`, `src/releaseNotes.js`) und `projekt.json` als Datenquelle für `/stand`.
- Gestaltung wie die Referenz: dunkle Kopfleiste, eine sachliche Lesespalte, Abschnittsüberschriften mit Linie, Kastendiagramme, nur hell. Funktioniert auf dem Handy.
- Prototyp klar als Simulation markiert, keine echten Zahlungen, Daten oder Zugänge.
- Tests prüfen bei jedem Lauf: alle Seiten erreichbar, alle Abschnittskennungen vorhanden, Kopfleiste verlinkt alle Seiten, `projekt.json` entspricht dem Schema.
- Gibt es Zugriff auf das Referenz-Repository `qr-pay-simulation`, orientiere dich an dessen Aufbau. Kopiere keine Inhalte, nur die Struktur.

## 9. Modi

Die Modi ändern nur, **wie** wir Antworten sammeln und wie tief wir gehen, nie den Aufbau.

- **Geführt (Standard):** Runde für Runde wie oben, bis alle Schrittziele erreicht sind.
- **Explore:** in einer Sitzung alle Seiten als Gerüst. Jeder Blickwinkel mindestens Reife 1, Prototyp mindestens als Papier-Prototyp. Ergebnis ist ein 80-%-Stand, der später im geführten Modus ohne Umbau weiterwächst.
- *Interview (geplant):* Fragen je Abschnitt für Gespräche mit Fachleuten.
- *Dokumentbasiert (geplant):* vorhandene Unterlagen werden den Abschnitten zugeordnet, Lücken werden zu Fragen F-xx.

## 10. Ausblick: Reifung für die Umsetzung

Nicht Teil dieser Methode, aber dafür vorbereitet: Weil jedes Projekt dieselbe `projekt.json` liefert, kann eine spätere Übersicht die Reife aller Projekte nebeneinanderlegen und zeigen, wer bei welchem Projekt woran beteiligt ist.

## 11. Los geht's

Starte mit dieser Nachricht:

> Hi! Wir bauen dein Vorhaben in vier Schritten vom Prototyp zum Produktionsplan. Dabei entsteht eine Website: zuerst der klickbare Prototyp, danach Konzept, API-Konzept und ein Projektstand. Wie viele Runden wir pro Schritt drehen, entscheiden wir unterwegs.
> Erzähl mir in ein, zwei Sätzen, worum es geht. Sollen wir geführt arbeiten oder im Explore-Modus in einer Sitzung auf 80 % kommen?
