// Weitere Usecases auf dem Handy: Anmeldung mit Geburtsdatum (Kontostand, Adressänderung) und Ident + Dokument-Upload
window.QRFlows = (() => {
  const Q = () => window.QRPay;
  const $ = (s) => document.querySelector(s);
  const merchant = '<div class="merchant-bar"><span class="m-logo">M</span><span>Muster GmbH</span><span class="lock">✓ geprüft</span></div>';
  const fmtDate = (iso) => (iso ? new Date(`${iso.slice(0, 10)}T12:00:00`).toLocaleDateString('de-DE') : '');
  const note = (text, actor) => Q().post('/api/schritt', { token: Q().token, text, actor }).catch(() => {});

  // --- Anmeldung mit Geburtsdatum ---------------------------------------------------

  function login(res) {
    const { app, esc, kdnr, protocol } = Q();
    const title = res.code.type === 'KONTO' ? 'Dein Kundenkonto' : 'Adresse ändern';
    app.innerHTML = `${merchant}
      <section class="flow">
        <h1>${title}</h1>
        <p class="muted">Kundennummer <b class="mono">${kdnr(res.code.vars.kundennummer)}</b></p>
        <form id="login" class="auth-card" novalidate>
          <p>Zum Schutz deiner Daten bestätige bitte dein <b>Geburtsdatum</b>.</p>
          <div class="dob" role="group" aria-label="Geburtsdatum">
            <label>Tag<input name="t" inputmode="numeric" maxlength="2" placeholder="TT" autocomplete="bday-day"></label>
            <label>Monat<input name="m" inputmode="numeric" maxlength="2" placeholder="MM" autocomplete="bday-month"></label>
            <label class="y">Jahr<input name="j" inputmode="numeric" maxlength="4" placeholder="JJJJ" autocomplete="bday-year"></label>
          </div>
          <p class="form-err" id="login-err" role="alert"></p>
          <button class="btn block" type="submit">Anmelden</button>
        </form>
        <p class="fine">Demo: Die Beispiel-Codes nutzen den 14.03.1985. Nach 3 Fehlversuchen wird der Zugang 15 Minuten gesperrt.</p>
        ${protocol(res.steps)}
      </section>`;
    const f = $('#login');
    // Automatisch ins nächste Feld springen
    [...f.querySelectorAll('input')].forEach((inp, i, all) => inp.addEventListener('input', () => { if (inp.value.length >= inp.maxLength && all[i + 1]) all[i + 1].focus(); }));
    f.t.focus();
    f.onsubmit = async (e) => {
      e.preventDefault();
      const btn = f.querySelector('button');
      btn.disabled = true;
      $('#login-err').textContent = '';
      try {
        const d = await Q().post('/api/login', { token: Q().token, source: Q().source, geburtsdatum: `${f.t.value}.${f.m.value}.${f.j.value}` });
        Q().setSession(d.session);
        if (res.code.type === 'KONTO') konto(res, d); else address(res, d);
      } catch (err) {
        if (err.status === 423) return locked(err.message);
        $('#login-err').textContent = err.message;
        btn.disabled = false;
      }
    };
  }

  function locked(text) {
    Q().app.innerHTML = `${merchant}<section class="result"><div class="status-icon err"></div><h1 class="r-title">Zugang gesperrt</h1>
      <p class="r-text">${Q().esc(text)}</p><p class="r-text">Wenn du dein Geburtsdatum nicht mehr weißt oder es hier falsch hinterlegt ist, wende dich bitte an den Kundenservice.</p>
      <button class="btn block ghost" id="again">Später erneut versuchen</button></section>`;
    $('#again').onclick = Q().restart;
  }

  // --- Kontostand --------------------------------------------------------------------

  function konto(res, d) {
    const { app, eur, esc, mark } = Q();
    const tone = d.saldo < 0 ? 'neg' : 'pos';
    app.innerHTML = `${merchant}
      <section class="flow">
        <h1>Hallo ${esc(d.name)}</h1>
        <div class="balance ${tone}">
          <small>Aktueller Kontostand</small>
          <strong>${eur(d.saldo)}</strong>
          <span>${d.saldo < 0 ? 'offen' : d.saldo > 0 ? 'Guthaben' : 'ausgeglichen'}</span>
        </div>
        <h2 class="sub">Buchungen</h2>
        <ul class="bookings">
          <li><span>Saldo laut letzter Rechnung</span><b class="${d.start < 0 ? 'neg' : ''}">${eur(d.start)}</b></li>
          ${d.bookings.map((b) => `<li><span>${esc(b.text)}<small>${new Date(b.date).toLocaleDateString('de-DE')}</small></span><b class="pos">+${eur(b.amount)}</b></li>`).join('')}
        </ul>
        ${d.open ? `
          <h2 class="pay-with">Offenen Betrag ${eur(d.open)} jetzt ausgleichen</h2>
          <div class="methods">${d.methods.map((m) => `<button class="pm" data-m="${m.id}">${mark(m.id)}<span class="pm-txt"><b>${esc(m.name)}</b><small>${esc(m.sub)}</small></span><span class="chev">›</span></button>`).join('')}</div>`
        : '<p class="ok-note">Dein Konto ist ausgeglichen. Es gibt nichts zu bezahlen.</p>'}
        <button class="btn block ghost logout" id="logout">Abmelden</button>
      </section>`;
    app.querySelectorAll('.pm').forEach((b) => b.onclick = () => Q().choose(b.dataset.m, d.methods.find((m) => m.id === b.dataset.m).name));
    $('#logout').onclick = () => { Q().setSession(null); note('Kunde hat sich abgemeldet', Q().source); Q().restart(); };
  }

  // --- Adressänderung ------------------------------------------------------------------

  function address(res, d) {
    const { app, esc } = Q();
    const a = d.address;
    const today = new Date().toISOString().slice(0, 10);
    app.innerHTML = `${merchant}
      <section class="flow">
        <h1>Adresse ändern</h1>
        <p class="muted">Angemeldet als ${esc(d.name)}</p>
        <div class="addr-old"><small>Bisherige Anschrift</small><p>${esc(a.strasse)}<br>${esc(a.plz)} ${esc(a.ort)}</p></div>
        <form id="adr" class="form" novalidate>
          <label class="f" data-key="strasse">Neue Straße und Hausnummer<input name="strasse" autocomplete="address-line1"><em class="err"></em></label>
          <div class="f-row plz-row">
            <label class="f" data-key="plz">PLZ<input name="plz" inputmode="numeric" maxlength="5" autocomplete="postal-code"><em class="err"></em></label>
            <label class="f" data-key="ort">Ort<input name="ort" autocomplete="address-level2"><em class="err"></em></label>
          </div>
          <label class="f">Gültig ab<input name="ab" type="date" value="${today}" min="${today}"></label>
          <p class="form-err" id="adr-err" role="alert"></p>
          <button class="btn block" type="submit">Änderung übermitteln</button>
        </form>
        <p class="fine">Demo-Adresse zum Ausprobieren: Lindenallee 7, 10115 Berlin</p>
      </section>`;
    const f = $('#adr');
    f.onsubmit = async (e) => {
      e.preventDefault();
      f.querySelectorAll('[data-key]').forEach((l) => { l.classList.remove('bad'); l.querySelector('.err').textContent = ''; });
      $('#adr-err').textContent = '';
      try {
        const r = await Q().post('/api/adresse', { token: Q().token, source: Q().source, ...Object.fromEntries(new FormData(f)), session: currentSession() });
        addressDone(r);
      } catch (err) {
        if (err.errors) Object.entries(err.errors).forEach(([k, v]) => { const l = f.querySelector(`[data-key=${k}]`); l.classList.add('bad'); l.querySelector('.err').textContent = v; });
        $('#adr-err').textContent = err.message;
        if (err.status === 401) setTimeout(Q().restart, 1500);
      }
    };
  }

  function addressDone(r) {
    const { app, esc } = Q();
    app.innerHTML = `${merchant}<section class="result"><div class="status-icon ok"></div><h1 class="r-title">Änderung übermittelt</h1>
      <p class="r-text">Wir haben deine neue Anschrift ab ${fmtDate(r.neu.ab)} vorgemerkt. Eine Bestätigung kommt zusätzlich per Post an die neue Adresse.</p>
      <section class="receipt"><h2>Bestätigung</h2><dl>
        <dt>Vorgang</dt><dd class="mono">${esc(r.id)}</dd>
        <dt>Bisher</dt><dd>${esc(r.alt.strasse)}, ${esc(r.alt.plz)} ${esc(r.alt.ort)}</dd>
        <dt class="sum">Neu</dt><dd class="sum">${esc(r.neu.strasse)}, ${esc(r.neu.plz)} ${esc(r.neu.ort)}</dd>
        <dt>Gültig ab</dt><dd>${fmtDate(r.neu.ab)}</dd>
        <dt>Eingang</dt><dd>${new Date(r.createdAt).toLocaleString('de-DE')}</dd>
      </dl></section>
      <button class="btn block" onclick="window.print()">Bestätigung speichern</button></section>`;
  }

  // Sitzung liegt in pay.js; hier nur lesend
  let sess = null;
  const currentSession = () => sess;

  // --- Dokument einreichen: Einleitung, Ident, Upload ------------------------------------

  function dokIntro(res) {
    const { app, esc, kdnr, protocol } = Q();
    const v = res.code.vars;
    app.innerHTML = `${merchant}
      <section class="flow">
        <p class="eyebrow">Sichere Dokumenten-Übermittlung</p>
        <h1>${esc(v.dokument)}</h1>
        <p class="muted">Kundennummer <b class="mono">${kdnr(v.kundennummer)}</b>${v.frist ? ` · Frist ${fmtDate(v.frist)}` : ''}</p>
        <ol class="howto compact">
          <li><b>Identität bestätigen</b> mit Online-Ausweis${v.niveau === 'hoch' ? '' : ', Video- oder Bank-Ident'}</li>
          <li><b>Dokument hochladen</b> als PDF oder Foto, max. 3 MB</li>
          <li><b>Eingangsbestätigung</b> mit Vorgangsnummer erhalten</li>
        </ol>
        <div class="privacy"><b>Datenschutz:</b> Wir prüfen Name und Geburtsdatum gegen deinen Vorgang. Das Dokument wird verschlüsselt gespeichert und nur für diesen Vorgang verwendet.</div>
        <label class="check"><input type="checkbox" id="consent"> Ich bin einverstanden, dass meine Identität geprüft und das Dokument an die Muster GmbH übermittelt wird.</label>
        <button class="btn block" id="go" disabled>Weiter zur Identifizierung</button>
        ${protocol(res.steps)}
      </section>`;
    $('#consent').onchange = (e) => { $('#go').disabled = !e.target.checked; };
    $('#go').onclick = () => { note('Einwilligung zur Identifizierung erteilt', Q().source); identChoice(res); };
  }

  const IDMARK = { eid: ['🪪', '#0b3d91', '#fff'], video: ['🎥', '#e8eef9', '#0f1b2d'], bankident: ['🏦', '#e8f5ee', '#0f1b2d'] };

  function identChoice(res) {
    const { app, esc } = Q();
    app.innerHTML = `${merchant}
      <section class="flow">
        <h1>Wie möchtest du dich ausweisen?</h1>
        <p class="muted">Gefordertes Vertrauensniveau: <b>${esc(res.code.vars.niveau)}</b></p>
        <div class="methods">${res.idents.map((m) => {
          const [t, bg, fg] = IDMARK[m.id];
          return `<button class="pm" data-m="${m.id}"><span class="pm-mark" style="background:${bg};color:${fg}">${t}</span><span class="pm-txt"><b>${esc(m.name)}</b><small>${esc(m.sub)}</small></span><span class="badge niv">${m.niveau}</span></button>`;
        }).join('')}</div>
        ${res.code.vars.niveau === 'hoch' ? '<p class="fine">Video- und Bank-Ident erreichen nur das Niveau „substanziell“ und sind hier nicht erlaubt.</p>' : ''}
      </section>`;
    app.querySelectorAll('.pm').forEach((b) => b.onclick = () => runIdent(res, res.idents.find((m) => m.id === b.dataset.m)));
  }

  // Simulierte Ident-Verfahren, jedes mit eigenen Schritten
  function runIdent(res, m) {
    const { app, esc, wait } = Q();
    let outcome = 'match';
    const frame = (inner) => {
      app.innerHTML = `
        <header class="p-head"><div class="p-word id-word">${m.id === 'eid' ? '<b>AusweisApp</b> <small>Simulation</small>' : m.id === 'video' ? '<b>IdentNow</b> <small>Video-Ident</small>' : '<b>BankIdent</b> <small>Simulation</small>'}</div><button class="p-cancel" id="cancel">Abbrechen</button></header>
        <section class="p-body">${inner}</section>
        <details class="testcase"><summary>Testfall: <b id="tc-label">${outcome === 'match' ? 'Richtige Person' : 'Andere Person'}</b></summary>
          <div class="tc-opts">
            <label><input type="radio" name="tc" value="match" ${outcome === 'match' ? 'checked' : ''}> Richtige Person</label>
            <label><input type="radio" name="tc" value="mismatch" ${outcome === 'mismatch' ? 'checked' : ''}> Andere Person (Abgleich schlägt fehl)</label>
          </div></details>`;
      app.querySelectorAll('input[name=tc]').forEach((r) => r.onchange = () => { outcome = r.value; $('#tc-label').textContent = outcome === 'match' ? 'Richtige Person' : 'Andere Person'; });
      $('#cancel').onclick = () => { note(`${m.name} abgebrochen`); identChoice(res); };
    };
    const on = (id, fn) => { const el = document.getElementById(id); if (el) el.onclick = (e) => { e.preventDefault(); fn(); }; };

    const finish = async () => {
      frame('<div class="p-wait"><div class="spinner"></div><p>Identität wird geprüft …</p></div>');
      try {
        const [d] = await Promise.all([Q().post('/api/ident', { token: Q().token, method: m.id, outcome, source: Q().source }), wait(1200)]);
        sess = d.session;
        upload(res, d);
      } catch (err) {
        app.innerHTML = `${merchant}<section class="result"><div class="status-icon err"></div><h1 class="r-title">Identifizierung fehlgeschlagen</h1>
          <p class="r-text">${esc(err.message)}</p><button class="btn block" id="retry">Erneut versuchen</button></section>`;
        $('#retry').onclick = () => identChoice(res);
      }
    };

    const FLOWS = {
      eid: [
        () => { frame(`<h1>Ausweis ans Handy halten</h1><div class="nfc"><div class="card-ico">🪪</div><div class="waves"></div></div>
            <p class="p-small center">Lege deinen Personalausweis flach an die Rückseite deines Handys.</p>
            <button class="btn block p-primary" id="next">Ausweis wird erkannt …</button>`);
          const t = setTimeout(() => go(1, 'Online-Ausweis: Chip erkannt (NFC)'), 2200); on('next', () => { clearTimeout(t); go(1, 'Online-Ausweis: Chip erkannt (NFC)'); }); },
        () => { frame(`<h1>PIN eingeben</h1><p class="p-small">Deine 6-stellige Ausweis-PIN</p>
            <input class="pin" id="pin" type="password" inputmode="numeric" maxlength="6" value="123456" aria-label="PIN">
            <button class="btn block p-primary" id="next">Weiter</button>`); on('next', () => go(2, 'Online-Ausweis: PIN bestätigt')); },
        () => { frame(`<h1>Daten übermitteln?</h1><p class="p-small">Die Muster GmbH fordert folgende Daten aus deinem Ausweis an:</p>
            <ul class="facts"><li>Vorname, Name</li><li>Geburtsdatum</li><li>Dokumentart</li></ul>
            <p class="p-small">Zweck: ${esc(res.code.vars.dokument)}. Berechtigungszertifikat geprüft.</p>
            <button class="btn block p-primary" id="next">Daten übermitteln</button>`); on('next', finish); },
      ],
      video: [
        () => { frame(`<div class="p-wait"><div class="spinner"></div><p>Kamera wird gestartet …</p><small>Verbindung zum Ident-Team</small></div>`); setTimeout(() => go(1, 'Video-Ident: Agent verbunden'), 1600); },
        () => { frame(`<h1>Ausweis in die Kamera halten</h1><div class="cam"><span>Vorderseite</span></div><p class="p-small">Kippe den Ausweis leicht, damit die Sicherheitsmerkmale sichtbar sind.</p>
            <button class="btn block p-primary" id="next">Vorder- und Rückseite gezeigt</button>`); on('next', () => go(2, 'Video-Ident: Ausweis und Gesicht geprüft')); },
        () => { frame(`<h1>TAN aus der SMS</h1><p class="p-small">Wir haben dir eine TAN geschickt (Simulation).</p>
            <input class="pin" type="text" inputmode="numeric" maxlength="6" value="482913" aria-label="TAN">
            <button class="btn block p-primary" id="next">Abschließen</button>`); on('next', finish); },
      ],
      bankident: [
        () => { frame(`<h1>Wähle deine Bank</h1><div class="banks">${['Musterbank', 'Sparkasse Musterstadt', 'Volksbank Beispiel'].map((b, i) => `<button class="p-option bank-btn" data-b="${b}"><span class="b-logo b${i}">${b[0]}</span>${b}<span class="chev">›</span></button>`).join('')}</div>`);
          app.querySelectorAll('.bank-btn').forEach((b) => b.onclick = () => go(1, `Bank-Ident: ${b.dataset.b} gewählt`)); },
        () => { frame(`<h1>Online-Banking Login</h1><label class="f">Anmeldename<input value="max.muster"></label><label class="f">PIN<input type="password" value="12345"></label>
            <button class="btn block p-primary" id="next">Anmelden</button>`); on('next', () => go(2, 'Bank-Ident: im Online-Banking angemeldet')); },
        () => { frame(`<h1>Identitätsdaten freigeben</h1><p class="p-small">Deine Bank bestätigt der Muster GmbH Name und Geburtsdatum aus deinem Konto.</p>
            <button class="btn block p-primary" id="next">Mit pushTAN freigeben</button>`); on('next', finish); },
      ],
    };
    const go = (i, text) => { if (text) note(text); FLOWS[m.id][i](); };
    note(`${m.name} gestartet`);
    go(0);
  }

  // Beispiel-PDF für die Demo, falls gerade kein echtes Dokument zur Hand ist
  function samplePdf(title) {
    const t = `${title} - Simulation - erstellt ${new Date().toLocaleString('de-DE')}`.replace(/[()\\]/g, '').replace(/[^\x20-\x7e]/g, '?');
    const objs = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
      null,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    ];
    const stream = `BT /F1 20 Tf 60 760 Td (Befreiungsbescheinigung) Tj 0 -30 Td /F1 11 Tf (${t}) Tj 0 -20 Td (Dies ist ein Beispieldokument ohne rechtliche Wirkung.) Tj ET`;
    objs[3] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    let out = '%PDF-1.4\n';
    const offs = objs.map((o, i) => { const off = out.length; out += `${i + 1} 0 obj\n${o}\nendobj\n`; return off; });
    const xref = out.length;
    out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offs.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('')}`;
    out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return new File([out], 'befreiungsbescheinigung.pdf', { type: 'application/pdf' });
  }

  async function sha256(buf) {
    if (!crypto.subtle) return null; // nur in sicherer Umgebung (https)
    const h = await crypto.subtle.digest('SHA-256', buf);
    return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  function upload(res, d) {
    const { app, esc, wait } = Q();
    let file = null;
    app.innerHTML = `${merchant}
      <section class="flow">
        <div class="ident-ok">✓ Identifiziert als <b>${esc(d.person)}</b><small>${esc(d.method)} · Niveau ${esc(d.niveau)}</small></div>
        <h1>${esc(d.dokument)} hochladen</h1>
        <label class="drop" id="drop"><input type="file" id="file" accept="application/pdf,image/jpeg,image/png,image/heic" hidden>
          <span class="drop-ico">⬆︎</span><b>Datei auswählen oder Foto aufnehmen</b><small>PDF, JPG oder PNG, max. 3 MB</small></label>
        <button class="btn block ghost" id="sample">Beispieldokument verwenden</button>
        <div id="picked"></div>
        <p class="form-err" id="up-err" role="alert"></p>
        <button class="btn block" id="send" disabled>Sicher übermitteln</button>
      </section>`;
    const pick = async (f) => {
      $('#up-err').textContent = '';
      if (f.size > 3 * 1024 * 1024) { $('#up-err').textContent = 'Die Datei ist größer als 3 MB.'; return; }
      file = f;
      const hash = await sha256(await f.arrayBuffer());
      file.hash = hash;
      $('#picked').innerHTML = `<div class="file-card"><span class="file-ico">${f.type === 'application/pdf' ? 'PDF' : 'IMG'}</span><div><b>${esc(f.name)}</b><small>${Math.max(1, Math.round(f.size / 1024))} KB${hash ? ` · SHA-256 ${hash.slice(0, 16)}…` : ''}</small></div></div>`;
      $('#send').disabled = false;
    };
    $('#file').onchange = (e) => e.target.files[0] && pick(e.target.files[0]);
    $('#sample').onclick = () => pick(samplePdf(d.dokument));
    $('#send').onclick = async () => {
      $('#send').disabled = true;
      const steps = ['Datei wird verschlüsselt übertragen …', 'Prüfsumme wird verglichen …', 'Eingang wird bestätigt …'];
      const ov = document.createElement('div');
      ov.className = 'overlay';
      ov.innerHTML = '<div class="spinner"></div><p id="ov-t"></p>';
      document.body.appendChild(ov);
      let i = 0;
      const tick = setInterval(() => { const t = document.getElementById('ov-t'); if (t) t.textContent = steps[Math.min(i++, steps.length - 1)]; }, 600);
      try {
        const data = await new Promise((ok, fail) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1]); r.onerror = fail; r.readAsDataURL(file); });
        const [r] = await Promise.all([Q().post('/api/dokument', { token: Q().token, session: sess, source: Q().source, filename: file.name, mime: file.type, sha256: file.hash || undefined, data }), wait(1800)]);
        clearInterval(tick); ov.remove();
        dokDone(r);
      } catch (err) {
        clearInterval(tick); ov.remove();
        $('#up-err').textContent = err.message;
        $('#send').disabled = false;
        if (err.status === 401) setTimeout(Q().restart, 1500);
      }
    };
  }

  function dokDone(r) {
    const { app, esc } = Q();
    app.innerHTML = `${merchant}<section class="result"><div class="status-icon ok"></div><h1 class="r-title">Dokument eingegangen</h1>
      <p class="r-text">Vielen Dank. Dein Dokument ist sicher bei uns angekommen und wird jetzt bearbeitet.</p>
      <section class="receipt"><h2>Eingangsbestätigung</h2><dl>
        <dt>Vorgang</dt><dd class="mono">${esc(r.id)}</dd>
        <dt>Dokument</dt><dd>${esc(r.dokument)}</dd>
        <dt>Datei</dt><dd>${esc(r.filename)} (${Math.max(1, Math.round(r.size / 1024))} KB)</dd>
        <dt>SHA-256</dt><dd class="mono">${esc(r.sha256.slice(0, 24))}…</dd>
        <dt>Identifiziert</dt><dd>${{ eid: 'Online-Ausweis', video: 'Video-Ident', bankident: 'Bank-Ident' }[r.ident] || esc(r.ident)} · ${esc(r.niveau)}</dd>
        <dt>Eingang</dt><dd>${new Date(r.createdAt).toLocaleString('de-DE')}</dd>
      </dl></section>
      <button class="btn block" onclick="window.print()">Bestätigung speichern</button></section>`;
  }

  // Die Adress-Sitzung kommt aus dem Login
  const origLogin = login;
  return {
    login: (res) => {
      const realSet = Q().setSession;
      Q().setSession = (s) => { sess = s; realSet(s); };
      origLogin(res);
    },
    dokIntro,
  };
})();
