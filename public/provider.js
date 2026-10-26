// Simulierter Checkout beim Zahlungsanbieter. Jeder Anbieter hat seine eigenen Schritte.
(() => {
  const C = window.CHECKOUT;
  const app = document.getElementById('app');
  const p = C.payment;
  const eur = (c) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(c / 100);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const post = (url, data) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }).then((r) => r.json());
  const note = (text) => post(`/api/anbieter/${p.id}/schritt`, { text }).catch(() => {});
  let outcome = 'success';
  let busy = false;

  const WORD = {
    paypal: '<b style="color:#003087">Pay</b><b style="color:#0079c1">Pal</b>', wero: '<b>wero</b>', bank: '<b>Banking</b>', card: '<b>SecurePay</b> <small>Kartenzahlung</small>',
    applepay: '<b>Pay</b>', googlepay: '<b>G Pay</b>', klarna: '<b>Klarna.</b>', sepa: '<b>SEPA</b> <small>Lastschrift</small>',
  };

  function frame(inner) {
    app.innerHTML = `
      <header class="p-head"><div class="p-word">${WORD[C.method]}</div><button class="p-cancel" id="cancel">Abbrechen</button></header>
      <div class="p-amount"><small>${esc(C.merchant)}</small><strong>${eur(p.total)}</strong><small>inkl. ${eur(p.fee)} Gebühr · Ref. ${esc(p.id)}</small></div>
      <section class="p-body">${inner}</section>
      <details class="testcase"><summary>Testfall: <b id="tc-label">Erfolg</b></summary>
        <div class="tc-opts">
          <label><input type="radio" name="tc" value="success" ${outcome === 'success' ? 'checked' : ''}> Erfolg</label>
          <label><input type="radio" name="tc" value="declined" ${outcome === 'declined' ? 'checked' : ''}> Ablehnen (z. B. Limit überschritten)</label>
          <label><input type="radio" name="tc" value="timeout" ${outcome === 'timeout' ? 'checked' : ''}> Keine Antwort (Timeout)</label>
        </div>
        <small>Wirkt beim letzten Schritt. Abbrechen geht oben rechts.</small>
      </details>`;
    const labels = { success: 'Erfolg', declined: 'Ablehnen', timeout: 'Timeout' };
    document.getElementById('tc-label').textContent = labels[outcome];
    app.querySelectorAll('input[name=tc]').forEach((r) => r.onchange = () => { outcome = r.value; document.getElementById('tc-label').textContent = labels[outcome]; });
    document.getElementById('cancel').onclick = () => finish('cancel', 'Vom Kunden abgebrochen');
  }

  const on = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = (e) => { e.preventDefault(); if (!busy) fn(); }; };

  async function finish(result, reason) {
    if (busy) return;
    busy = true;
    if (result === 'cancel') {
      app.querySelector('.p-body').innerHTML = `<div class="p-wait"><div class="spinner"></div><p>Zurück zu ${esc(C.merchant)} …</p></div>`;
    } else if (result === 'timeout') {
      app.querySelector('.p-body').innerHTML = `<div class="p-wait"><div class="spinner"></div><p>Warte auf Antwort der Bank …</p><small id="tcount">10</small></div>`;
      for (let i = 9; i >= 0; i--) { await wait(1000); const t = document.getElementById('tcount'); if (t) t.textContent = i; }
      reason = 'Keine Antwort der Bank innerhalb von 10 Sekunden';
    } else {
      app.querySelector('.p-body').innerHTML = `<div class="p-wait"><div class="spinner"></div><p>Zahlung wird verarbeitet …</p></div>`;
      await wait(1300);
      if (result === 'success') {
        app.querySelector('.p-body').innerHTML = `<div class="p-wait"><div class="status-icon ok"></div><p><b>Zahlung autorisiert</b></p><small>Du wirst zu ${esc(C.merchant)} zurückgeleitet …</small></div>`;
        await wait(1100);
      }
    }
    const r = await post(`/api/anbieter/${p.id}`, { result, reason });
    location.replace(r.redirect || `/ergebnis/${p.id}`);
  }
  const pay = () => finish(outcome, outcome === 'declined' ? 'Abgelehnt: Verfügungsrahmen überschritten' : undefined);

  // --- Abläufe je Anbieter ---------------------------------------------------

  const FLOWS = {
    paypal: [
      () => { frame(`<h1>Bei PayPal einloggen</h1>
          <label class="f">E-Mail<input value="kunde@example.com" inputmode="email"></label>
          <label class="f">Passwort<input type="password" value="geheim123"></label>
          <button class="btn block p-primary" id="next">Einloggen</button>`); on('next', () => step(1, 'Kunde hat sich eingeloggt')); },
      () => { frame(`<h1>Zahlung prüfen</h1>
          <div class="p-option sel"><span>PayPal-Guthaben</span><b>${eur(p.total)}</b></div>
          <div class="p-option"><span>Visa •••• 4242</span></div>
          <p class="p-small">Lieferadresse und Daten werden nicht an ${esc(C.merchant)} übertragen.</p>
          <button class="btn block p-primary" id="next">Jetzt bezahlen</button>`); on('next', pay); },
    ],
    wero: [
      () => { frame(`<div class="p-wait"><div class="spinner"></div><p>Wero-App wird geöffnet …</p></div>`); setTimeout(() => step(1, 'Wero-App geöffnet'), 1200); },
      () => { frame(`<h1>Zahlungsanfrage</h1><p class="p-lead"><b>${esc(C.merchant)}</b> möchte <b>${eur(p.total)}</b> von dir erhalten.</p>
          ${C.zweck ? `<p class="p-small">Zweck: ${esc(C.zweck)}</p>` : ''}
          <button class="bio" id="next" aria-label="Mit Fingerabdruck bestätigen"><span>☝︎</span></button><p class="p-small center">Mit Fingerabdruck bestätigen</p>`); on('next', pay); },
    ],
    bank: [
      () => { frame(`<h1>Wähle deine Bank</h1><div class="banks">
          ${['Musterbank', 'Sparkasse Musterstadt', 'Volksbank Beispiel', 'Neo Bank Demo', 'Direktbank Test'].map((b, i) => `<button class="p-option bank-btn" data-b="${b}"><span class="b-logo b${i}">${b[0]}</span>${b}<span class="chev">›</span></button>`).join('')}
          </div>`);
        app.querySelectorAll('.bank-btn').forEach((b) => b.onclick = () => { C.bank = b.dataset.b; step(1, `Bank gewählt: ${C.bank}`); }); },
      () => { frame(`<h1>${esc(C.bank)}</h1><p class="p-small">Online-Banking Login</p>
          <label class="f">Anmeldename<input value="max.muster"></label><label class="f">PIN<input type="password" value="12345"></label>
          <button class="btn block p-primary" id="next">Anmelden</button>`); on('next', () => step(2, 'Im Online-Banking angemeldet')); },
      () => { frame(`<h1>Überweisung freigeben</h1>
          <dl class="p-dl"><dt>Empfänger</dt><dd>${esc(C.merchant)}</dd><dt>IBAN</dt><dd class="mono">DE02 1001 0010 0006 8201 01</dd>
          <dt>Betrag</dt><dd>${eur(p.total)}</dd><dt>Verwendungszweck</dt><dd class="mono">${esc(p.id)} ${esc(C.customer)}</dd></dl>
          <button class="btn block p-primary" id="next">Mit pushTAN freigeben</button>`); on('next', pay); },
    ],
    card: [
      () => { frame(`<h1>Kartendaten</h1>
          <label class="f">Kartennummer<input id="cc" value="4242 4242 4242 4242" inputmode="numeric" autocomplete="off"></label>
          <div class="f-row"><label class="f">Gültig bis<input value="12/29"></label><label class="f">CVC<input value="123" inputmode="numeric"></label></div>
          <label class="f">Name auf der Karte<input value="Max Mustermann"></label>
          <p class="p-small">Testkarten: 4242… klappt, 4000 0000 0000 0002 wird abgelehnt.</p>
          <button class="btn block p-primary" id="next">${eur(p.total)} bezahlen</button>`);
        on('next', () => {
          if (document.getElementById('cc').value.replace(/\s/g, '') === '4000000000000002') outcome = 'declined';
          step(1, 'Kartendaten eingegeben, 3-D Secure angefordert');
        }); },
      () => { frame(`<h1>3-D Secure</h1><div class="p-wait"><div class="phone-ico">📱</div><p>Bestätige die Zahlung in der App deiner Bank.</p></div>
          <button class="btn block p-primary" id="next">In der Banking-App bestätigt</button>`); on('next', pay); },
    ],
    applepay: [
      () => { frame(`<div class="sheet"><div class="sheet-row"><span>Karte</span><b>Visa •••• 4242</b></div><div class="sheet-row"><span>Kontakt</span><b>kunde@example.com</b></div>
          <div class="sheet-row total"><span>${esc(C.merchant)}</span><b>${eur(p.total)}</b></div>
          <button class="bio face" id="next" aria-label="Mit Face ID bestätigen"><span>☺︎</span></button><p class="p-small center">Zum Bezahlen doppelt klicken</p></div>`); on('next', pay); },
    ],
    googlepay: [
      () => { frame(`<div class="sheet"><div class="sheet-row"><span>Zahlungsmethode</span><b>Mastercard •••• 5454</b></div>
          <div class="sheet-row total"><span>${esc(C.merchant)}</span><b>${eur(p.total)}</b></div>
          <button class="btn block p-primary" id="next">Weiter</button></div>`); on('next', pay); },
    ],
    klarna: [
      () => { frame(`<h1>Wie möchtest du bezahlen?</h1>
          <label class="p-option"><input type="radio" name="k" checked> Jetzt bezahlen</label>
          <label class="p-option"><input type="radio" name="k"> In 30 Tagen bezahlen</label>
          <button class="btn block p-primary" id="next">Kaufen</button>`); on('next', pay); },
    ],
    sepa: [
      () => { frame(`<h1>SEPA-Lastschrift</h1>
          <label class="f">Kontoinhaber<input value="Max Mustermann"></label>
          <label class="f">IBAN<input value="DE89 3704 0044 0532 0130 00" autocomplete="off"></label>
          <label class="check"><input type="checkbox" id="mandat"> Ich ermächtige ${esc(C.merchant)}, ${eur(p.total)} von meinem Konto einzuziehen (SEPA-Mandat).</label>
          <button class="btn block p-primary" id="next">Mandat erteilen und bezahlen</button>`);
        on('next', () => { if (!document.getElementById('mandat').checked) return alert('Bitte das SEPA-Mandat bestätigen.'); pay(); }); },
    ],
  };

  function step(i, logText) {
    if (logText) note(logText);
    FLOWS[C.method][i]();
  }

  note('Checkout-Seite geöffnet');
  step(0);
})();
