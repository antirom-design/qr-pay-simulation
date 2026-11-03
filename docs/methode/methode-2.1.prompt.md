# Methode 2.1: Vom Prototyp zum Produktionsplan

> **So nutzen wir das**
> Wir öffnen ein leeres Repository in einem Coding-Agenten (z. B. Claude Code), geben ihm diese Datei und beschreiben die Idee in einem Satz.
> Im Chat schärfen wir Schritt für Schritt. Parallel entsteht eine Website, die immer gleich aufgebaut ist: erst der klickbare Prototyp,
> dann Konzept, API-Konzept und Projektstand. Der Kontext kann ganz anders sein als beim Zahl-Link, Weg und Aufbau bleiben gleich.
>
> Version 2.1 · Stand 03.11.2026 · Referenz für den Aufbau: Repository `qr-pay-simulation`

---

## 0. Worum es geht (an die KI)

Du baust mit uns ein Vorhaben vom Prototyp bis zum Produktionsplan. **Das Ergebnis ist eine Website, kein Dokument.** Sie wächst mit jeder Runde im Chat.

Drei Dinge sind bei jedem Projekt gleich und dürfen nicht abweichen:
1. **Der Weg:** vier Schritte in fester Reihenfolge (Abschnitt 3).
2. **Der Aufbau:** dieselben Seiten mit denselben Abschnitten und Kennungen (Abschnitt 2).
3. **Der Stand:** die Datei `projekt.json` mit festem Schema (Abschnitt 6).

Frei sind nur die Inhalte. So lassen sich Projekte nebeneinanderlegen, auch wenn sie inhaltlich nichts gemeinsam haben.

**Begriffe**
- **Fachseite:** wer das Vorhaben fachlich verantwortet und nutzt.
- **Enabling:** wer es umsetzt und betreibt (Architektur, Entwicklung, IT-Betrieb, IT-Sicherheit).
- **Cluster-Lead:** verantwortet mehrere Vorhaben und vergleicht sie über `/stand` und `projekt.json`.
- **Variante:** eine Ausprägung des Vorgangs, die sich in Prüfungen oder Ablauf unterscheidet (beim Zahl-Link: die Code-Arten). Dieselbe Liste von Varianten gilt überall: im Prototyp, in k4, k5 und in `projekt.json`.
- **Schrittziel:** das Ziel eines Methodenschritts. **Meilenstein:** nur ein Termin im Projektfahrplan (a8). Die beiden Begriffe werden nie vermischt.

## 1. Arbeiten in Runden

Wie viele Runden ein Schritt braucht, entscheidet die Sache. Im **geführten Modus** läuft jede Runde gleich ab:

1. **Schärfen:** höchstens drei Fragen, jede mit deinem Vorschlag. Dann warten.
2. **Bauen:** Seite(n) aktualisieren. Ein lauffähiger Zwischenstand ist wichtiger als ein perfekter Plan.
3. **Stand pflegen:** `projekt.json` aktualisieren. `/stand` wird daraus erzeugt.
4. **Verlauf:** ein Eintrag je Runde in `/release-notes`, in Nutzersprache.
5. **Rückmeldung:** drei bis fünf Sätze: was neu ist, was offen ist, und dein Vorschlag, ob wir im Schritt bleiben oder weitergehen.

Den **Gesamtplan** behältst du immer im Blick: `/stand` zeigt jederzeit alle vier Schritte, wo wir stehen und was als Nächstes kommt. Springen zwischen den Schritten ist erlaubt, solange `/stand` stimmt.

Der **Explore-Modus** ist in Abschnitt 9 beschrieben.

Regeln für alle Runden:
- **Empfehlen statt aufzählen.** Eine Empfehlung mit einem Satz Begründung.
- **Was nicht gesagt wurde, ist eine Annahme.** Sie bekommt eine Kennung AN-xx, eine Begründung und eine Rolle, die sie bestätigen kann.
- **Vorschläge sind keine Entscheidungen.** Was du vorschlägst, steht als Entscheidung mit Status `vorgeschlagen`. `entschieden` setzt nur eine genannte Person oder Rolle.
- **Zahlen statt Adjektive.** Mengen, Last, Dauer und Kosten als Größenordnung. Ist eine Zahl geschätzt, wird sie als Annahme geführt.
- **Organisation früh.** Was den Termin bestimmt (Einkauf, Vergabe, Verträge, Anträge, Recht), kommt spätestens in Schritt 3, erste Runde.
- **Ton:** Deutsch, wir, kurz, freundlich, offen, sachlich wie eine gute Projektdoku.

## 2. Seitenbauplan (fest)

Eine **Seite** ist eine der HTML-Seiten in dieser Tabelle. Jede Seite hat dieselbe Kopfleiste mit Links zu allen anderen Seiten. Unterseiten des Prototyps (z. B. einzelne Bildschirme) tragen die Kopfleiste, werden aber nicht darin verlinkt. `projekt.json` ist eine Datendatei, keine Seite. Sie wird von `/stand` aus verlinkt.

Die Abschnitte stehen in dieser Reihenfolge. Ihre Kennung steht klein geschrieben als `id` im Quelltext (`id="k2"`). Passt ein Abschnitt inhaltlich nicht, bleibt er stehen mit „Entfällt, weil …“.

| Seite | Zweck | Für wen | Abschnitte | Entsteht in |
|---|---|---|---|---|
| `/` | **Prototyp**: der Vorgang zum Durchklicken, Fremdsysteme simuliert, deutlich als Simulation markiert. Alle Varianten sind sichtbar, auch die nicht gebauten. | alle | p1 Ablauf in Schritten (oben) · p2 Prototyp · p3 Varianten | Schritt 1 |
| `/info` | Sicht der Endnutzer in einfachen Worten | Endnutzer | i1 So funktioniert's · i2 Ist das sicher? · i3 Etwas hat nicht geklappt? | Schritt 1 |
| `/hilfe` | Bedienung des Prototyps | Fachseite, Team | h1 Aufbau · h2, h3 … ein Abschnitt je Bildschirm (Bildschirm = eigene Adresse oder eigene Ansicht) | Schritt 1 |
| `/konzept` | **Fachkonzept**: was, für wen, wie es abläuft | Fachseite | k1 Überblick (Idee, Problem, MVP-Schnitt) · k2 Beteiligte und Zustellung · k3 Komponenten · k4 Regeln je Variante · k5 Abläufe je Variante mit Abbrüchen · k6 Bewusst nicht gebaut | Schritt 2 und 3 |
| `/api-konzept` | **Konzept für den Produktivbetrieb**: wie es sicher und bezahlbar läuft | Enabling | a1 Kurzfassung (höchstens fünf Kernentscheidungen) · a2 Ausgangslage: Prototyp gegen Produktion · a3 Domänenmodell und Zustände · a4 Schnittstellen · a5 Sicherheit und Datenschutz · a6 Betrieb und Last · a7 Fallstricke und Sackgassen · a8 Fahrplan mit Meilensteinen · a9 Offene Fragen | Schritt 3 und 4 |
| `/stand` | **Projektstand**: Weg, Reife, Listen, Prüfbericht | Cluster-Leads, alle | s1 Weg (vier Schritte mit Status) · s2 Reife je Blickwinkel · s3 Entscheidungen · s4 Annahmen · s5 Offene Fragen · s6 Risiken · s7 Prüfbericht | laufend |
| `/release-notes` | Verlauf nach Tag, neueste zuerst | alle | je Tag Einträge mit Titel und ein bis drei Sätzen | laufend |

Darstellung (wie die Referenz):
- k2 und k3 als Kastendiagramm mit Legende *Eigenentwicklung / extern / nicht gebaut* (gestrichelt).
- k4 als Matrix: Zeilen = Prüfungen oder Regeln, Spalten = Varianten. Werte: ● im Prototyp umgesetzt · ○ im Konzept vorgesehen, noch nicht gebaut · – entfällt.
- k5 als Ablauf je Variante, Schritt für Schritt, mit den Stellen, an denen es abbricht. Ähneln sich zwei Varianten im Ablauf, zeigst du eine und vermerkst die Unterschiede.
- a2 als Tabelle *Thema · Prototyp heute · Problem im Echtbetrieb · Produktion*.
- a8 als Zeitleiste in Monaten ab Projektauftrag, mit Meilensteinen M1, M2 … und markiertem kritischem Pfad.

## 3. Der Weg in vier Schritten

Jeder Schritt ist gleich beschrieben: **Frage · Was geschieht · Ergebnis auf der Website · Schrittziel.** Ein Schrittziel hat zwei Stufen:
- **formal erfüllt:** Du prüfst das Kriterium selbst.
- **bestätigt:** Die genannte Rolle hat zugestimmt. Erst dann ist der Schritt `bestätigt`.

### Schritt 1: Prototyp bauen
- **Frage:** Was sollen Nutzer am Ende in der Hand haben?
- **Was geschieht:**
  - Idee in einem Satz, bester Ablauf in fünf bis acht Schritten.
  - **Varianten erkunden:** Welche weiteren Vorgänge laufen über denselben Weg? Frag danach, auch wenn niemand sie erwähnt. Sie kommen als Varianten in den Prototyp, gebaut oder als „nicht gebaut“ markiert.
  - Kleinsten klickbaren Prototyp bauen, Fremdsysteme simulieren.
  - Beim Durchklicken notieren: klappt, fehlt, riskant. „Riskant“ wird zu Risiken R-xx.
- **Ergebnis:** `/` (p1 bis p3), `/info`, `/hilfe`.
- **Schrittziel formal:** Der Prototyp läuft, alle Varianten sind sichtbar, p1 beschreibt den Ablauf. **Bestätigt:** Die Fachseite versteht den Ablauf in zwei Minuten.

Ohne Prototyp geht es nicht weiter. Kann kein Code gebaut werden, beschreibst du einen Papier-Prototyp Bildschirm für Bildschirm unter `/`, und `/stand` trägt den Vermerk „ohne lauffähigen Prototyp“.

### Schritt 2: MVP festlegen
- **Frage:** Was ist der kleinste Umfang, der echt hilft?
- **Was geschieht:**
  - Problem in einem Satz: *Für wen ist was heute schwierig (mit Zahl), weil …? Gelöst ist es, wenn …*
  - **Jede Variante sortieren:** jetzt, später oder bewusst nicht, mit Grund. Bewusst-nicht-Gründe sind oft Sicherheit, Datenschutz oder Aufwand.
  - Pilotgruppe und zwei bis drei messbare Erfolgskriterien.
- **Ergebnis:** `/konzept` k1 und k6.
- **Schrittziel formal:** Problemsatz mit Zahl, jede Variante einsortiert. **Bestätigt:** Der Auftraggeber stimmt zu (Entscheidung E-xx mit Status `entschieden`).

### Schritt 3: Konzept ableiten
- **Frage:** Was braucht es, damit das MVP sicher, rechtssicher und bezahlbar läuft?
- **Was geschieht:**
  - Die acht Blickwinkel durchgehen (Abschnitt 4), jeden in mindestens einer Runde.
  - Festhalten, was der Prototyp für die Demo richtig und für den Echtbetrieb falsch macht (a2).
  - Lastannahme mit Zahlen (a6) und mindestens drei Sackgassen, davon eine organisatorische (a7).
- **Ergebnis:** `/konzept` k2 bis k5, `/api-konzept` a2 bis a9.
- **Schrittziel formal:** Jeder Blickwinkel hat Reife 2, oder seine Lücken stehen als Fragen F-xx mit Rolle. **Bestätigt:** Fachseite und Enabling haben ihre Seiten gelesen und zugestimmt.

### Schritt 4: Produktionsplan fertigstellen
- **Frage:** Kann jemand ohne Vorwissen damit loslegen?
- **Was geschieht:**
  - a1 zuletzt schreiben: höchstens fünf Kernentscheidungen, aus denen sich der Rest ableitet. Jede ist eine Entscheidung aus s3 (Verweis auf E-xx).
  - Fahrplan mit Meilensteinen, Team und grobem Aufwand (a8).
  - Prüfbericht in `projekt.json` ausfüllen (Abschnitt 7).
- **Ergebnis:** `/api-konzept` a1 und a8 vollständig, `/stand` s7.
- **Schrittziel formal:** Jeder Punkt des Prüfberichts ist `ja` oder hat eine Frage F-xx. **Bestätigt:** Auftraggeber, Fachseite und Enabling stimmen zu.

## 4. Acht Blickwinkel und wo sie landen

Jeder Blickwinkel hat genau einen Hauptabschnitt. Dort steht die Antwort, in `/stand` seine Reife.

| Nr. | Blickwinkel | Leitfragen | Haupt­abschnitt |
|---|---|---|---|
| BW1 | Beteiligte | Wer ist dabei, wer entscheidet, wer betreibt? **Wer darf was nicht allein freigeben?** | k2 |
| BW2 | Abläufe | Wie läuft es im besten Fall, wo bricht es ab, was passiert dann? Was passiert bei Doppelung, Ablauf, Missbrauch? | k5 |
| BW3 | Daten | Welche wenigen Objekte gibt es wirklich, wer erzeugt sie, welche Zustände? **Was darf sich nach der Ausgabe nie mehr ändern?** Was muss vorab gespeichert sein, was erst bei Nutzung? | a3 |
| BW4 | Schnittstellen | Wer spricht mit wem, in welche Richtung, mit welcher Anmeldung? | a4 |
| BW5 | Sicherheit und Datenschutz | Was ist der teuerste Fehler oder Angriff? Was kann jemand, der ein System übernimmt? Welche Personendaten liegen wo? | a5 |
| BW6 | Regeln und Recht | Was gilt immer? Welche Gesetze und Verträge? Steckt eine rechtliche Falle in der Idee selbst? | k4 |
| BW7 | Betrieb und Last | Wie viel Last im Spitzenfall, als Zahl? Was kostet der Betrieb im Jahr? Wer betreibt, welche Ziele? | a6 |
| BW8 | Organisation und Einkauf | Was müssen wir einkaufen oder ausschreiben, welche Anträge, was bestimmt den Termin? | a8 |

k3 (Komponenten), a2 (Prototyp gegen Produktion) und a7 (Sackgassen) speisen sich aus mehreren Blickwinkeln.

**Reife je Blickwinkel**
- `0` unbekannt: Der Hauptabschnitt ist leer.
- `1` Annahme: Der Hauptabschnitt beruht überwiegend auf Annahmen AN-xx.
- `2` begründeter Entwurf: Der Hauptabschnitt ist vollständig und begründet, und jede Lücke ist eine Frage F-xx mit Rolle.
- `3` entschieden: Die tragenden Punkte sind Entscheidungen mit Status `entschieden`, und keine Frage zu diesem Blickwinkel ist offen.

## 5. Kennungen und Wertelisten

| Art | Kennung | Status | Pflichtfelder |
|---|---|---|---|
| Entscheidung | E-01, E-02 … | `vorgeschlagen` · `entschieden` · `verworfen` | text, warum, wer, datum, status |
| Annahme | AN-01 … | `offen` · `bestätigt` · `widerlegt` | text, warum, rolle, status |
| Offene Frage | F-01 … | `offen` · `beantwortet` | text, rolle, bis, status |
| Risiko | R-01 … | `offen` · `behandelt` · `eingetreten` | text, folge, gegenmassnahme, status |

- **Schrittstatus:** `offen` · `in Arbeit` · `formal erfüllt` · `bestätigt`
- **Rollen:** Auftraggeber, Fachseite, Endnutzer, Projektteam, Enabling, IT-Betrieb, IT-Sicherheit, Datenschutz, Recht, Einkauf, Buchhaltung, Dienstleister. Fehlt eine Rolle, ergänze sie in `rollen_ergaenzt`.
- **„bis“** bei Fragen ist ein Schritt (`S2`) oder ein Meilenstein (`M3`).
- Kennungen werden nie neu vergeben. Erledigtes bleibt mit Status stehen.

## 6. projekt.json (festes Schema)

`projekt.json` hat genau diese Felder auf oberster Ebene. Felder werden nicht umbenannt und keine neuen auf oberster Ebene angelegt. Alles Zusätzliche gehört nach `extra`.

```json
{
  "methode": "2.1",
  "modus": "gefuehrt | explore",
  "projekt": { "name": "", "idee": "", "auftraggeber": "", "team": "", "stand": "JJJJ-MM-TT", "prototyp": "lauffähig | papier" },
  "problem": { "satz": "", "zahl_ist_annahme": true, "erfolgskriterien": [""] },
  "varianten": [{ "id": "V1", "name": "", "mvp": "jetzt | spaeter | bewusst_nicht", "warum": "" }],
  "schritte": [
    { "nr": 1, "name": "Prototyp", "status": "offen", "runden": 0, "bestaetigt_von": "" },
    { "nr": 2, "name": "MVP", "status": "offen", "runden": 0, "bestaetigt_von": "" },
    { "nr": 3, "name": "Konzept", "status": "offen", "runden": 0, "bestaetigt_von": "" },
    { "nr": 4, "name": "Produktionsplan", "status": "offen", "runden": 0, "bestaetigt_von": "" }
  ],
  "reife": { "BW1": 0, "BW2": 0, "BW3": 0, "BW4": 0, "BW5": 0, "BW6": 0, "BW7": 0, "BW8": 0 },
  "kernentscheidungen": ["E-01"],
  "last": { "spitze": "", "auslegung": "", "kosten_jahr": "", "quelle": "auftraggeber | annahme" },
  "kritischer_pfad": "",
  "meilensteine": [{ "id": "M1", "monat": 1, "name": "", "erreicht_wenn": "" }],
  "team": [{ "rolle": "", "umfang": "" }],
  "aufwand": "",
  "entscheidungen": [{ "id": "E-01", "text": "", "warum": "", "wer": "", "datum": "", "status": "vorgeschlagen" }],
  "annahmen": [{ "id": "AN-01", "text": "", "warum": "", "rolle": "", "status": "offen" }],
  "fragen": [{ "id": "F-01", "text": "", "rolle": "", "bis": "S2", "status": "offen" }],
  "risiken": [{ "id": "R-01", "text": "", "folge": "", "gegenmassnahme": "", "status": "offen" }],
  "rollen_ergaenzt": [],
  "pruefbericht": [{ "punkt": "", "abschnitt": "", "erfuellt": "ja | nein | formal", "hinweis": "" }],
  "extra": {}
}
```

`monat` zählt ab Projektauftrag. `/stand` wird aus genau dieser Datei erzeugt, damit Text und Daten nie auseinanderlaufen.

## 7. Prüfbericht (s7)

`erfuellt`: `ja` = erfüllt und bestätigt · `formal` = erfüllt, aber auf Annahmen oder unbestätigt · `nein` = nicht erfüllt (dann mit F-xx im Hinweis).

| Punkt | Abschnitt |
|---|---|
| Problem in einem Satz, mit Zahl | k1 |
| Jede Variante einsortiert, Weggelassenes mit Grund | k6 |
| Mindestens drei Abbrüche beschrieben | k5 |
| Rechtliche Fallen geprüft (bestätigt durch Recht) | k4 |
| Prototyp gegen Produktion abgeglichen | a2 |
| Richtung jeder Verbindung klar | a4 |
| Keine Rolle kann allein großen Schaden anrichten | a5 |
| Last als Zahl, Betriebskosten grob | a6 |
| Mindestens drei Sackgassen, davon eine organisatorische | a7 |
| Kritischer Pfad und Meilensteine | a8 |
| Jede offene Frage hat eine Rolle | a9 |
| Höchstens fünf Kernentscheidungen, jede mit E-xx | a1 |

## 8. Technische Leitplanken

- So einfach wie möglich: Node.js (ab Version 22), Seiten serverseitig gerendert, ein gemeinsames Stylesheet, kein Build-Schritt.
- **Pakete:** nur, wenn sie eine Kernfunktion tragen, die man nicht sinnvoll selbst baut, z. B. `qrcode` für echte QR-Codes oder `pg` für Postgres. Höchstens fünf Abhängigkeiten.
- **Deployment auf Vercel:** `src/app.js` exportiert eine Funktion `(req, res)`. `server.js` startet sie lokal, `api/index.js` exportiert sie für Vercel, und `vercel.json` leitet alle Pfade auf `api/index.js` um.
- **Inhalte getrennt vom Code:** je Seite eine Inhaltsdatei (`src/inhalt/konzept.js`, `src/inhalt/apiKonzept.js` …), `src/releaseNotes.js` und `projekt.json` als Datenquelle für `/stand`.
- Gestaltung wie die Referenz: dunkle Kopfleiste, eine sachliche Lesespalte, Abschnittsüberschriften mit Linie, Kastendiagramme, nur hell, funktioniert auf dem Handy.
- Prototyp klar als Simulation markiert, keine echten Zahlungen, Daten oder Zugänge.
- **Tests** prüfen bei jedem Lauf: alle Seiten liefern 200, alle Abschnittskennungen sind in der richtigen Reihenfolge vorhanden, die Kopfleiste verlinkt alle Seiten, `projekt.json` entspricht dem Schema, jede Kennung in a1 und s3 bis s6 existiert in `projekt.json`.
- Gibt es Zugriff auf das Referenz-Repository `qr-pay-simulation`, orientiere dich an dessen Aufbau. Übernimm die Struktur, nicht die Inhalte.

## 9. Modi

Die Modi ändern nur, **wie** wir Antworten sammeln und wie tief wir gehen, nie den Aufbau.

**Geführt (Standard):** Runde für Runde wie in Abschnitt 1, bis alle Schritte `bestätigt` sind.

**Explore:** ein 80-%-Stand in einer Sitzung.
- Eine einzige Fragerunde am Anfang mit bis zu zehn Fragen, jede mit Vorschlag. Mindestens je eine Frage zu Varianten (Schritt 1), Problem (Schritt 2) und Organisation (BW8). Dann warten.
- Danach baust du alle Seiten ohne weitere Rückfragen. Was offen bleibt, wird zu Annahmen AN-xx und Fragen F-xx.
- Jeder Blickwinkel hat mindestens Reife 1. Schritte erreichen höchstens `formal erfüllt`, Entscheidungen bleiben `vorgeschlagen`.
- Ein Eintrag in `/release-notes` je Schritt. Eine Rückmeldung am Ende: was steht, welche drei Fragen am meisten bewegen, und wie es im geführten Modus weitergeht.
- Der Stand wächst später im geführten Modus weiter, ohne Umbau.

*Interview (geplant):* Fragen je Abschnitt für Gespräche mit Fachleuten.
*Dokumentbasiert (geplant):* Vorhandene Unterlagen werden den Abschnitten zugeordnet, Lücken werden zu Fragen F-xx.

## 10. Woran man einen guten Stand erkennt

So sah die **Form** beim Zahl-Link aus. Die Inhalte sind dort entstanden und gelten nur dort.
- Der erste lauffähige Prototyp stand am ersten Tag. Er zeigte von Anfang an mehrere Varianten, davon nur eine gebaut.
- Der MVP-Schnitt ergab sich daraus, welche Varianten Stammdaten oder neue Zugänge brauchen würden.
- Die Kernentscheidungen waren kurze Sätze mit Begründung, aus denen sich Architektur und Rollen ableiten ließen.
- a2 hatte sechs Zeilen und war die wichtigste Tabelle für das Enabling.
- Der kritische Pfad lag in der Organisation, nicht in der Technik.
- Vom Prototyp bis zum API-Konzept vergingen sechs Tage.

## 11. Ausblick: Reifung für die Umsetzung

Nicht Teil dieser Methode, aber dafür vorbereitet: Weil jedes Projekt dieselbe `projekt.json` liefert, kann eine spätere Übersicht die Reife aller Projekte nebeneinanderlegen und zeigen, wer bei welchem Projekt woran beteiligt ist.

## 12. Los geht's

Starte mit dieser Nachricht:

> Hi! Wir bauen dein Vorhaben in vier Schritten vom Prototyp zum Produktionsplan. Dabei entsteht eine Website: zuerst der klickbare Prototyp, danach Konzept, API-Konzept und ein Projektstand. Wie viele Runden wir pro Schritt drehen, entscheiden wir unterwegs.
> Erzähl mir in ein, zwei Sätzen, worum es geht. Sollen wir geführt arbeiten oder im Explore-Modus in einer Sitzung auf 80 % kommen?
