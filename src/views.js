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
${scripts.map((s) => `<script src="/static/${s}"></script>`).join('\n')}
</body>
</html>`;

const SIM_BADGE = '<div class="sim-badge" title="Keine echte Zahlung">Simulation</div>';

function manager() {
  return page('QR-Pay Simulation', 'manager', `
<header class="top">
  <div class="brand"><span class="logo" aria-hidden="true"></span><div><strong>QR-Pay</strong><small>Simulation · keine echten Zahlungen</small></div></div>
  <div class="top-meta" id="meta"></div>
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
          <button data-f="alle" class="on">Alle</button><button data-f="aktiv">Aktiv</button><button data-f="bezahlt">Bezahlt</button><button data-f="deaktiviert">Deaktiviert</button>
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
      <div class="log-legend"><span class="a-manager">Manager</span><span class="a-handy">Handy</span><span class="a-server">Server</span><span class="a-anbieter">Anbieter</span></div>
      <ol id="sim-log" class="log"></ol>
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
  return page('Bezahlen', 'mobile', `${SIM_BADGE}<main id="app" class="m-wrap" data-token="${esc(token)}"></main>`, ['pay.js']);
}

function provider(method, payment, code) {
  const cfg = { method: method.id, name: method.name, payment, merchant: 'Muster GmbH', customer: code?.vars?.kundennummer, zweck: code?.vars?.zweck };
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
      ${code?.vars?.zweck ? `<dt>Zweck</dt><dd>${esc(code.vars.zweck)}</dd>` : ''}
      <dt>Beleg-Nr.</dt><dd class="mono">${esc(p.id)}</dd>
      <dt>Anbieter-Ref.</dt><dd class="mono">${esc(p.providerRef)}</dd>
      <dt>Zeitpunkt</dt><dd>${when}</dd>
    </dl>
  </section>
  <button class="btn block" onclick="window.print()">Beleg speichern / drucken</button>
  <p class="fine">Eine Bestätigung wurde an Kunde ${kdnr(code?.vars?.kundennummer)} gesendet (simuliert).</p>
  ` : `
  <div class="r-amount"><span>Offen</span><strong>${eur(p.total)}</strong></div>
  <a class="btn block" href="/s/${esc(token)}">Erneut versuchen</a>
  <p class="fine">Der Code bleibt gültig. Du kannst eine andere Zahlart wählen.</p>`}
</main>`);
}

function message(title, text) {
  return page(title, 'mobile', `<main class="m-wrap result"><div class="status-icon err" aria-hidden="true"></div><h1 class="r-title">${esc(title)}</h1><p class="r-text">${esc(text)}</p></main>`);
}

module.exports = { manager, pay, provider, result, message };
