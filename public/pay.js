// Service 2 auf dem Handy: Code dekodieren, Betrag zeigen, Zahlart wählen
(() => {
  const app = document.getElementById('app');
  const token = app.dataset.token;
  const source = window.self !== window.top ? 'simulation' : 'handy';
  const eur = (c) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(c / 100);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const kdnr = (s) => String(s || '').replace(/(\d{4})(?=\d)/g, '$1 ');
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const post = (url, data) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
    .then(async (r) => { const j = await r.json(); if (!r.ok) throw Object.assign(new Error(j.error || 'Fehler'), { status: r.status, errors: j.errors }); return j; });
  let session = null;

  const MARK = {
    paypal: ['PP', '#003087', '#fff'], wero: ['w', '#1d1d1b', '#ffe94d'], bank: ['🏦', '#e8eef9', '#0f1b2d'], card: ['💳', '#eef2f7', '#0f1b2d'],
    applepay: ['Pay', '#000', '#fff'], googlepay: ['G Pay', '#fff', '#3c4043'], klarna: ['K.', '#ffb3c7', '#17120f'], sepa: ['SEPA', '#10298e', '#fff'],
  };
  const mark = (id) => { const [t, bg, fg] = MARK[id] || ['?', '#eee', '#000']; return `<span class="pm-mark" style="background:${bg};color:${fg}">${t}</span>`; };

  async function run() {
    app.innerHTML = `
      <div class="scan">
        <div class="scan-frame"><div class="scan-line"></div><div class="qr-ghost"></div></div>
        <h1>QR-Code wird verarbeitet</h1>
        <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="100"><div id="bar"></div></div>
        <ol class="steps" id="steps"></ol>
      </div>`;
    const bar = document.getElementById('bar');
    const list = document.getElementById('steps');
    let res;
    try {
      [res] = await Promise.all([post('/api/decode', { token, source }), wait(500)]);
    } catch (e) {
      return showError('Keine Verbindung', e.message);
    }
    const n = res.steps.length + (res.ok ? 0 : 1);
    for (let i = 0; i < res.steps.length; i++) {
      const s = res.steps[i];
      const li = document.createElement('li');
      li.className = 'run';
      li.innerHTML = `<span class="dot"></span><div><b>${esc(s.label)}</b><small>${esc(s.detail)}</small></div>`;
      list.appendChild(li);
      await wait(280 + Math.random() * 260);
      li.className = s.ok ? 'ok' : 'bad';
      bar.style.width = `${Math.round(((i + 1) / n) * 100)}%`;
      bar.parentElement.setAttribute('aria-valuenow', Math.round(((i + 1) / n) * 100));
      if (!s.ok) break;
    }
    await wait(450);
    if (!res.ok) return showError('Code nicht gültig', res.error, res.steps);
    if (res.alreadyPaid) return showPaid(res);
    if (res.alreadyDone) return showDone(res);
    if (res.auth === 'geburtsdatum') return window.QRFlows.login(res);
    if (res.auth === 'ident') return window.QRFlows.dokIntro(res);
    if (res.code.type === 'INFO') return showInfo(res);
    showCheckout(res);
  }

  const protocol = (steps) => `<details class="proto"><summary>Prüfprotokoll (${steps.length} Schritte)</summary><ol>${steps.map((s) =>
    `<li class="${s.ok ? 'ok' : 'bad'}"><b>${esc(s.label)}</b> <small>${esc(s.detail)}</small></li>`).join('')}</ol></details>`;

  function showError(title, text, steps) {
    app.innerHTML = `<section class="result"><div class="status-icon err"></div><h1 class="r-title">${esc(title)}</h1><p class="r-text">${esc(text)}</p>
      ${steps ? protocol(steps) : ''}<button class="btn block ghost" id="again">Erneut scannen</button></section>`;
    document.getElementById('again').onclick = run;
  }

  function showPaid(res) {
    const p = res.alreadyPaid;
    app.innerHTML = `<section class="result"><div class="status-icon ok"></div><h1 class="r-title">Bereits bezahlt</h1>
      <p class="r-text">Dieser Code wurde am ${new Date(p.updatedAt).toLocaleString('de-DE')} mit ${esc(p.methodName)} bezahlt (${eur(p.total)}). Eine zweite Zahlung ist nicht möglich.</p>
      <a class="btn block" href="/ergebnis/${esc(p.id)}">Beleg anzeigen</a>${protocol(res.steps)}</section>`;
  }

  function showInfo(res) {
    const v = res.code.vars;
    app.innerHTML = `<section class="result"><div class="status-icon info"></div><h1 class="r-title">${esc(v.titel)}</h1>
      <p class="r-text mono small">${esc(v.url)}</p><a class="btn block" href="${esc(v.url)}" ${v.url.startsWith('/') ? '' : 'target="_blank" rel="noopener"'}>Weiter</a>${protocol(res.steps)}</section>`;
  }

  function showCheckout(res) {
    const { vars, total } = res.code;
    app.innerHTML = `
      <div class="merchant-bar"><span class="m-logo">M</span><span>Muster GmbH</span><span class="lock" title="Signatur geprüft">✓ geprüft</span></div>
      <section class="bill">
        <p class="bill-to">Zahlung für Kundennummer <b class="mono">${kdnr(vars.kundennummer)}</b></p>
        ${vars.zweck ? `<p class="bill-zweck">${esc(vars.zweck)}</p>` : ''}
        <dl class="lines">
          <dt>Betrag</dt><dd>${eur(vars.betrag)}</dd>
          <dt>Gebühr <button class="info-btn" id="fee-info" aria-label="Was ist die Gebühr?">i</button></dt><dd>${eur(vars.gebuehr)}</dd>
        </dl>
        <p class="fee-note" id="fee-note" hidden>Servicegebühr der Muster GmbH. Sie ist fest im Code hinterlegt und für jede Zahlart gleich hoch.</p>
        <div class="total"><span>Endbetrag</span><strong>${eur(total)}</strong></div>
      </section>
      <h2 class="pay-with">Sofort bezahlen mit</h2>
      <div class="methods">${res.methods.map((m) => `
        <button class="pm" data-m="${m.id}">${mark(m.id)}<span class="pm-txt"><b>${esc(m.name)}</b><small>${esc(m.sub)}</small></span><span class="chev">›</span></button>`).join('')}
      </div>
      ${protocol(res.steps)}
      <p class="fine">Simulation. Es wird kein Geld bewegt.</p>`;
    document.getElementById('fee-info').onclick = () => { const n = document.getElementById('fee-note'); n.hidden = !n.hidden; };
    app.querySelectorAll('.pm').forEach((b) => b.onclick = () => choose(b.dataset.m, res.methods.find((m) => m.id === b.dataset.m).name));
  }

  async function choose(method, name) {
    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.innerHTML = `<div class="spinner"></div><p>Weiterleitung zu ${esc(name)} …</p>`;
    document.body.appendChild(ov);
    try {
      const [r] = await Promise.all([post('/api/pay', { token, method, source, session }), wait(700)]);
      location.href = r.redirect;
    } catch (e) {
      ov.remove();
      showError('Zahlung nicht möglich', e.message);
    }
  }

  function showDone(res) {
    const d = res.alreadyDone;
    app.innerHTML = `<section class="result"><div class="status-icon ok"></div><h1 class="r-title">Bereits erledigt</h1>
      <p class="r-text">Dieser Vorgang wurde${d ? ` am ${new Date(d.createdAt).toLocaleString('de-DE')} abgeschlossen (Vorgang <span class="mono">${esc(d.id)}</span>)` : ' bereits abgeschlossen'}. Du musst nichts weiter tun.</p>
      ${protocol(res.steps)}</section>`;
  }

  // Für die weiteren Usecases (flows.js)
  window.QRPay = { app, token, source, eur, esc, kdnr, wait, post, protocol, showError, choose, mark, setSession: (s) => { session = s; }, restart: run };
  run();
})();
