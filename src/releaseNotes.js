// Inhalt der Seite „Feature Release Notes“ (/release-notes): alle Features seit dem ersten Prototyp am 26.10.2026, nach Tag.
// Neue Einträge oben anfügen und RELEASE_NOTES_STAND setzen, Ablauf siehe AGENTS.md.

// Stichtag der letzten Aktualisierung: alles bis einschließlich dieses Commits steht in der Seite
const RELEASE_NOTES_STAND = { datum: '29.10.2026', uhrzeit: '22:19', commit: '06b2618' };

// Neueste Tage zuerst. Pro Eintrag: titel (kurz), uhr (Stunde 0–23 in deutscher Zeit, an der die Änderung live ging),
// text (ein bis drei Sätze, wie ein Nutzer es erlebt)
const releaseNotes = [
  {
    datum: 'Sa 31.10.2026',
    items: [
      {
        titel: 'API-Konzept für ein internes Team, mit Fahrplan',
        uhr: 18,
        text: 'Das API-Konzept geht jetzt davon aus, dass ein eigenes Team im Haus die Lösung baut und betreibt: signiert wird in der internen Zone, geprüft in der DMZ, jede Versandwelle wird im Vier-Augen-Prinzip scharfgeschaltet. Neu ist ein Fahrplan über 13 Monate, der mit der Ausschreibung des Zahlungsdienstleisters beginnt.',
      },
      {
        titel: 'API-Konzept für den Produktivbetrieb',
        uhr: 17,
        text: 'Neue Seite „API-Konzept“, oben in der Kopfzeile verlinkt: wie aus der Simulation eine Schnittstelle für Millionen Zahl-Links wird, mit Code-Format, Schlüsseln, Rückmeldung, Sicherheit, Fallstricken und PoV-Plan. Die Simulation selbst bleibt unverändert.',
      },
    ],
  },
  {
    datum: 'Do 29.10.2026',
    items: [
      {
        titel: 'Durchlauf mit Scan-Varianten und Schutzmechanismen',
        uhr: 22,
        text: 'Im Durchlauf je Code-Art fallen die Scan-Varianten nacheinander durch die Prüfungen. Rechts daneben steht, welcher Schutzmechanismus an welcher Stelle greift.',
      },
      {
        titel: 'Durchlauf als parallele Stränge',
        uhr: 21,
        text: 'Der Durchlauf zeigt die Arten von Aufrufen einer Code-Art als parallele Stränge, die gleichzeitig durch die Prüfungen laufen.',
      },
      {
        titel: 'Durchlauf je Code-Art mit Abbrüchen',
        uhr: 20,
        text: 'Die Konzept-Seite hat einen neuen Abschnitt „Durchlauf je Code-Art“. Er zeigt Schritt für Schritt, was nach dem Scan passiert und an welchen Stellen ein Vorgang abbricht.',
      },
      {
        titel: 'Konzept-Seite',
        uhr: 19,
        text: 'Die neue Seite „Konzept“ zeigt, wie die Fachseite QR-Codes beauftragt und über ihre Kanäle zustellt, welche Komponenten es gibt, welche Prüfungen je Code-Art greifen und welche Teile noch nicht gebaut sind. Abläufe je Code-Art laufen als Animation und lassen sich anhalten und schrittweise ansehen.',
      },
      {
        titel: 'Hilfe zum Generator',
        uhr: 19,
        text: 'Die Hilfe erklärt sachlich und kompakt den Aufbau des Generators: Code anlegen, Liste und Status, Aktionen je Code und alle Code-Arten mit ihren Variablen. Am Handy stehen alle Diagramme senkrecht.',
      },
      {
        titel: 'Verlauf filtern per Schalter',
        uhr: 19,
        text: 'Über „Filter an“ lässt sich der Verlauf nach Kategorie und Komponente filtern und die Auswahl als Text kopieren. Ohne Filter bleibt die gewohnte Ansicht mit fester Legende.',
      },
      {
        titel: 'Verlauf nach Komponenten',
        uhr: 9,
        text: 'Jede Zeile im Verlauf gehört zu einer Komponente: Link-Management, Vorgangslogik, Zahlungslogik, externe Dienste oder Übergabe ans Fachsystem. Die Prüfungen des Link-Managements erscheinen einzeln, die Übergabe ans Fachsystem ist als Platzhalter sichtbar.',
      },
    ],
  },
  {
    datum: 'Di 27.10.2026',
    items: [
      {
        titel: 'Code-Art Kontostand',
        uhr: 20,
        text: 'Ein KONTO-Code zeigt nach Anmeldung mit dem Geburtsdatum den Kontostand. Ein offener Betrag lässt sich direkt bezahlen. Nach drei Fehlversuchen wird der Code gesperrt.',
      },
      {
        titel: 'Code-Art Adressänderung',
        uhr: 20,
        text: 'Mit einem ADR-Code ändert man nach Anmeldung mit dem Geburtsdatum die Adresse. Die Änderung landet als Eingang für die Sachbearbeitung im Manager.',
      },
      {
        titel: 'Code-Art Dokument mit Ident',
        uhr: 20,
        text: 'Mit einem DOK-Code reicht man ein Dokument wie eine Befreiungsbescheinigung ein, nachdem man sich per Online-Ausweis, Video-Ident oder Bank-Ident ausgewiesen hat. Das Dokument wird verschlüsselt gespeichert und ist im Manager abrufbar.',
      },
      {
        titel: 'Geheime Werte nur in der Datenbank',
        uhr: 20,
        text: 'Name, Geburtsdatum, Adresse und Kontostand stehen nur in der Datenbank, nie im QR-Code.',
      },
    ],
  },
  {
    datum: 'Mo 26.10.2026',
    items: [
      {
        titel: 'Erster Prototyp: QR-Code-Manager und Bezahlstrecke',
        uhr: 21,
        text: 'Im Manager legt man QR-Codes mit Kundennummer, Betrag und Gebühr an, bearbeitet, deaktiviert und löscht sie. Ein Scan oder die Simulation führt durch die ganze Bezahlstrecke mit PayPal, Wero, Banking-App, Kreditkarte, Apple Pay, Google Pay, Klarna und SEPA bis zum Beleg. Abbruch, Ablehnung, Zeitüberschreitung, manipulierte, veraltete und doppelt bezahlte Codes lassen sich durchspielen.',
      },
      {
        titel: 'Statuslog pro Code',
        uhr: 21,
        text: 'Jeder Schritt erscheint live neben dem simulierten Handy, vom Scan über die Prüfung bis zur Verbuchung.',
      },
      {
        titel: 'Info-Seite „So funktioniert QR-Pay“',
        uhr: 21,
        text: 'Eine eigene Info-Seite erklärt Ablauf, Sicherheit, Gebühr und Fehlerfälle. Fehler- und Handy-Seiten verlinken sie, es gibt keine Sackgassen mehr. Der Handy-Rahmen verdeckt den Simulationshinweis nicht mehr.',
      },
      {
        titel: 'Warnung ohne dauerhafte Datenbank',
        uhr: 21,
        text: 'Ist keine dauerhafte Datenbank verbunden, ist die Datenbank-Anzeige im Kopf des Managers gelb markiert. Ohne Datenbank läuft die App auf Vercel trotzdem, mit einer vorübergehenden Notlösung.',
      },
    ],
  },
];

module.exports = { RELEASE_NOTES_STAND, releaseNotes };
