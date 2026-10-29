// HTML-Seiten. Interaktion liegt in public/*.js, Gestaltung in public/style.css
const { eur, esc, kdnr } = require('./format');

const page = (title, bodyClass, body, scripts = []) => `<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0f1b2d">
<title>${esc(title)}</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='7' fill='%230f1b2d'/><path d='M8 8h6v6H8zM18 8h6v6h-6zM8 18h6v6H8zM19 19h2v2h-2zM22 22h2v2h-2zM19 23h2v1h-2z' fill='%2334d399'/></svg>">
<link rel="stylesheet" href="/static/style.css">
</head>
<body class="${bodyClass}">
${body}
${/\bmobile\b/.test(bodyClass) && !/\bprov\b/.test(bodyClass) && !/\binfo\b/.test(bodyClass) ? '<footer class="m-foot"><a href="/info">So funktioniert QR-Pay</a></footer>' : ''}
${scripts.map((s) => `<script src="/static/${s}"></script>`).join('\n')}
</body>
</html>`;

const SIM_BADGE = '<div class="sim-badge" title="Keine echte Zahlung">Simulation</div>';

function manager() {
  return page('QR-Pay Simulation', 'manager', `
<header class="top">
  <div class="brand"><span class="logo" aria-hidden="true"></span><div><strong>QR-Pay</strong><small>Simulation · keine echten Zahlungen</small></div></div>
  <div class="top-meta"><a href="/hilfe">Hilfe</a><a href="/info">So funktioniert's</a><span id="meta"></span></div>
</header>

<main class="wrap">
  <section class="intro">
    <h1>Bezahlen per QR-Code, die ganze Strecke zum Durchklicken</h1>
    <p><b>Service 1</b>, der QR-Code-Manager, legt Codes mit Variablen in der Datenbank an. Die Code-ID beginnt mit der Code-Art.
       <b>Service 2</b> ist der Bezahl-Usecase: Ein PAY-Code trägt Kundennummer, Betrag und Gebühr signiert in sich.
       Scanne ihn mit dem Handy oder starte die Simulation.</p>
    <ol class="chain" aria-label="Ablauf">
      <li><span>1</span>Code anlegen</li>
      <li><span>2</span>Scannen</li>
      <li><span>3</span>Decoding &amp; Prüfung</li>
      <li><span>4</span>Zahlart wählen</li>
      <li><span>5</span>Checkout beim Anbieter</li>
      <li><span>6</span>Webhook &amp; Verbuchung</li>
      <li><span>7</span>Bestätigung</li>
    </ol>
  </section>

  <div class="grid">
    <section class="card" id="create-card">
      <h2>Neuen Code anlegen</h2>
      <form id="create-form" class="form" novalidate></form>
    </section>

    <section class="card codes-card">
      <div class="card-head">
        <h2>Codes</h2>
        <div class="filters" role="tablist" id="filters">
          <button data-f="alle" class="on">Alle</button><button data-f="aktiv">Aktiv</button><button data-f="bezahlt">Erledigt</button><button data-f="deaktiviert">Deaktiviert</button>
        </div>
      </div>
      <div id="codes" class="codes"><p class="empty">Lade …</p></div>
    </section>
  </div>

  <section class="card types">
    <h2>Code-Arten</h2>
    <div id="types" class="type-list"></div>
  </section>
</main>

<dialog id="dlg-sim" class="dlg sim">
  <div class="sim-layout">
    <div class="phone-col">
      <div class="phone"><div class="phone-notch"></div><iframe id="sim-frame" title="Handy-Simulation"></iframe></div>
      <div class="phone-actions"><button class="btn ghost sm" id="sim-restart">Neu scannen</button><a class="btn ghost sm" id="sim-open" target="_blank" rel="noopener">Im neuen Tab</a></div>
    </div>
    <div class="log-col">
      <div class="log-head"><div><h3 id="sim-title">Simulation</h3><small id="sim-sub"></small></div><button class="x" data-close aria-label="Schließen">×</button></div>
      <div class="log-legend legend-old"><span class="a-manager">Manager</span><span class="a-handy">Handy</span><span class="a-server">Server</span><span class="a-anbieter">Anbieter</span></div>
      <div class="log-tools"><label class="check"><input type="checkbox" id="filter-on"> Filter an</label><button type="button" class="btn ghost sm" id="log-copy" hidden>Kopieren</button></div>
      <div id="sim-filter" class="log-filter" hidden></div>
      <ol id="sim-log" class="log"></ol>
      <div id="sim-subs" class="pay-hist"></div>
      <div id="sim-payments" class="pay-hist"></div>
    </div>
  </div>
</dialog>

<dialog id="dlg-qr" class="dlg narrow">
  <div class="log-head"><div><h3 id="qr-title">QR-Code</h3><small id="qr-sub"></small></div><button class="x" data-close aria-label="Schließen">×</button></div>
  <img id="qr-img" class="qr-big" alt="QR-Code">
  <p class="hint" id="qr-hint"></p>
  <details class="token"><summary>Was steht im Code?</summary><pre id="qr-token"></pre></details>
  <div class="row"><button class="btn sm" id="qr-copy">Link kopieren</button><a class="btn ghost sm" id="qr-open" target="_blank" rel="noopener">Öffnen</a></div>
</dialog>

<dialog id="dlg-edit" class="dlg narrow">
  <div class="log-head"><div><h3>Code bearbeiten</h3><small id="edit-sub"></small></div><button class="x" data-close aria-label="Schließen">×</button></div>
  <p class="hint warn">Werden Betrag, Gebühr oder Kundennummer geändert, bekommt der Code eine neue Version. Bereits gedruckte QR-Codes werden dann beim Scan abgelehnt.</p>
  <form id="edit-form" class="form" novalidate></form>
</dialog>

<div id="toast" class="toast" role="status"></div>
`, ['manager.js']);
}

function pay(token) {
  return page('QR-Code', 'mobile', `${SIM_BADGE}<main id="app" class="m-wrap" data-token="${esc(token)}"></main>`, ['flows.js', 'pay.js']);
}

function provider(method, payment, code) {
  const cfg = { method: method.id, name: method.name, payment, merchant: 'Muster GmbH', customer: code?.vars?.kundennummer, zweck: code?.vars?.zweck || (code?.type === 'KONTO' ? 'Ausgleich Kundenkonto' : undefined) };
  return page(`${method.name} · Checkout`, `mobile prov prov-${method.id}`,
    `${SIM_BADGE}<main id="app" class="m-wrap"></main><script>window.CHECKOUT=${JSON.stringify(cfg).replace(/</g, '\\u003c')}</script>`, ['provider.js']);
}

const STATUS_TEXT = {
  bezahlt: ['ok', 'Zahlung erfolgreich', 'Vielen Dank! Deine Zahlung ist eingegangen.'],
  abgebrochen: ['warn', 'Zahlung abgebrochen', 'Du hast die Zahlung beim Anbieter abgebrochen. Es wurde nichts abgebucht.'],
  abgelehnt: ['err', 'Zahlung abgelehnt', 'Der Anbieter hat die Zahlung abgelehnt. Es wurde nichts abgebucht.'],
  zeitüberschreitung: ['warn', 'Zeit abgelaufen', 'Vom Anbieter kam keine Rückmeldung. Es wurde nichts abgebucht.'],
  gestartet: ['wait', 'Zahlung läuft', 'Die Zahlung ist noch nicht abgeschlossen.'],
};

function result(p, code, token) {
  const [tone, title, text] = STATUS_TEXT[p.status] || STATUS_TEXT.gestartet;
  const ok = p.status === 'bezahlt';
  const when = new Date(p.updatedAt).toLocaleString('de-DE', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/Berlin' });
  return page(title, 'mobile', `${SIM_BADGE}
<main class="m-wrap result">
  <div class="merchant-bar"><span class="m-logo">M</span><span>Muster GmbH</span></div>
  <div class="status-icon ${tone}" aria-hidden="true"></div>
  <h1 class="r-title">${title}</h1>
  <p class="r-text">${esc(p.reason || text)}</p>
  ${ok ? `
  <section class="receipt" id="receipt">
    <h2>Zahlungsbeleg</h2>
    <dl>
      <dt>Betrag</dt><dd>${eur(p.amount)}</dd>
      <dt>Gebühr</dt><dd>${eur(p.fee)}</dd>
      <dt class="sum">Bezahlt</dt><dd class="sum">${eur(p.total)}</dd>
      <dt>Zahlart</dt><dd>${esc(p.methodName)}</dd>
      <dt>Kundennummer</dt><dd class="mono">${kdnr(code?.vars?.kundennummer)}</dd>
      ${code?.vars?.zweck ? `<dt>Zweck</dt><dd>${esc(code.vars.zweck)}</dd>` : code?.type === 'KONTO' ? '<dt>Zweck</dt><dd>Ausgleich Kundenkonto</dd>' : ''}
      <dt>Beleg-Nr.</dt><dd class="mono">${esc(p.id)}</dd>
      <dt>Anbieter-Ref.</dt><dd class="mono">${esc(p.providerRef)}</dd>
      <dt>Zeitpunkt</dt><dd>${when}</dd>
    </dl>
  </section>
  <button class="btn block" onclick="window.print()">Beleg speichern / drucken</button>
  ${code?.type === 'KONTO' ? `<a class="btn block ghost" style="margin-top:8px" href="/s/${esc(token)}">Zum Kundenkonto</a>` : ''}
  <p class="fine">Eine Bestätigung wurde an Kunde ${kdnr(code?.vars?.kundennummer)} gesendet (simuliert).</p>
  ` : `
  <div class="r-amount"><span>Offen</span><strong>${eur(p.total)}</strong></div>
  <a class="btn block" href="/s/${esc(token)}">Erneut versuchen</a>
  <p class="fine">Der Code bleibt gültig. Du kannst eine andere Zahlart wählen.</p>`}
</main>`);
}

function info() {
  return page('So funktioniert QR-Pay', 'mobile info', `${SIM_BADGE}
<main class="m-wrap info-page">
  <div class="merchant-bar"><span class="m-logo">M</span><span>QR-Pay · Muster GmbH</span></div>
  <h1>So funktioniert QR-Pay</h1>
  <p class="lead">Rechnung bekommen, QR-Code scannen, Zahlart wählen, fertig. Kein Abtippen von IBAN oder Kundennummer.</p>

  <h2>In 4 Schritten bezahlt</h2>
  <ol class="howto">
    <li><b>Scannen.</b> Öffne die Kamera und richte sie auf den QR-Code auf deiner Rechnung.</li>
    <li><b>Prüfen.</b> Du siehst Kundennummer, Betrag, Gebühr und den Endbetrag. Der Code wird vorher auf Echtheit geprüft.</li>
    <li><b>Zahlart wählen.</b> PayPal, Wero, Banking-App, Kreditkarte, Apple Pay, Google Pay, Klarna oder SEPA-Lastschrift.</li>
    <li><b>Bestätigen.</b> Du gibst die Zahlung bei deinem Anbieter frei und bekommst sofort einen Beleg.</li>
  </ol>

  <h2>Ist das sicher?</h2>
  <ul class="facts">
    <li><b>Fälschungssicher:</b> Jeder Code ist digital signiert. Wird der Betrag verändert, lehnen wir den Code ab.</li>
    <li><b>Immer aktuell:</b> Ändert sich eine Rechnung, werden alte Codes ungültig.</li>
    <li><b>Keine doppelte Zahlung:</b> Ein bezahlter Code zeigt beim nächsten Scan nur noch den Beleg.</li>
    <li><b>Deine Bankdaten bleiben beim Anbieter.</b> Wir sehen nur, dass bezahlt wurde.</li>
  </ul>

  <h2>Was ist die Gebühr?</h2>
  <p>Die Gebühr ist eine Servicegebühr des Rechnungsstellers. Sie steht fest im Code und ist für jede Zahlart gleich hoch. Für die Wahl der Zahlart zahlst du nichts extra.</p>

  <h2>Etwas hat nicht geklappt?</h2>
  <ul class="facts">
    <li><b>Abgebrochen oder abgelehnt:</b> Es wurde nichts abgebucht. Scanne den Code erneut und wähle eine andere Zahlart.</li>
    <li><b>„Code veraltet“ oder „deaktiviert“:</b> Bitte frag beim Rechnungssteller nach einem neuen Code.</li>
    <li><b>„Bereits bezahlt“:</b> Alles erledigt, den Beleg findest du direkt dort.</li>
  </ul>

  <h2>Was geht noch per QR-Code?</h2>
  <ul class="facts">
    <li><b>Kontostand abfragen:</b> Nach Eingabe deines Geburtsdatums siehst du deinen Kontostand und kannst Offenes direkt ausgleichen.</li>
    <li><b>Adresse ändern:</b> Neue Anschrift eingeben, fertig. Keine Formulare, kein Porto.</li>
    <li><b>Dokumente sicher einreichen:</b> Zum Beispiel eine Befreiungsbescheinigung. Vorher bestätigst du deine Identität mit Online-Ausweis, Video- oder Bank-Ident.</li>
  </ul>
  <p>Geburtsdatum, Adresse und Kontostand stehen nie im QR-Code selbst. Wer nur ein Foto deines Codes hat, sieht davon nichts.</p>

  <div class="note-box"><b>Hinweis:</b> Dies ist eine Simulation. Es wird kein echtes Geld bewegt, alle Anbieter-Seiten sind nachgebaut.</div>

  <a class="btn block" href="/" target="_top">Simulation ausprobieren</a>
  <button class="btn block ghost" type="button" onclick="history.length > 1 ? history.back() : (location.href = '/')">Zurück</button>
</main>`);
}

function help() {
  return page('QR-Vorgänge · Konzept', 'help', `
<link rel="stylesheet" href="/static/help.css">
<header class="top">
  <div class="brand"><a href="/" class="logo" aria-label="Zum Manager"></a><div><strong>QR-Vorgänge</strong><small>Konzept des Services</small></div></div>
  <nav class="top-meta h-nav"><a href="/">Zum Manager</a></nav>
</header>
<main class="h-wrap">
  <section class="h-sec">
    <h1>QR-Vorgänge</h1>
    <p class="h-text">Ein QR-Code verweist auf einen Vorgang. Der Service prüft den Code, regelt den Zugang je nach Code-Art und führt den Vorgang aus.</p>
  </section>
  <section class="h-sec">
    <h2>Komponenten</h2>
    <div class="h-legend"><span class="lg own">Eigenentwicklung</span><span class="lg ext">Externer Dienst</span><span class="lg todo">Nicht gebaut</span></div>
    <div id="map"></div>
  </section>
  <section class="h-sec">
    <h2>Prüfungen je Code-Art</h2>
    <div class="mx-wrap"><table class="mx" id="matrix"></table></div>
  </section>
  <section class="h-sec">
    <h2>Abläufe</h2>
    <div class="flow-tabs" id="flow-tabs" role="tablist"></div>
    <div class="flow-box">
      <div id="seq"></div>
      <aside class="flow-side" aria-live="polite">
        <div class="fs-count" id="fs-count"></div>
        <div class="fs-title" id="fs-title"></div>
        <div id="fs-chips" class="fs-chips"></div>
        <div class="fs-ctrl">
          <button type="button" id="fs-prev" aria-label="Zurück">‹</button>
          <button type="button" id="fs-play" aria-label="Pause">Ⅱ</button>
          <button type="button" id="fs-next" aria-label="Weiter">›</button>
        </div>
      </aside>
    </div>
  </section>
  <section class="h-sec">
    <h2>Nicht gebaut</h2>
    <div class="sk-list" id="sketches"></div>
  </section>
</main>`, ['help.js']);
}

function message(title, text) {
  return page(title, 'mobile info', `<main class="m-wrap result"><div class="status-icon err" aria-hidden="true"></div><h1 class="r-title">${esc(title)}</h1><p class="r-text">${esc(text)}</p>
  <p class="r-text">Bitte scanne den QR-Code erneut. Klappt es weiterhin nicht, wende dich an den Rechnungssteller.</p>
  <a class="btn block" href="/info">So funktioniert QR-Pay</a></main>`);
}

module.exports = { manager, pay, provider, result, message, info, help };
