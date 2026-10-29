// Hilfe-Seite: alle Diagramme werden hier als SVG gezeichnet und animiert
(() => {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mq = matchMedia('(max-width: 700px)');
  let mobile = mq.matches;
  const svg = (w, h, body, label) => `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">${body}</svg>`;

  // Pfeilspitze am Ende einer Linie von (x1,y1) nach (x2,y2)
  const head = (x1, y1, x2, y2, cls = '', size = 9) => {
    const a = Math.atan2(y2 - y1, x2 - x1), s = size;
    const p = (da) => `${(x2 - s * Math.cos(a + da)).toFixed(1)},${(y2 - s * Math.sin(a + da)).toFixed(1)}`;
    return `<polygon class="ah ${cls}" points="${x2},${y2} ${p(0.45)} ${p(-0.45)}"/>`;
  };
  const shield = (x, y, s = 1) => `<g class="sh" transform="translate(${x} ${y}) scale(${s})"><path d="M0 -8 L7 -5 V0 C7 5 4 8 0 9.5 C-4 8 -7 5 -7 0 V-5 Z"/></g>`;
  const motion = (path, dur, begin, cls = '', r = 5) => still ? '' :
    `<circle r="${r}" class="pkt ${cls}"><animateMotion dur="${dur}s" begin="${begin}s" repeatCount="indefinite" path="${path}"/></circle>`;

  // --- 1. Konzept (Hero) ------------------------------------------------------
  const heroDesktop = () => {
    const y = 92;
    const lbl = (x, t, s) => `<text class="hero-lbl" x="${x}" y="178">${t}</text><text class="hero-sub" x="${x}" y="197">${s}</text>`;
    const qr = [[0, 0], [1, 0], [0, 1], [3, 0], [3, 1], [2, 2], [0, 3], [1, 3], [3, 3], [2, 1]]
      .map(([i, j]) => `<rect x="${72 + i * 9}" y="${74 + j * 9}" width="7" height="7" fill="#9fb0c9"/>`).join('');
    const body = `
      <path class="hero-line" d="M120 ${y} H720"/><path class="hero-line todo" d="M770 ${y} H880"/>
      <rect class="hero-ico" x="56" y="50" width="64" height="84" rx="6"/><rect x="66" y="60" width="44" height="6" rx="2" fill="#4a6b9c"/>${qr}
      <rect class="hero-ico" x="250" y="48" width="48" height="88" rx="10"/><rect x="258" y="62" width="32" height="56" rx="3" fill="#0f1b2d" stroke="#4a6b9c"/>
      <circle class="hero-glow" cx="500" cy="${y}" r="66"/>
      <path class="hero-ico core" d="M500 40 L546 56 V96 C546 124 526 140 500 150 C474 140 454 124 454 96 V56 Z"/>
      <path d="M482 94 l12 12 l24 -26" fill="none" stroke="#93c5fd" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
      <rect class="hero-ico" x="672" y="58" width="96" height="68" rx="10"/>
      <path d="M686 78 h50 M686 92 h68 M686 106 h40" stroke="#4a6b9c" stroke-width="5" stroke-linecap="round"/>
      <rect class="hero-ico todo" x="880" y="56" width="84" height="74" rx="6"/>
      <path d="M896 76 h14 v14 h-14z M922 76 h14 v14 h-14z M896 100 h14 v14 h-14z M922 100 h14 v30 h-14z" fill="none" stroke="#f59e0b" stroke-dasharray="4 3"/>
      ${lbl(88, 'Brief mit QR-Code', 'monatelang gültig')}
      ${lbl(274, 'Handy', 'nur Kamera, keine App')}
      <text class="hero-lbl" x="500" y="178" style="fill:#fff;font-size:15px">Link-Management</text><text class="hero-sub" x="500" y="197" style="fill:#93c5fd">prüft, meldet an, protokolliert</text>
      ${lbl(720, 'Vorgang', 'zahlen, ändern, einreichen')}
      ${lbl(922, 'Fachsystem', 'Übergabe noch zu bauen')}
      ${still ? '' : `<circle r="8" fill="#60a5fa"><animateMotion dur="6s" repeatCount="indefinite" path="M120 ${y} H922" keyPoints="0;0.47;0.47;0.74;0.74;1" keyTimes="0;0.28;0.48;0.7;0.78;1" calcMode="linear"/>
        <animate attributeName="fill" dur="6s" repeatCount="indefinite" values="#60a5fa;#60a5fa;#34d399;#34d399;#f59e0b;#f59e0b" keyTimes="0;0.4;0.48;0.74;0.8;1"/></circle>`}`;
    return svg(1000, 210, body, 'Vom Brief über das Handy und das Link-Management zum Vorgang und Fachsystem');
  };

  // --- 2. Komponenten-Landkarte -----------------------------------------------
  const node = (x, y, w, h, cls, title, lines) => `<g class="n ${cls}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12"/>
    <text class="t" x="${x + 16}" y="${y + 26}">${title}</text>${lines.map((l, i) => `<text class="s" x="${x + 16}" y="${y + 46 + i * 17}">${l}</text>`).join('')}</g>`;
  const mapDesktop = () => {
    const W = 214, c = [16, 276, 536, 796], A = 18, B = 140, H = 96, C = 290;
    const wire = (d, todo, x1, y1, x2, y2, both) => `<path class="wire${todo ? ' todo' : ''}" d="${d}"/>${head(x1, y1, x2, y2, todo ? 'todo' : '')}${both ? head(x2, y2, x1, y1, '') : ''}`;
    const mid = (r) => r + H / 2;
    const body = `<style>.ah{fill:#9aa7ba}.ah.todo{fill:#d97706}</style>
      ${node(c[0], A, W, H, 'own', 'Code-Manager', ['Codes anlegen, ändern, sperren', 'QR-Code erzeugen, Verlauf'])}
      ${node(c[0], B, W, H, 'own', 'Handy-Frontend', ['Scan, Anzeige, Formulare', 'Upload, Rücksprung'])}
      ${node(c[1], A, W, B + H - A, 'core', 'Link-Management', ['Signatur prüfen (HMAC)', 'Version und Status', 'Ablauf, Einmal-Code', 'Anmeldung mit Sperre', 'Sitzung ausstellen', 'Statuslog je Code'])}
      ${node(c[2], A, W, H, 'own', 'Vorgangslogik', ['Kontostand, Adressänderung', 'Dokument verschlüsseln'])}
      ${node(c[2], B, W, H, 'own', 'Zahlungslogik', ['Zahlung anlegen, abgleichen', 'Doppelzahlung, Verbuchung'])}
      ${node(c[3], A, W, B + H - A, 'todo', 'Übergabe Fachsystem', ['Outbox mit Wiederholung', 'Quittung und Abgleich', 'Löschfristen', '', '', 'noch nicht gebaut'])}
      ${node(c[1], C, W, 80, 'ext', 'Ident-Dienst', ['eID, Video, Bank', 'hier nachgebaut'])}
      ${node(c[2], C, W, 80, 'ext', 'Zahlungsdienst', ['PayPal, Wero, Karte …', 'hier nachgebaut'])}
      ${wire(`M${c[0] + W} ${mid(A)} H${c[1]}`, 0, c[0] + W, mid(A), c[1], mid(A))}
      ${wire(`M${c[0] + W} ${mid(B)} H${c[1]}`, 0, c[0] + W, mid(B), c[1], mid(B), 1)}
      ${wire(`M${c[1] + W} ${mid(A)} H${c[2]}`, 0, c[1] + W, mid(A), c[2], mid(A))}
      ${wire(`M${c[1] + W} ${mid(B)} H${c[2]}`, 0, c[1] + W, mid(B), c[2], mid(B))}
      ${wire(`M${c[2] + W} ${mid(A)} H${c[3]}`, 1, c[2] + W, mid(A), c[3], mid(A))}
      ${wire(`M${c[2] + W} ${mid(B)} H${c[3]}`, 1, c[2] + W, mid(B), c[3], mid(B))}
      ${wire(`M${c[1] + W / 2} ${B + H} V${C}`, 0, c[1] + W / 2, B + H, c[1] + W / 2, C, 1)}
      ${wire(`M${c[2] + W / 2} ${B + H} V${C}`, 0, c[2] + W / 2, B + H, c[2] + W / 2, C, 1)}
      ${motion(`M${c[0] + W} ${mid(B)} H${c[1]}`, 1.6, 0)}
      ${motion(`M${c[1] + W} ${mid(B)} H${c[2]}`, 1.6, 0.8)}
      ${motion(`M${c[1] + W} ${mid(A)} H${c[2]}`, 1.6, 1.4)}
      ${motion(`M${c[2] + W / 2} ${B + H} V${C}`, 1.4, 0.4)}
      ${motion(`M${c[1] + W / 2} ${C} V${B + H}`, 1.4, 1.1)}
      ${motion(`M${c[2] + W} ${mid(A)} H${c[3]}`, 2, 0.3, 'todo')}
      ${motion(`M${c[2] + W} ${mid(B)} H${c[3]}`, 2, 1.3, 'todo')}`;
    return svg(1026, 388, body, 'Komponenten: Code-Manager, Handy, Link-Management, Vorgang, Zahlung, externe Dienste und die noch fehlende Übergabe');
  };

  // Handy: dieselbe Kette senkrecht
  const heroMobile = () => {
    const x = 52, ys = [44, 126, 214, 304, 386];
    const lbl = (y, t, s, hi) => `<text x="${x + 58}" y="${y - 2}" style="fill:${hi ? '#fff' : '#c6d2e4'};font-size:${hi ? 17 : 15}px;font-weight:700">${t}</text><text x="${x + 58}" y="${y + 18}" style="fill:${hi ? '#93c5fd' : '#7f93b3'};font-size:13px">${s}</text>`;
    const body = `
      <path class="hero-line" d="M${x} ${ys[0]} V${ys[3]}"/><path class="hero-line todo" d="M${x} ${ys[3] + 30} V${ys[4] - 30}"/>
      <rect class="hero-ico" x="${x - 22}" y="${ys[0] - 28}" width="44" height="56" rx="5"/><path d="M${x - 12} ${ys[0] - 12} h9 v9 h-9z M${x + 3} ${ys[0] - 12} h9 v9 h-9z M${x - 12} ${ys[0] + 3} h9 v9 h-9z M${x + 5} ${ys[0] + 5} h5 v5 h-5z" fill="#9fb0c9"/>
      <rect class="hero-ico" x="${x - 17}" y="${ys[1] - 30}" width="34" height="60" rx="8"/><rect x="${x - 11}" y="${ys[1] - 20}" width="22" height="38" rx="2" fill="#0f1b2d" stroke="#4a6b9c"/>
      <circle class="hero-glow" cx="${x}" cy="${ys[2]}" r="46"/>
      <g transform="translate(${x} ${ys[2]}) scale(0.72) translate(-500 -95)"><path class="hero-ico core" d="M500 40 L546 56 V96 C546 124 526 140 500 150 C474 140 454 124 454 96 V56 Z"/>
      <path d="M482 94 l12 12 l24 -26" fill="none" stroke="#93c5fd" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/></g>
      <rect class="hero-ico" x="${x - 32}" y="${ys[3] - 24}" width="64" height="48" rx="8"/><path d="M${x - 20} ${ys[3] - 9} h34 M${x - 20} ${ys[3] + 1} h40 M${x - 20} ${ys[3] + 11} h24" stroke="#4a6b9c" stroke-width="4" stroke-linecap="round"/>
      <rect class="hero-ico todo" x="${x - 28}" y="${ys[4] - 26}" width="56" height="52" rx="5"/>
      ${lbl(ys[0], 'Brief mit QR-Code', 'monatelang gültig')}${lbl(ys[1], 'Handy', 'nur Kamera, keine App')}
      ${lbl(ys[2], 'Link-Management', 'prüft, meldet an, protokolliert', 1)}${lbl(ys[3], 'Vorgang', 'zahlen, ändern, einreichen')}${lbl(ys[4], 'Fachsystem', 'Übergabe noch zu bauen')}
      ${still ? '' : `<circle r="8" fill="#60a5fa"><animateMotion dur="6s" repeatCount="indefinite" path="M${x} ${ys[0]} V${ys[4]}" keyPoints="0;0.5;0.5;0.76;0.76;1" keyTimes="0;0.28;0.48;0.7;0.78;1" calcMode="linear"/>
        <animate attributeName="fill" dur="6s" repeatCount="indefinite" values="#60a5fa;#60a5fa;#34d399;#34d399;#f59e0b;#f59e0b" keyTimes="0;0.4;0.48;0.74;0.8;1"/></circle>`}`;
    return svg(360, 424, body, 'Vom Brief über das Handy und das Link-Management zum Vorgang und Fachsystem');
  };

  const mapMobile = () => {
    const wire = (d, todo, x1, y1, x2, y2, both) => `<path class="wire${todo ? ' todo' : ''}" d="${d}"/>${head(x1, y1, x2, y2, todo ? 'todo' : '')}${both ? head(x2, y2, x1, y1, '') : ''}`;
    const body = `<style>.ah{fill:#9aa7ba}.ah.todo{fill:#d97706}</style>
      ${node(8, 8, 168, 78, 'own', 'Code-Manager', ['Codes anlegen, sperren', 'QR-Code erzeugen'])}
      ${node(184, 8, 168, 78, 'own', 'Handy-Frontend', ['Scan, Formulare', 'Upload, Rücksprung'])}
      ${node(8, 118, 218, 152, 'core', 'Link-Management', ['Signatur prüfen (HMAC)', 'Version und Status', 'Ablauf, Einmal-Code', 'Anmeldung mit Sperre', 'Sitzung, Statuslog'])}
      ${node(236, 118, 116, 70, 'ext', 'Ident', ['eID, Video, Bank'])}
      ${node(236, 200, 116, 70, 'ext', 'Zahlung ext.', ['PayPal, Wero …'])}
      ${node(8, 302, 168, 78, 'own', 'Vorgangslogik', ['Konto, Adresse,', 'Dokument'])}
      ${node(184, 302, 168, 78, 'own', 'Zahlungslogik', ['Abgleich, Verbuchung', 'Doppelzahlung'])}
      ${node(8, 418, 344, 86, 'todo', 'Übergabe Fachsystem', ['Outbox, Wiederholung, Quittung', 'noch nicht gebaut'])}
      ${wire('M92 86 V116', 0, 92, 86, 92, 116)}${wire('M205 86 V116', 0, 205, 86, 205, 116, 1)}
      ${wire('M226 152 H234', 0, 226, 152, 234, 152)}
      ${wire('M92 270 V300', 0, 92, 270, 92, 300)}${wire('M205 270 V300', 0, 205, 270, 205, 300)}${wire('M294 270 V300', 0, 294, 270, 294, 300, 1)}
      ${wire('M92 380 V416', 1, 92, 380, 92, 416)}${wire('M268 380 V416', 1, 268, 380, 268, 416)}
      ${motion('M205 86 V116', 1.2, 0)}${motion('M92 270 V300', 1.2, 0.5)}${motion('M205 270 V300', 1.2, 0.9)}${motion('M294 300 V270', 1.2, 0.3)}
      ${motion('M92 380 V416', 1.6, 0.2, 'todo')}${motion('M268 380 V416', 1.6, 1, 'todo')}`;
    return svg(360, 512, body, 'Komponenten senkrecht: Manager und Handy, Link-Management, Vorgang und Zahlung, Übergabe');
  };

  // --- 3. Abläufe pro Code-Art -------------------------------------------------
  const LANES = [
    { id: 'H', name: 'Handy', sub: 'Kunde', cls: 'own' },
    { id: 'L', name: 'Link-Management', sub: 'Kern', cls: 'core' },
    { id: 'P', name: 'Vorgang · Zahlung', sub: 'Eigenentwicklung', cls: 'own' },
    { id: 'X', name: 'Externer Dienst', sub: 'Zahlung · Ident', cls: 'ext' },
    { id: 'F', name: 'Fachsystem', sub: 'noch zu bauen', cls: 'todo' },
  ];
  const LANE_NAME = { H: 'Handy-Frontend', L: 'Link-Management', P: 'Vorgang / Zahlung', X: 'Externer Dienst', F: 'Fachsystem' };
  const scan = { f: 'H', to: 'L', l: 'Scan öffnet /s/‹Token›', t: 'Kunde scannt den Code', d: 'Die Kamera öffnet eine normale HTTPS-Adresse. Im Pfad steckt der Token mit Code-ID, Code-Art, Version und den öffentlichen Daten. Keine App nötig.' };
  const checks = { f: 'L', to: 'L', l: 'Signatur, Version, Status', sec: 'HMAC + Version', t: 'Dieselben Prüfungen für jede Code-Art', d: 'Echt (Signatur), aktuell (Version), aktiv und nicht abgelaufen. Das Link-Management prüft jeden Code gleich, egal welcher Vorgang dahinter liegt. Jede Prüfung landet im Statuslog.' };
  const birth = [
    { f: 'L', to: 'H', l: 'Anmeldung nötig', t: 'Handy fragt das Geburtsdatum ab', d: 'Der Vorgang ist persönlich. Das Geburtsdatum steht nur in der Datenbank, nie im QR-Code. Ein Foto des Briefs reicht also nicht.' },
    { f: 'H', to: 'L', l: 'Geburtsdatum', sec: 'Sperre nach 3 Versuchen', t: 'Kunde meldet sich an', d: 'Nach drei falschen Versuchen ist der Code 15 Minuten gesperrt, auch für das richtige Datum. Das verhindert Durchprobieren.' },
    { f: 'L', to: 'H', l: 'Sitzung (10 Min.)', sec: 'Signierte Sitzung', t: 'Kurzlebige, signierte Sitzung', d: 'Das Handy bekommt ein signiertes Sitzungstoken, gebunden an Code-ID und Version, 10 Minuten gültig. Ohne Sitzung gibt es keine persönlichen Daten.' },
  ];
  const checkout = [
    { f: 'P', to: 'X', l: 'Weiter zum Checkout', t: 'Weiterleitung zum Anbieter', d: 'Der Kunde gibt die Zahlung beim Anbieter frei. Bankdaten sieht unser System nie. In der Simulation ist der Checkout nachgebaut.' },
    { f: 'X', to: 'P', l: 'Webhook: bezahlt', sec: 'Webhook-Prüfung', t: 'Anbieter meldet das Ergebnis', d: 'Der Anbieter ruft unseren Webhook auf. Er ist idempotent: Ein zweiter Aufruf ändert nichts. Im echten Betrieb wird zusätzlich die Signatur des Anbieters geprüft.' },
  ];
  const FLOWS = {
    PAY: { name: 'Zahlung', steps: [scan,
      { f: 'L', to: 'L', l: 'Token lesen', t: 'Inhalt dekodieren', d: 'Base64url wird zu JSON. Kundennummer, Betrag und Gebühr sind lesbar, aber noch nicht vertrauenswürdig.' },
      { f: 'L', to: 'L', l: 'Signatur prüfen', sec: 'HMAC-SHA256', t: 'Ist der Code echt?', d: 'Der Server berechnet die Signatur mit seinem geheimen Schlüssel neu. Wurde auch nur eine Ziffer geändert, passt sie nicht mehr und der Scan wird abgelehnt.' },
      { f: 'L', to: 'L', l: 'Version, Status, Ablauf', sec: 'Versionierung', t: 'Ist der Code aktuell und aktiv?', d: 'Die Version im QR muss zur Datenbank passen. Wurde der Betrag geändert, ist der alte Ausdruck ungültig. Dazu kommen Status (aktiv, deaktiviert, bezahlt) und Ablaufdatum.' },
      { f: 'L', to: 'H', l: 'Beträge und Zahlarten', t: 'Handy zeigt den Betrag', d: 'Kundennummer, Betrag, Gebühr und Endbetrag erscheinen mit den angebotenen Zahlarten.' },
      { f: 'H', to: 'P', l: 'Zahlart gewählt', t: 'Kunde wählt eine Zahlart', d: 'Zum Beispiel PayPal oder Wero. Das Handy schickt nur Token und Zahlart, keinen Betrag.' },
      { f: 'P', to: 'P', l: 'Zahlung anlegen', sec: 'Betrag aus DB', t: 'Zahlung mit Betrag aus der Datenbank', d: 'Der Betrag kommt immer aus der Datenbank, nie vom Handy. Die Zahlung bekommt eine eigene Referenz und läuft nach 15 Minuten ohne Antwort ab.' },
      ...checkout,
      { f: 'P', to: 'P', l: 'Abgleichen, verbuchen', sec: 'Doppelzahlung', t: 'Betrag abgleichen und verbuchen', d: 'Passt der Betrag noch zum Code? Wurde der Code inzwischen schon anders bezahlt? Dann wird erstattet statt doppelt verbucht.' },
      { f: 'P', to: 'L', l: 'Code „bezahlt“', sec: 'Einmal-Code', t: 'Code wird geschlossen', d: 'Ein Einmal-Code wechselt auf „bezahlt“. Jeder weitere Scan zeigt nur noch den Beleg.' },
      { f: 'P', to: 'H', l: 'Rücksprung, Beleg', t: 'Bestätigung auf dem Handy', d: 'Der Kunde kommt vom Anbieter zurück und sieht den Beleg mit Referenz.' },
      { f: 'P', to: 'F', l: 'Zahlungseingang melden', kind: 'todo', t: 'Übergabe an die Forderungsverwaltung', d: 'Noch nicht gebaut. Das Fachsystem muss den Eingang genau einmal bekommen, auch wenn es gerade nicht erreichbar ist. Eine Skizze dazu steht unten: Outbox mit Wiederholung und Quittung.' },
    ] },
    KONTO: { name: 'Kontostand', steps: [scan, checks, ...birth,
      { f: 'H', to: 'P', l: 'Kontostand abrufen', t: 'Kontostand anzeigen', d: 'Kontostand = Stand im Code plus alle bezahlten Ausgleichszahlungen. Ohne gültige Sitzung gibt es keine Daten.' },
      { f: 'H', to: 'P', l: 'Offenes ausgleichen', sec: 'nur mit Sitzung', t: 'Offenen Betrag direkt zahlen', d: 'Der offene Betrag wird aus dem aktuellen Kontostand berechnet, nicht vom Handy übernommen.' },
      ...checkout,
      { f: 'P', to: 'P', l: 'Überzahlung prüfen', sec: 'Betragsabgleich', t: 'Abgleich gegen den aktuellen Stand', d: 'Ist inzwischen weniger offen als bezahlt wurde, wird die Differenz erstattet. Danach steht der neue Kontostand im Verlauf.' },
      { f: 'P', to: 'F', l: 'Zahlungseingang melden', kind: 'todo', t: 'Übergabe an die Kontoführung', d: 'Noch nicht gebaut. Hier fehlt die Buchung im führenden System und der spätere Abgleich mit dem Kontoauszug.' },
    ] },
    ADR: { name: 'Adressänderung', steps: [scan, checks, ...birth,
      { f: 'H', to: 'P', l: 'Neue Anschrift', sec: 'Validierung', t: 'Neue Anschrift eingeben', d: 'Pflichtfelder, fünfstellige PLZ, Gültig-ab-Datum. Die bisherige Anschrift sieht der Kunde erst nach erfolgreicher Anmeldung.' },
      { f: 'P', to: 'P', l: 'Als Eingang speichern', t: 'Alt und neu gemeinsam speichern', d: 'Damit die Sachbearbeitung nachvollziehen kann, was sich geändert hat.' },
      { f: 'P', to: 'L', l: 'Code „erledigt“', sec: 'Einmal-Code', t: 'Code wird geschlossen', d: 'Ein weiterer Scan zeigt nur noch die Bestätigung.' },
      { f: 'P', to: 'H', l: 'Bestätigung', t: 'Bestätigung auf dem Handy', d: 'Mit Eingangsnummer für Rückfragen.' },
      { f: 'P', to: 'F', l: 'An Kundenstamm', kind: 'todo', t: 'Übergabe an den Kundenstamm', d: 'Noch nicht gebaut. Offene Frage: automatisch übernehmen oder erst nach Prüfung durch die Sachbearbeitung?' },
    ] },
    DOK: { name: 'Dokument mit Ident', steps: [scan, checks,
      { f: 'L', to: 'H', l: 'Ident nötig (Niveau)', t: 'Vertrauensniveau aus dem Code', d: 'Der Code legt das Niveau fest. Bei „hoch“ ist nur der Online-Ausweis erlaubt, bei „substanziell“ auch Video- und Bank-Ident.' },
      { f: 'H', to: 'X', l: 'Ident-Verfahren', sec: 'Vertrauensniveau', t: 'Identität beim Ident-Dienst bestätigen', d: 'Online-Ausweis, Video- oder Bank-Ident. In der Simulation sind alle drei nachgebaut.' },
      { f: 'X', to: 'L', l: 'Identität: Name, Geb.', t: 'Ident-Dienst liefert das Ergebnis', d: 'Name und Geburtsdatum der geprüften Person kommen beim Link-Management an.' },
      { f: 'L', to: 'L', l: 'Personenabgleich', sec: 'Abgleich mit Vorgang', t: 'Ist es die richtige Person?', d: 'Passt die identifizierte Person nicht zu den Daten im Code, wird abgelehnt. Wer den Brief eines anderen scannt, kommt nicht weiter.' },
      { f: 'L', to: 'H', l: 'Sitzung, Upload frei', sec: 'Signierte Sitzung', t: 'Upload freigeschaltet', d: 'Signierte Sitzung, gebunden an Code und Version.' },
      { f: 'H', to: 'P', l: 'Dokument hochladen', sec: 'Max. 3 MB, SHA-256', t: 'Datei mit Prüfsumme senden', d: 'Nur PDF, JPG oder PNG bis 3 MB. Das Handy schickt eine SHA-256-Prüfsumme mit, der Server rechnet nach.' },
      { f: 'P', to: 'P', l: 'Verschlüsselt speichern', sec: 'AES-256-GCM', t: 'Nur verschlüsselt ablegen', d: 'Die Datei liegt mit AES-256-GCM verschlüsselt in der Datenbank. Lesbar ist sie nur über den Manager.' },
      { f: 'P', to: 'H', l: 'Eingangsbestätigung', t: 'Bestätigung auf dem Handy', d: 'Mit Eingangsnummer. Der Code ist danach erledigt.' },
      { f: 'P', to: 'F', l: 'An Sachbearbeitung', kind: 'todo', t: 'Übergabe an Akte oder DMS', d: 'Noch nicht gebaut. Dazu gehören Löschfristen, Zugriffsrechte und ein revisionssicheres Protokoll.' },
    ] },
    INFO: { name: 'Info-Link', steps: [scan,
      { f: 'L', to: 'L', l: 'Signatur, Status', sec: 'HMAC + Status', t: 'Auch ein Info-Link wird geprüft', d: 'Ein deaktivierter Link führt nicht ins Leere, sondern auf eine Erklärseite.' },
      { f: 'L', to: 'H', l: 'Weiterleitung aufs Ziel', t: 'Verwalteter Link', d: 'Das Ziel steht in der Datenbank und lässt sich ändern, ohne neu zu drucken.' },
      { f: 'L', to: 'F', l: 'Scan-Statistik', kind: 'todo', t: 'Messen, ob es wirkt', d: 'Noch nicht gebaut: Wie viele Briefe werden gescannt, wann und wo brechen Menschen ab? Ohne diese Zahlen lässt sich der Nutzen nicht belegen.' },
    ] },
    FEHLER: { name: 'Fehlerfälle', steps: [
      { f: 'H', to: 'L', l: 'Betrag im QR geändert', t: 'Jemand manipuliert den Code', d: 'Der Inhalt ist lesbar, also lässt er sich ändern. Aber die Signatur passt dann nicht mehr.' },
      { f: 'L', to: 'L', l: 'Signatur falsch', kind: 'fail', sec: 'HMAC-SHA256', t: 'Abgelehnt: Code verändert', d: 'Der Scan wird abgelehnt und im Statuslog als Fehler protokolliert.' },
      { f: 'H', to: 'L', l: 'Alter Ausdruck', t: 'Ein veralteter Brief wird gescannt', d: 'Der Betrag wurde im Manager geändert, der Kunde scannt den alten Brief.' },
      { f: 'L', to: 'L', l: 'Version veraltet', kind: 'fail', sec: 'Versionierung', t: 'Abgelehnt: Code veraltet', d: 'Die Version im QR ist älter als in der Datenbank. Der Kunde bekommt einen klaren Hinweis statt einer falschen Zahlung.' },
      { f: 'H', to: 'L', l: '3× falsches Geburtsdatum', t: 'Jemand probiert Geburtsdaten durch', d: 'Ein fremder Brief, das Geburtsdatum wird geraten.' },
      { f: 'L', to: 'L', l: '15 Min. gesperrt', kind: 'fail', sec: 'Sperre', t: 'Abgelehnt: Code gesperrt', d: 'Nach drei Fehlversuchen nimmt der Code 15 Minuten lang gar keine Anmeldung mehr an, auch nicht das richtige Datum.' },
      { f: 'X', to: 'P', l: 'Zweite Zahlung parallel', t: 'Zwei Geräte zahlen gleichzeitig', d: 'Zwei Checkouts laufen parallel, beide werden beim Anbieter bestätigt.' },
      { f: 'P', to: 'P', l: 'Doppelzahlung erkannt', kind: 'fail', sec: 'Doppelzahlung', t: 'Zweite Zahlung wird erstattet', d: 'Der Code bleibt genau einmal bezahlt, die zweite Zahlung wird als Erstattung markiert.' },
      { f: 'X', to: 'P', l: 'Keine Antwort', t: 'Anbieter meldet sich nicht', d: 'Der Kunde hat den Checkout offen gelassen oder der Anbieter antwortet nicht.' },
      { f: 'P', to: 'P', l: 'Nach 15 Min. abgelaufen', kind: 'fail', t: 'Zahlung läuft automatisch ab', d: 'Der Code bleibt offen und kann neu bezahlt werden. Nichts hängt fest.' },
    ] },
  };

  const LX = { H: 90, L: 270, P: 450, X: 630, F: 810 }, TOP = 100, ROW = 54;
  let flowId = 'PAY', cur = 0, timer = null, playing = !still;

  const MX = { H: 36, L: 108, P: 180, X: 252, F: 324 }, SHORT = { H: 'Handy', L: 'Link', P: 'Vorgang', X: 'Extern', F: 'Fach' };
  const shieldIco = '<svg class="ms-sh" width="16" height="18" viewBox="-9 -10 18 20" aria-label="Sicherheitsprüfung"><path d="M0 -8 L7 -5 V0 C7 5 4 8 0 9.5 C-4 8 -7 5 -7 0 V-5 Z"/></svg>';
  function drawSeqMobile() {
    const steps = FLOWS[flowId].steps;
    const nodes = LANES.map((l) => `<g class="lane-h ${l.cls}"><rect x="${MX[l.id] - 32}" y="6" width="64" height="34" rx="9"/><text x="${MX[l.id]}" y="28" style="font-size:12.5px">${SHORT[l.id]}</text></g>
      <line class="lane-l ${l.cls}" x1="${MX[l.id]}" y1="40" x2="${MX[l.id]}" y2="58"/>`).join('');
    $('#seq').innerHTML = `<div class="seq-strip">${svg(360, 96, `<style>.ah{fill:#2563eb}.ah.todo{fill:#d97706}.ah.fail{fill:#c0362c}</style>${nodes}<g id="strip-cur"></g>`, 'Beteiligte')}</div>
      <ol class="mlist">${steps.map((s, i) => `<li class="ms ${s.kind || ''}" data-i="${i}"><span class="n">${i + 1}</span><span class="b"><b>${esc(s.l)}</b><small>${s.f === s.to ? LANE_NAME[s.f] : `${SHORT[s.f]} → ${SHORT[s.to]}`}</small></span>${s.sec ? shieldIco : ''}</li>`).join('')}</ol>`;
    $('#seq').querySelectorAll('.ms').forEach((li) => li.addEventListener('click', () => go(+li.dataset.i)));
  }
  function showMobile(s) {
    $('#seq').querySelectorAll('.ms').forEach((li, i) => { li.classList.toggle('now', i === cur); li.classList.toggle('next', i > cur); });
    const col = s.kind === 'todo' ? '#d97706' : s.kind === 'fail' ? '#c0362c' : '#2563eb', y = 68;
    let g;
    if (s.f === s.to) {
      g = `<rect x="${MX[s.f] - 35}" y="3" width="70" height="40" rx="11" fill="none" stroke="${col}" stroke-width="3">${still ? '' : '<animate attributeName="opacity" values="1;.25;1" dur="1.2s" repeatCount="indefinite"/>'}</rect>
        <path d="M${MX[s.f] - 14} 66 H${MX[s.f] + 14}" stroke="${col}" stroke-width="2.5"/>`;
    } else {
      const a = MX[s.f], b = MX[s.to], d = Math.sign(b - a);
      g = `<path d="M${a} ${y} H${b - d * 4}" stroke="${col}" stroke-width="2.5" fill="none" ${s.kind === 'todo' ? 'stroke-dasharray="6 4"' : ''}/>${head(a, y, b, y, s.kind || '', 10)}
        ${still ? '' : `<circle r="6" fill="${col}"><animateMotion dur="0.9s" fill="freeze" path="M${a} ${y} H${b}"/></circle>`}`;
    }
    $('#strip-cur').innerHTML = `${g}<text x="180" y="90" style="font-size:13px;font-weight:700;text-anchor:middle;fill:${col}">${esc(s.l)}</text>`;
  }

  function drawSeq() {
    if (mobile) return drawSeqMobile();
    const steps = FLOWS[flowId].steps, h = TOP + steps.length * ROW + 12;
    const lanes = LANES.map((l) => `<line class="lane-l ${l.cls}" x1="${LX[l.id]}" y1="66" x2="${LX[l.id]}" y2="${h - 6}"/>
      <g class="lane-h ${l.cls}"><rect x="${LX[l.id] - 84}" y="8" width="168" height="56" rx="10"/><text x="${LX[l.id]}" y="32">${l.name}</text><text class="s" x="${LX[l.id]}" y="52">${l.sub}</text></g>`).join('');
    const rows = steps.map((s, i) => {
      const y = TOP + i * ROW + ROW / 2, cls = s.kind || '';
      let shape;
      if (s.f === s.to) {
        const x = LX[s.f];
        shape = `<rect class="bx draw" pathLength="1" style="--len:1" x="${x - 100}" y="${y - 18}" width="200" height="36" rx="9"/><text class="lbl" x="${x}" y="${y + 5}">${esc(s.l)}</text>`;
      } else {
        const x1 = LX[s.f], x2 = LX[s.to], dir = Math.sign(x2 - x1), a = x1 + dir * 6, b = x2 - dir * 6;
        shape = `<path class="ar draw" pathLength="1" style="--len:1" d="M${a} ${y + 6} H${b}"/>${head(a, y + 6, b, y + 6, 'ah')}
          <text class="lbl" x="${(x1 + x2) / 2}" y="${y - 4}">${esc(s.l)}</text><path class="mp" d="M${a} ${y + 6} H${b}" fill="none" stroke="none"/>`;
      }
      return `<g class="st ${cls}" data-i="${i}"><rect class="hl" x="0" y="${y - ROW / 2}" width="900" height="${ROW}"/>
        <text class="num" x="8" y="${y + 5}">${i + 1}</text>${s.sec ? shield(40, y, 1.25) : ''}${shape}</g>`;
    }).join('');
    $('#seq').innerHTML = svg(900, h, `<style>.ah{fill:#8492a8}.st.now .ah{fill:#2563eb}.st.todo .ah{fill:#d97706}.st.fail .ah{fill:#c0362c}</style>${lanes}${rows}`, `Ablauf ${FLOWS[flowId].name}`);
    $('#seq').querySelectorAll('.st').forEach((g) => g.addEventListener('click', () => { go(+g.dataset.i); }));
  }

  function show() {
    const steps = FLOWS[flowId].steps, s = steps[cur];
    if (mobile) showMobile(s);
    $('#seq').querySelectorAll('.st').forEach((g, i) => {
      g.classList.toggle('now', i === cur);
      g.classList.toggle('next', i > cur);
      g.querySelector('.dot')?.remove();
    });
    const g = $(`#seq .st[data-i="${cur}"]`);
    if (g) {
      // Neu zeichnen, damit die Animation erneut startet
      g.querySelectorAll('.draw').forEach((el) => { el.style.animation = 'none'; void el.getBBox(); el.style.animation = ''; });
      const mp = g.querySelector('.mp');
      if (mp && !still) {
        const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c.setAttribute('r', '6'); c.setAttribute('class', 'dot');
        c.setAttribute('fill', s.kind === 'todo' ? '#d97706' : s.kind === 'fail' ? '#c0362c' : '#2563eb');
        const am = document.createElementNS('http://www.w3.org/2000/svg', 'animateMotion');
        am.setAttribute('dur', '0.9s'); am.setAttribute('fill', 'freeze'); am.setAttribute('begin', 'indefinite');
        am.setAttribute('path', mp.getAttribute('d'));
        c.appendChild(am); g.appendChild(c);
        try { am.beginElement(); } catch { /* ältere Browser */ }
      }
    }
    $('#fs-count').textContent = `${FLOWS[flowId].name} · Schritt ${cur + 1} von ${steps.length}`;
    $('#fs-title').textContent = s.t;
    $('#fs-text').textContent = s.d;
    const lane = s.f === s.to ? LANE_NAME[s.f] : `${LANE_NAME[s.f]} → ${LANE_NAME[s.to]}`;
    $('#fs-chips').innerHTML = `<span class="chip-c">${esc(lane)}</span>${s.sec ? `<span class="chip-s">Sicherheit: ${esc(s.sec)}</span>` : ''}${s.kind === 'todo' ? '<span class="chip-t">noch zu bauen</span>' : ''}${s.kind === 'fail' ? '<span class="chip-x">abgelehnt</span>' : ''}`;
    $('#fs-bar').style.width = `${((cur + 1) / steps.length) * 100}%`;
  }
  const go = (i) => { cur = Math.max(0, Math.min(i, FLOWS[flowId].steps.length - 1)); show(); restart(); };
  function tick() {
    const n = FLOWS[flowId].steps.length;
    if (cur < n - 1) { cur++; show(); } else { cur = 0; show(); }
  }
  function restart() {
    clearInterval(timer);
    $('#fs-play').classList.toggle('on', playing);
    $('#fs-play').setAttribute('aria-label', playing ? 'Pause' : 'Abspielen');
    if (playing) timer = setInterval(tick, 2800);
  }
  function setFlow(id) {
    flowId = id; cur = 0;
    $('#flow-tabs').querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.f === id));
    drawSeq(); show(); restart();
  }
  $('#flow-tabs').innerHTML = Object.entries(FLOWS).map(([id, f]) => `<button type="button" data-f="${id}">${id === 'FEHLER' ? '' : `<b>${id}</b>`}${f.name}</button>`).join('');
  $('#flow-tabs').onclick = (e) => { const b = e.target.closest('button'); if (b) setFlow(b.dataset.f); };
  $('#fs-prev').onclick = () => go(cur - 1);
  $('#fs-next').onclick = () => go(cur + 1);
  $('#fs-restart').onclick = () => { playing = true; go(0); };
  $('#fs-play').onclick = () => { playing = !playing; restart(); };
  setFlow('PAY');

  // --- 4. Sicherheits-Tore ------------------------------------------------------
  const GATES = [
    { t: 'Signatur', s: 'HMAC-SHA256' }, { t: 'Version', s: 'alter Druck raus' }, { t: 'Status & Ablauf', s: 'aktiv, gültig' },
    { t: 'Missbrauch', s: 'Rate-Limit (Skizze)', todo: 1 }, { t: 'Anmeldung', s: 'Geb.-Datum, Ident' }, { t: 'Sitzung', s: 'signiert, 10 Min.' },
  ];
  const TOKS = [
    { t: 'Gültiger Code', a: 'gültig', b: '', stop: 99 }, { t: 'Betrag geändert', a: 'Betrag', b: 'geänd.', stop: 0 },
    { t: 'Alter Ausdruck', a: 'alter', b: 'Druck', stop: 1 }, { t: 'Deaktivierter Code', a: 'deak-', b: 'tiviert', stop: 2 },
    { t: 'Massen-Scan (Bot)', a: 'Bot', b: '', stop: 3 }, { t: 'Falsches Geburtsdatum', a: 'falsch.', b: 'Geb.', stop: 4 },
  ];
  let gateRun = 0;
  function gates(m) {
    const run = ++gateRun;
    let body, pos, W, H;
    if (!m) {
      const gx = (i) => 228 + i * 118, X0 = 180, X1 = 932, Y0 = 108, DY = 34;
      W = 1000; H = Y0 + DY * TOKS.length;
      body = GATES.map((g, i) => `<g class="gate${g.todo ? ' todo' : ''}"><rect x="${gx(i) - 56}" y="10" width="112" height="56" rx="10"/>
        <text x="${gx(i)}" y="34">${g.t}</text><text class="s" x="${gx(i)}" y="52">${g.s}</text></g>
        <line x1="${gx(i)}" y1="66" x2="${gx(i)}" y2="${Y0 + DY * TOKS.length - 14}" stroke="${g.todo ? '#f2c27a' : '#c3ccd9'}" stroke-width="3" ${g.todo ? 'stroke-dasharray="6 5"' : ''}/>`).join('')
        + `<g class="gate"><rect x="${X1 - 48}" y="10" width="96" height="56" rx="10" style="fill:#e3f7ee;stroke:#0e9f6e"/><text x="${X1}" y="42">Vorgang</text></g>`
        + TOKS.map((k, i) => `<line class="track" x1="${X0}" y1="${Y0 + i * DY}" x2="${X1}" y2="${Y0 + i * DY}"/><g class="tok"><text x="12" y="${Y0 + i * DY + 4}">${k.t}</text>
          <circle r="8" fill="#2563eb"/><path class="x" d="M-6 -6 L6 6 M6 -6 L-6 6"/></g>`).join('');
      pos = (i, p, k) => { const stop = k.stop === 99 ? X1 - 56 : gx(k.stop) - 14; const x = Math.min(X0 + p * (X1 - 56 - X0), stop); return { x, y: Y0 + i * DY, at: x >= stop, xo: 18, yo: 0 }; };
    } else {
      // Handy: Tore liegen quer, Namen links, die Codes fallen rechts von oben hindurch
      const cx = (i) => 136 + i * 40, gy = (j) => 84 + j * 58, Y0 = 52, Y1 = gy(GATES.length) + 6;
      W = 360; H = Y1 + 44;
      body = GATES.map((g, j) => `<g class="gate${g.todo ? ' todo' : ''}"><rect x="6" y="${gy(j) - 10}" width="348" height="40" rx="9"/>
        <text x="16" y="${gy(j) + 6}" style="text-anchor:start">${g.t}</text><text class="s" x="16" y="${gy(j) + 21}" style="text-anchor:start">${g.s}</text></g>`).join('')
        + `<g class="gate"><rect x="6" y="${Y1 - 4}" width="348" height="34" rx="8" style="fill:#e3f7ee;stroke:#0e9f6e"/><text x="16" y="${Y1 + 18}" style="text-anchor:start">Vorgang</text></g>`
        + TOKS.map((k, i) => `<line class="track" x1="${cx(i)}" y1="${Y0}" x2="${cx(i)}" y2="${Y1 - 4}"/><g class="tok">
          <text x="${cx(i)}" y="16" style="text-anchor:middle;font-size:10.5px">${k.a}</text><text x="${cx(i)}" y="30" style="text-anchor:middle;font-size:10.5px">${k.b}</text>
          <circle r="8" fill="#2563eb"/><path class="x" d="M-5 -5 L5 5 M5 -5 L-5 5"/></g>`).join('');
      pos = (i, p, k) => { const stop = k.stop === 99 ? Y1 + 13 : gy(k.stop) - 20; const y = Math.min(Y0 + p * (Y1 + 13 - Y0), stop); return { x: cx(i), y, at: y >= stop, xo: 0, yo: -16 }; };
    }
    $('#gates').innerHTML = svg(W, H, body, 'Sicherheitsprüfungen: welcher Scan an welcher Prüfung scheitert');
    const els = [...document.querySelectorAll('#gates .tok')];
    const D = 7000, t0 = performance.now();
    function frame(now) {
      if (run !== gateRun) return;
      const p = Math.min(1, (((now - t0) % D) / D) / 0.82);
      els.forEach((g, i) => {
        const k = TOKS[i], q = pos(i, p, k), blocked = q.at && k.stop !== 99, todo = GATES[k.stop]?.todo;
        const c = g.querySelector('circle');
        c.setAttribute('cx', q.x); c.setAttribute('cy', q.y);
        c.setAttribute('fill', blocked ? (todo ? '#d97706' : '#c0362c') : (k.stop === 99 && q.at ? '#0e9f6e' : '#2563eb'));
        const xx = g.querySelector('.x');
        xx.setAttribute('transform', `translate(${q.x + q.xo} ${q.y + q.yo})`);
        xx.style.opacity = blocked ? 1 : 0;
        if (todo) xx.style.stroke = '#d97706';
      });
      requestAnimationFrame(frame);
    }
    if (still) frame(t0 + D * 0.82); else requestAnimationFrame(frame);
  }

  // --- 5. Sicherheitsmaßnahmen im Überblick -------------------------------------
  const SEC = [
    { t: 'Signierter Inhalt', d: 'HMAC-SHA256 über den gesamten Inhalt. Jede Änderung am QR fällt auf.', w: 'Link-Management', s: 'umgesetzt' },
    { t: 'Versionierung', d: 'Ändert sich ein Betrag, werden alte Ausdrucke ungültig statt falsch zu zahlen.', w: 'Link-Management', s: 'umgesetzt' },
    { t: 'Lebenszyklus', d: 'Aktiv, deaktiviert, abgelaufen, bezahlt oder erledigt. Einmal-Codes schließen sich selbst.', w: 'Link-Management', s: 'umgesetzt' },
    { t: 'Geheimes bleibt in der DB', d: 'Name, Geburtsdatum, Adresse und Kontostand stehen nie im QR-Code.', w: 'Code-Manager', s: 'umgesetzt' },
    { t: 'Anmeldung mit Sperre', d: 'Geburtsdatum, nach 3 Fehlversuchen 15 Minuten gesperrt.', w: 'Link-Management', s: 'umgesetzt' },
    { t: 'Signierte Sitzung', d: '10 Minuten gültig, gebunden an Code und Version. Ohne Sitzung keine persönlichen Daten.', w: 'Link-Management', s: 'umgesetzt' },
    { t: 'Ident mit Vertrauensniveau', d: 'eID, Video oder Bank, je nach Niveau. Danach Abgleich, ob die Person zum Vorgang passt.', w: 'Ident-Dienst', s: 'simuliert' },
    { t: 'Betrag immer aus der DB', d: 'Handy und QR liefern nie den Betrag. Abgleich beim Webhook, Doppelzahlung wird erstattet.', w: 'Zahlungslogik', s: 'umgesetzt' },
    { t: 'Sicherer Upload', d: 'Max. 3 MB, nur PDF/JPG/PNG, SHA-256-Prüfsumme, AES-256-GCM verschlüsselt gespeichert.', w: 'Vorgangslogik', s: 'umgesetzt' },
    { t: 'Webhook idempotent', d: 'Ein Ergebnis zählt genau einmal. Die Signaturprüfung des Anbieters ist simuliert.', w: 'Zahlungslogik', s: 'simuliert' },
    { t: 'Statuslog je Code', d: 'Jeder Schritt mit Zeit und Komponente, im Manager live einsehbar.', w: 'Link-Management', s: 'umgesetzt' },
    { t: 'Schlüsselrotation', d: 'Schlüssel-ID im Token, mehrere Schlüssel parallel gültig. Gedruckte Codes überleben den Wechsel.', w: 'Link-Management', s: 'Skizze' },
    { t: 'Rate-Limits und Bot-Schutz', d: 'Begrenzung je IP und Code, CAPTCHA nach Fehlversuchen, Alarm bei Ausreißern.', w: 'Link-Management', s: 'Skizze' },
    { t: 'Schutz vor Quishing', d: 'Feste, auf dem Brief gedruckte Domain. Gefälschte Aufkleber führen auf fremde Seiten.', w: 'Organisation', s: 'Skizze' },
    { t: 'Löschfristen und Audit', d: 'Dokumente und Logs mit Aufbewahrungsregeln, revisionssicheres Protokoll.', w: 'Übergabe Fachsystem', s: 'Skizze' },
  ];
  const lock = '<svg width="18" height="20" viewBox="-9 -10 18 20" aria-hidden="true"><path d="M0 -8 L7 -5 V0 C7 5 4 8 0 9.5 C-4 8 -7 5 -7 0 V-5 Z" fill="currentColor"/></svg>';
  $('#sec-grid').innerHTML = SEC.map((x) => `<div class="sec-card${x.s === 'Skizze' ? ' todo' : ''}"><h4 style="color:${x.s === 'Skizze' ? '#d97706' : '#0e9f6e'}">${lock}<span style="color:var(--ink)">${x.t}</span></h4>
    <p>${x.d}</p><div class="meta"><span class="chip-c">${x.w}</span><span class="${x.s === 'Skizze' ? 'chip-t' : x.s === 'simuliert' ? 'chip-c' : 'chip-s'}">${x.s}</span></div></div>`).join('');

  // --- 6. Tech-Skizzen ------------------------------------------------------------
  // Leicht schiefe Kästen wirken wie von Hand gezeichnet
  const wob = (i) => [-0.8, 0.6, -0.4, 0.9, -0.6, 0.5][i % 6];
  const skb = (i, x, y, w, h, t, s = '', cls = '') => `<g transform="rotate(${wob(i)} ${x + w / 2} ${y + h / 2})"><rect class="skb ${cls}" x="${x}" y="${y}" width="${w}" height="${h}" rx="${cls.includes('db') ? 14 : 8}"/>
    <text class="skt" x="${x + w / 2}" y="${h > 70 ? y + 28 : y + (s ? h / 2 - 2 : h / 2 + 6)}">${t}</text>${s ? `<text class="sks" x="${x + w / 2}" y="${y + h / 2 + 16}">${s}</text>` : ''}</g>`;
  const skw = (d, x1, y1, x2, y2, cls = '') => `<path class="skw ${cls}" d="${d}"/>${head(x1, y1, x2, y2, cls, 10)}`;
  const note = (x, y, t, anchor = 'start') => `<text class="skn" x="${x}" y="${y}" text-anchor="${anchor}">${t}</text>`;
  const skStyle = '<style>.ah{fill:#334155}.ah.hot{fill:#d97706}.ah.bad{fill:#c0362c}</style>';
  const dot = (d, dur, begin = 0) => motion(d, dur, begin, 'todo', 4);

  const SKETCHES = [
    { t: 'Übergabe ans Fachsystem', why: 'Ein Vorgang ist erst fertig, wenn das Fachsystem ihn verbucht hat. Genau einmal, auch bei Ausfall.',
      svg: svg(520, 230, `${skStyle}
        ${skb(0, 10, 30, 120, 56, 'Vorgang', 'abgeschlossen')}${skb(1, 180, 30, 130, 56, 'Outbox', 'in derselben DB', 'db')}
        ${skb(2, 360, 30, 140, 56, 'Fachsystem', 'API', 'hot')}${skb(3, 180, 150, 130, 50, 'Dead Letter', '', 'hot')}
        ${skw('M130 58 H178', 130, 58, 178, 58)}${skw('M310 50 H358', 310, 50, 358, 50, 'hot')}${skw('M358 72 H312', 358, 72, 312, 72, 'hot')}
        ${note(318, 92, 'Quittung')}${note(318, 24, 'Worker sendet')}
        ${skw('M245 88 C 210 125 280 125 250 100', 280, 115, 250, 100, 'bad')}${note(282, 128, 'Fehler: 1 m, 5 m, 1 h …')}
        ${skw('M245 128 V148', 245, 128, 245, 148, 'bad')}${note(316, 182, '→ Support-Konsole')}
        ${note(10, 120, 'Idempotenz-')}${note(10, 138, 'Schlüssel je')}${note(10, 156, 'Vorgang')}
        ${dot('M130 58 H178', 1.2)}${dot('M310 50 H358', 1.4, 0.6)}`, 'Skizze Übergabe mit Outbox'),
      list: ['Outbox-Eintrag entsteht in derselben Transaktion wie der Vorgang', 'Nachtlauf gleicht alle Vorgänge mit den Quittungen ab'] },
    { t: 'Massenerzeugung und Druck', why: 'Codes entstehen nicht per Hand, sondern zu Tausenden für einen Briefversand.',
      svg: svg(520, 230, `${skStyle}
        ${skb(0, 10, 20, 140, 56, 'Fachverfahren', 'CSV oder API')}${skb(1, 200, 20, 130, 56, 'Batch-Job', 'idempotent', 'hot')}${skb(2, 380, 20, 130, 56, 'Codes', 'Datenbank', 'db')}
        ${skb(3, 200, 140, 130, 56, 'Druckdaten', 'PDF, Druckstraße', 'hot')}${skb(4, 380, 140, 130, 56, 'Versand', 'Brief')}
        ${skw('M150 48 H198', 150, 48, 198, 48)}${skw('M330 48 H378', 330, 48, 378, 48)}${skw('M265 78 V138', 265, 78, 265, 138, 'hot')}${skw('M330 168 H378', 330, 168, 378, 168)}
        ${note(30, 120, 'Vorschau und')}${note(30, 138, 'Freigabe vor')}${note(30, 156, 'dem Druck!')}${skw('M120 140 C150 150 170 160 196 162', 170, 160, 196, 162, 'hot')}
        ${dot('M150 48 H198', 1)}${dot('M265 78 V138', 1.2, 0.5)}${dot('M330 168 H378', 1, 0.9)}`, 'Skizze Massenerzeugung'),
      list: ['Briefnummer als Idempotenz-Schlüssel: ein zweiter Lauf erzeugt keine Dubletten', 'Testdruck klärt die Mindestgröße des QR-Codes'] },
    { t: 'Schlüsselrotation', why: 'Codes liegen Monate gedruckt herum. Ein Schlüsselwechsel darf sie nicht ungültig machen.',
      svg: svg(520, 230, `${skStyle}
        ${note(10, 30, 'Token trägt die Schlüssel-ID: { kid: "k2", … }.sig')}
        ${['k1', 'k2', 'k3'].map((k, i) => `<text class="skt" x="30" y="${82 + i * 46}">${k}</text>`).join('')}
        <rect class="skb" x="60" y="62" width="150" height="28" rx="6"/><rect class="skb db" x="210" y="62" width="160" height="28" rx="6"/><rect class="skb hot" x="370" y="62" width="130" height="28" rx="6" style="fill:#fdecea;stroke:#c0362c"/>
        <rect class="skb" x="210" y="108" width="160" height="28" rx="6"/><rect class="skb db" x="370" y="108" width="130" height="28" rx="6"/>
        <rect class="skb" x="370" y="154" width="130" height="28" rx="6"/>
        ${note(135, 82, 'signiert', 'middle')}${note(290, 82, 'prüft nur', 'middle')}${note(435, 82, 'gesperrt', 'middle')}
        ${note(290, 128, 'signiert', 'middle')}${note(435, 128, 'prüft nur', 'middle')}${note(435, 174, 'signiert', 'middle')}
        <path class="skw hot" d="M60 205 H500"/>${head(60, 205, 500, 205, 'hot', 10)}${note(60, 224, 'Zeit: Laufzeit der Briefe bestimmt, wie lange „prüft nur“ gilt')}`, 'Skizze Schlüsselrotation'),
      list: ['Schlüssel im Key-Management, nicht in der Umgebung', 'Notfall: einzelnen Schlüssel sperren, betroffene Codes neu ausstellen'] },
    { t: 'Support-Konsole', why: 'Der häufigste Anruf wird „Der Code geht nicht“ sein. Die Hotline braucht die Antwort in Klartext.',
      svg: svg(520, 230, `${skStyle}
        ${skb(0, 10, 20, 120, 56, 'Hotline', 'Anruf')}${skb(1, 180, 20, 150, 56, 'Suche', 'Kd-Nr. oder Brief')}
        ${skb(2, 180, 120, 320, 90, 'Klartext-Diagnose', '', 'hot')}
        ${note(200, 172, '„veraltet seit 3.11., neuer Brief unterwegs“')}${note(200, 194, '„gesperrt bis 14:20 nach 3 Fehlversuchen“')}
        ${skb(3, 380, 20, 130, 56, 'Aktionen', 'entsperren, neu')}
        ${skw('M130 48 H178', 130, 48, 178, 48)}${skw('M255 78 V118', 255, 78, 255, 118, 'hot')}${skw('M440 118 V78', 440, 118, 440, 78, 'hot')}
        ${note(10, 120, 'liest den')}${note(10, 138, 'Statuslog,')}${note(10, 156, 'den es')}${note(10, 174, 'schon gibt')}
        ${dot('M130 48 H178', 1)}${dot('M255 78 V118', 1, 0.5)}`, 'Skizze Support-Konsole'),
      list: ['Rollen: Hotline sieht Status, aber keine Dokumente', 'Jede Aktion der Hotline landet selbst im Statuslog'] },
    { t: 'Signierter Inhalt oder Kurzlink', why: 'Die Entscheidung bestimmt Größe des Codes, Datenschutz und ob ein Scan ohne Datenbank prüfbar ist.',
      svg: svg(520, 230, `${skStyle}${(() => {
        const qr = (x, y, n, size, seed) => {
          let r = seed, out = `<rect class="skb" x="${x - 6}" y="${y - 6}" width="${size + 12}" height="${size + 12}" rx="6"/>`;
          const m = size / n;
          for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
            r = (r * 1103515245 + 12345) & 0x7fffffff;
            const corner = (i < 7 && j < 7) || (i >= n - 7 && j < 7) || (i < 7 && j >= n - 7);
            const ring = corner && (i % (n - 7) === 0 || i % (n - 7) === 6 || j % (n - 7) === 0 || j % (n - 7) === 6 || ((i % (n - 7)) > 1 && (i % (n - 7)) < 5 && (j % (n - 7)) > 1 && (j % (n - 7)) < 5));
            if (corner ? ring : r % 100 < 48) out += `<rect x="${(x + i * m).toFixed(1)}" y="${(y + j * m).toFixed(1)}" width="${m.toFixed(2)}" height="${m.toFixed(2)}" fill="#1e293b"/>`;
          }
          return out;
        };
        return qr(40, 24, 45, 130, 7) + qr(330, 44, 25, 90, 3);
      })()}
        ${note(105, 182, 'signiert: ~250 Zeichen', 'middle')}${note(105, 200, 'offline prüfbar, Daten lesbar', 'middle')}${note(105, 218, 'dicht, braucht mehr Platz', 'middle')}
        ${note(375, 162, 'Kurzlink /k/7KQ2', 'middle')}${note(375, 180, 'klein, nichts lesbar', 'middle')}${note(375, 198, 'braucht Lookup in der DB', 'middle')}
        <text class="skt" x="250" y="100" style="font-size:30px">vs.</text>`, 'Skizze signierter Inhalt gegen Kurzlink'),
      list: ['POC: beide Varianten in echter Briefgröße drucken und mit alten Handys scannen', 'Mischform: Kurzlink plus Signatur über die Referenz'] },
    { t: 'Missbrauch und Quishing', why: 'Gefälschte Aufkleber und Bots, die Codes durchprobieren, sind beim Papier-QR realistische Angriffe.',
      svg: svg(520, 230, `${skStyle}
        ${skb(0, 10, 30, 110, 56, 'Scan', '')}${skb(1, 170, 30, 150, 56, 'Rate-Limit', 'je IP und Code', 'hot')}${skb(2, 370, 30, 130, 56, 'Link-Mgmt', 'Prüfungen')}
        ${skb(3, 170, 140, 150, 56, 'fremde Domain', 'gefälschter Aufkleber', 'hot')}
        ${skw('M120 58 H168', 120, 58, 168, 58)}${skw('M320 58 H368', 320, 58, 368, 58)}${skw('M70 88 C70 150 120 168 168 168', 120, 166, 168, 168, 'bad')}
        ${note(340, 160, 'Gegenmittel:')}${note(340, 178, 'Domain auf den Brief,')}${note(340, 196, 'Hinweis „nur …de“,')}${note(340, 214, 'Meldestelle')}
        ${dot('M120 58 H168', 1)}${dot('M320 58 H368', 1, 0.5)}`, 'Skizze Missbrauchsschutz'),
      list: ['CAPTCHA erst nach Fehlversuchen, damit normale Kunden nichts merken', 'Alarm, wenn ein Code ungewöhnlich oft gescannt wird'] },
  ];
  // Handy: jede Skizze als senkrechte Kette, Notizen rechts daneben
  const MOBILE_SK = [
    [['Vorgang', 'abgeschlossen'], ['Outbox', 'in derselben DB', 'db', ['Idempotenz-', 'Schlüssel']], ['Worker', 'sendet', 'hot', ['Fehler: 1 m,', '5 m, 1 h …']],
      ['Fachsystem', 'API', 'hot', ['Quittung', 'zurück']], ['Dead Letter', '', 'hot', ['→ Support-', 'Konsole']]],
    [['Fachverfahren', 'CSV oder API'], ['Batch-Job', 'idempotent', 'hot', ['Briefnummer', 'als Schlüssel']], ['Codes', 'Datenbank', 'db'],
      ['Vorschau', 'Freigabe', 'hot', ['vor dem', 'Druck!']], ['Druckdaten', 'PDF, Druckstraße', 'hot'], ['Versand', 'Brief']],
    [['Token mit kid', '{ kid: "k2", … }', 'hot'], ['k1 signiert', 'Briefe gehen raus'], ['k2 signiert', 'k1 prüft nur noch', 'db', ['alte Briefe', 'bleiben gültig']],
      ['k1 gesperrt', 'nach Laufzeit der Briefe', 'hot', ['Notfall:', 'sofort sperren']]],
    [['Hotline', 'Anruf'], ['Suche', 'Kd-Nr. oder Brief'], ['Klartext-Diagnose', '„veraltet seit 3.11.“', 'hot', ['liest den', 'Statuslog']], ['Aktionen', 'entsperren, neu', 'hot', ['landet selbst', 'im Statuslog']]],
    null,
    [['Scan', ''], ['Domain-Check', 'nur eigene Domain', 'hot', ['gefälschter', 'Aufkleber ✗']], ['Rate-Limit', 'je IP und Code', 'hot', ['CAPTCHA nach', 'Fehlversuchen']], ['Link-Mgmt', 'Prüfungen']],
  ];
  const sketchMobile = (spec, i) => {
    if (!spec) {
      // Kurzlink gegen signierten Inhalt: beide Codes untereinander
      const d = SKETCHES[i].svg;
      const inner = d.slice(d.indexOf('>') + 1, d.lastIndexOf('</svg>'));
      return `<svg viewBox="0 0 520 230" role="img" aria-label="Skizze signierter Inhalt gegen Kurzlink" style="transform:scale(1)">${inner}</svg>`;
    }
    const W = 196, Hh = 54, G = 34, X = 14;
    let out = skStyle;
    spec.forEach(([t, sub, cls, notes], j) => {
      const y = 8 + j * (Hh + G);
      out += skb(j, X, y, W, Hh, t, sub, cls || '');
      (notes || []).forEach((n, k) => { out += note(X + W + 18, y + 22 + k * 18, n); });
      if (j < spec.length - 1) {
        const y1 = y + Hh + 2, y2 = y + Hh + G - 2, hot = (spec[j + 1][2] || '').includes('hot') ? 'hot' : '';
        out += skw(`M${X + W / 2} ${y1} V${y2}`, X + W / 2, y1, X + W / 2, y2, hot) + dot(`M${X + W / 2} ${y1} V${y2}`, 1, j * 0.4);
      }
    });
    return svg(360, 16 + spec.length * (Hh + G) - G, out, `Skizze ${SKETCHES[i].t}`);
  };
  function sketches(m) {
    $('#sketches').innerHTML = SKETCHES.map((k, i) => `<article class="sk"><span class="stamp">Skizze</span><h3>${k.t}</h3><p class="why">${k.why}</p>${m ? sketchMobile(MOBILE_SK[i], i) : k.svg}
      <ul>${k.list.map((l) => `<li>${l}</li>`).join('')}</ul></article>`).join('');
  }

  function renderAll() {
    mobile = mq.matches;
    document.body.classList.toggle('m', mobile);
    $('#hero').innerHTML = mobile ? heroMobile() : heroDesktop();
    $('#map').innerHTML = mobile ? mapMobile() : mapDesktop();
    gates(mobile);
    sketches(mobile);
    drawSeq(); show();
  }
  renderAll();
  mq.addEventListener('change', renderAll);
})();
