// Service 1: QR-Code-Manager im Browser
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const eur = (c) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format((c || 0) / 100);
  const money = (c) => ((c || 0) / 100).toFixed(2).replace('.', ',');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const dmy = (iso) => (iso ? iso.slice(0, 10).split('-').reverse().join('.') : '');
  const kdnr = (s) => String(s || '').replace(/(\d{4})(?=\d)/g, '$1 ');
  const time = (iso) => new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const api = async (url, opts = {}) => {
    const r = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json' }, body: opts.body && JSON.stringify(opts.body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw Object.assign(new Error(j.error || `Fehler ${r.status}`), { errors: j.errors });
    return j;
  };
  const toast = (t) => { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('on'), 2600); };

  let types = [], codes = [], info = {}, filter = 'alle';
  const STATUS = { aktiv: 'Aktiv', deaktiviert: 'Deaktiviert', bezahlt: 'Bezahlt', erledigt: 'Erledigt' };
  const PSTATUS = { gestartet: 'läuft', bezahlt: 'bezahlt', abgebrochen: 'abgebrochen', abgelehnt: 'abgelehnt', 'zeitüberschreitung': 'Timeout' };
  const randomKdnr = () => Array.from({ length: 12 }, (_, i) => (i === 0 ? 1 + Math.floor(Math.random() * 9) : Math.floor(Math.random() * 10))).join('');

  // --- Formular aus dem Schema der Code-Art ---------------------------------

  function fieldsHtml(type, values = {}) {
    return type.schema.map((f) => {
      let v = values[f.key];
      if (f.kind.startsWith('money') && Number.isInteger(v)) v = (v < 0 ? '-' : '') + money(Math.abs(v));
      if (f.kind === 'date' && /^\d{4}-\d{2}-\d{2}$/.test(v || '')) v = dmy(v);
      const mode = ['digits12', 'plz'].includes(f.kind) ? 'numeric' : f.kind.startsWith('money') ? 'text' : f.kind === 'url' ? 'url' : 'text';
      const lock = f.secret ? ' <span class="lock-tag" title="Steht nur in der Datenbank, nie im QR-Code">🔒 nicht im QR</span>' : '';
      const input = f.kind === 'select'
        ? `<select name="${f.key}">${f.options.map(([o, l]) => `<option value="${o}" ${o === v ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>`
        : `<input name="${f.key}" value="${esc(v ?? '')}" inputmode="${mode}" placeholder="${esc(f.hint || '')}" ${f.kind === 'digits12' ? 'maxlength="15"' : ''} autocomplete="off">`;
      return `<label class="f" data-key="${f.key}">${esc(f.label)}${f.required ? '' : ' <i>optional</i>'}${lock}
        ${input}
        <em class="err"></em></label>`;
    }).join('');
  }

  function renderCreate(typeId = 'PAY') {
    const type = types.find((t) => t.id === typeId);
    const SAMPLES = {
      PAY: { kundennummer: randomKdnr(), betrag: '49,90', gebuehr: '1,50', zweck: `Rechnung 2026-${100 + Math.floor(Math.random() * 900)}` },
      KONTO: { kundennummer: randomKdnr(), name: 'Max Mustermann', geburtsdatum: '14.03.1985', kontostand: '-45,20' },
      ADR: { kundennummer: randomKdnr(), name: 'Max Mustermann', geburtsdatum: '14.03.1985', strasse: 'Hauptstraße 12', plz: '50667', ort: 'Köln' },
      DOK: { kundennummer: randomKdnr(), dokument: 'Befreiungsbescheinigung 2027', frist: dmy(new Date(Date.now() + 14 * 864e5).toISOString()), niveau: 'substanziell', name: 'Max Mustermann', geburtsdatum: '14.03.1985' },
      INFO: { titel: 'So funktioniert QR-Pay', url: '/info' },
    };
    const sample = SAMPLES[typeId] || {};
    const LABELS = { PAY: 'Rechnung Kunde', KONTO: 'Kontostand Kunde', ADR: 'Adressänderung Kunde', DOK: 'Nachweis anfordern', INFO: 'Info-Link' };
    $('#create-form').innerHTML = `
      <label class="f">Code-Art
        <select name="type">${types.map((t) => `<option value="${t.id}" ${t.id === typeId ? 'selected' : ''}>${t.id} · ${esc(t.name)}</option>`).join('')}</select></label>
      <label class="f">Bezeichnung <i>intern</i><input name="label" value="${LABELS[typeId] || type.name}" autocomplete="off"></label>
      <div class="vars">${fieldsHtml(type, sample)}</div>
      <div class="f-row">
        <label class="f">Gültig<select name="validDays"><option value="0">unbegrenzt</option><option value="1">1 Tag</option><option value="7" selected>7 Tage</option><option value="30">30 Tage</option></select></label>
        <label class="check"><input type="checkbox" name="singleUse" ${['PAY', 'ADR', 'DOK'].includes(typeId) ? 'checked' : ''}> Einmal-Code<small>nach Abschluss gesperrt</small></label>
      </div>
      <div class="sum-preview" id="preview"></div>
      <div class="row"><button class="btn" type="submit">Code anlegen</button><button class="btn ghost" type="button" id="randomize">Neue Beispieldaten</button></div>`;
    const form = $('#create-form');
    form.type.onchange = () => renderCreate(form.type.value);
    $('#randomize').onclick = () => renderCreate(form.type.value);
    form.oninput = () => preview(form);
    preview(form);
  }

  function preview(form) {
    const el = $('#preview', form.parentElement) || $('#preview');
    if (!form.betrag) { el.innerHTML = ''; return; }
    const c = (v) => Math.round(parseFloat(String(v).replace(/\./g, '').replace(',', '.')) * 100);
    const a = c(form.betrag.value), f = c(form.gebuehr.value || '0');
    el.innerHTML = Number.isFinite(a + f) ? `Endbetrag für den Kunden: <b>${eur(a + f)}</b>` : '';
  }

  const formData = (form) => {
    const t = types.find((x) => x.id === (form.type?.value || form.dataset.type));
    return {
      type: t.id, label: form.label.value,
      vars: Object.fromEntries(t.schema.map((f) => [f.key, form[f.key].value])),
      validDays: form.validDays?.value, singleUse: form.singleUse?.checked,
    };
  };

  const showErrors = (form, errors = {}) => form.querySelectorAll('[data-key]').forEach((l) => { $('.err', l).textContent = errors[l.dataset.key] || ''; l.classList.toggle('bad', !!errors[l.dataset.key]); });

  $('#create-form').onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    try {
      const c = await api('/api/codes', { method: 'POST', body: formData(form) });
      showErrors(form);
      toast(`${c.id} angelegt`);
      renderCreate(form.type.value);
      await loadCodes();
      flash(c.id);
    } catch (err) { showErrors(form, err.errors); toast(err.message); }
  };

  // --- Liste --------------------------------------------------------------

  function summary(c) {
    if (c.type === 'PAY') {
      const v = c.vars;
      return `<div class="c-vars"><span>Kd-Nr. <b class="mono">${kdnr(v.kundennummer)}</b></span>
        <span>${eur(v.betrag)} + ${eur(v.gebuehr)} Gebühr = <b>${eur(v.betrag + v.gebuehr)}</b></span>${v.zweck ? `<span>${esc(v.zweck)}</span>` : ''}</div>`;
    }
    const v = c.vars;
    const kd = `<span>Kd-Nr. <b class="mono">${kdnr(v.kundennummer)}</b></span>`;
    if (c.type === 'KONTO') return `<div class="c-vars">${kd}<span>${esc(v.name)}</span><span>Kontostand <b class="${v.kontostand < 0 ? 'neg' : ''}">${eur(v.kontostand)}</b></span><span class="muted">🔒 Geb. ${dmy(v.geburtsdatum)}</span></div>`;
    if (c.type === 'ADR') return `<div class="c-vars">${kd}<span>${esc(v.name)}</span><span>${esc(v.strasse)}, ${esc(v.plz)} ${esc(v.ort)}</span><span class="muted">🔒 Geb. ${dmy(v.geburtsdatum)}</span></div>`;
    if (c.type === 'DOK') return `<div class="c-vars">${kd}<span><b>${esc(v.dokument)}</b></span>${v.frist ? `<span>Frist ${dmy(v.frist)}</span>` : ''}<span>Niveau ${esc(v.niveau)}</span><span class="muted">🔒 ${esc(v.name)}, ${dmy(v.geburtsdatum)}</span></div>`;
    return `<div class="c-vars"><span><b>${esc(v.titel)}</b></span><span class="mono small">${esc(v.url)}</span></div>`;
  }

  function renderCodes() {
    const list = codes.filter((c) => filter === 'alle' || c.status === filter || (filter === 'bezahlt' && c.status === 'erledigt'));
    if (!codes.length) {
      $('#codes').innerHTML = `<div class="empty"><p>Noch keine Codes. Lege links einen an oder starte mit Beispielen.</p><button class="btn" id="seed">Beispiel-Codes anlegen</button></div>`;
      $('#seed').onclick = seed;
      return;
    }
    if (!list.length) { $('#codes').innerHTML = '<p class="empty">Keine Codes mit diesem Status.</p>'; return; }
    $('#codes').innerHTML = list.map((c) => {
      const expired = c.expires_at && new Date(c.expires_at) < new Date();
      return `
      <article class="code" id="code-${c.id}">
        <button class="c-qr" data-act="qr" data-id="${c.id}" aria-label="QR-Code groß anzeigen"><img src="${c.qr}" alt="" loading="lazy"></button>
        <div class="c-main">
          <div class="c-top"><span class="c-id mono">${c.id}</span><span class="badge s-${c.status}">${STATUS[c.status]}</span>${expired ? '<span class="badge s-deaktiviert">abgelaufen</span>' : ''}<span class="c-label">${esc(c.label)}</span></div>
          ${summary(c)}
          <div class="c-meta"><span>v${c.version}</span><span>${c.scans} Scans</span>${['PAY', 'KONTO'].includes(c.type) ? `<span>${c.attempts} Zahlversuche${c.last_payment ? `, zuletzt ${PSTATUS[c.last_payment]}` : ''}</span>` : ''}
            <span>${c.expires_at ? `gültig bis ${new Date(c.expires_at).toLocaleDateString('de-DE')}` : 'unbegrenzt'}</span>${c.single_use ? '<span>Einmal-Code</span>' : ''}</div>
          <div class="c-actions">
            <button class="btn sm" data-act="sim" data-id="${c.id}">▶ Simulation starten</button>
            <button class="btn ghost sm" data-act="qr" data-id="${c.id}">QR</button>
            <button class="btn ghost sm" data-act="log" data-id="${c.id}">Verlauf</button>
            <button class="btn ghost sm" data-act="edit" data-id="${c.id}">Bearbeiten</button>
            ${c.status === 'aktiv' ? `<button class="btn ghost sm" data-act="off" data-id="${c.id}">Deaktivieren</button>`
              : `<button class="btn ghost sm" data-act="on" data-id="${c.id}">${['bezahlt', 'erledigt'].includes(c.status) ? 'Wieder öffnen' : 'Aktivieren'}</button>`}
            <button class="btn ghost sm danger" data-act="del" data-id="${c.id}" aria-label="Löschen">Löschen</button>
          </div>
        </div>
      </article>`;
    }).join('');
  }

  const flash = (id) => { const el = document.getElementById(`code-${id}`); if (el) { el.classList.add('flash'); el.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } };

  $('#codes').onclick = async (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const c = codes.find((x) => x.id === b.dataset.id);
    const act = b.dataset.act;
    try {
      if (act === 'sim') openSim(c, true);
      if (act === 'log') openSim(c, false);
      if (act === 'qr') openQr(c);
      if (act === 'edit') openEdit(c);
      if (act === 'off' || act === 'on') { await api(`/api/codes/${c.id}/status`, { method: 'POST', body: { status: act === 'on' ? 'aktiv' : 'deaktiviert' } }); await loadCodes(); }
      if (act === 'del' && confirm(`${c.id} mit allen Zahlungen und dem Verlauf löschen?`)) { await api(`/api/codes/${c.id}`, { method: 'DELETE' }); toast(`${c.id} gelöscht`); await loadCodes(); }
    } catch (err) { toast(err.message); }
  };

  $('#filters').onclick = (e) => {
    const b = e.target.closest('button'); if (!b) return;
    filter = b.dataset.f;
    $('#filters').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    renderCodes();
  };

  async function seed() {
    await api('/api/codes', { method: 'POST', body: { type: 'INFO', label: 'Infoseite', vars: { titel: 'So funktioniert QR-Pay', url: '/info' }, validDays: 0, singleUse: false } });
    const k = randomKdnr();
    await api('/api/codes', { method: 'POST', body: { type: 'PAY', label: 'Stromrechnung Oktober', vars: { kundennummer: k, betrag: '89,40', gebuehr: '1,50', zweck: 'Rechnung 2026-104' }, validDays: 7, singleUse: true } });
    const frist = new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);
    await api('/api/codes', { method: 'POST', body: { type: 'DOK', label: 'Zuzahlungsbefreiung', vars: { kundennummer: randomKdnr(), dokument: 'Befreiungsbescheinigung 2027', frist, niveau: 'substanziell', name: 'Max Mustermann', geburtsdatum: '1985-03-14' }, validDays: 30, singleUse: true } });
    await api('/api/codes', { method: 'POST', body: { type: 'ADR', label: 'Adressänderung', vars: { kundennummer: k, name: 'Max Mustermann', geburtsdatum: '1985-03-14', strasse: 'Hauptstraße 12', plz: '50667', ort: 'Köln' }, validDays: 30, singleUse: true } });
    await api('/api/codes', { method: 'POST', body: { type: 'KONTO', label: 'Kundenkonto', vars: { kundennummer: k, name: 'Max Mustermann', geburtsdatum: '1985-03-14', kontostand: -4520 }, validDays: 0, singleUse: false } });
    await api('/api/codes', { method: 'POST', body: { type: 'PAY', label: 'Werkstatt Inspektion', vars: { kundennummer: randomKdnr(), betrag: '249,00', gebuehr: '2,90', zweck: 'Auftrag 5531' }, validDays: 30, singleUse: true } });
    await loadCodes();
  }

  // --- Dialoge -------------------------------------------------------------

  document.querySelectorAll('dialog').forEach((d) => {
    d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-close]')) d.close(); });
  });

  // Jede Logzeile gehört zu einer Komponente. Der Filter zeigt, wo programmiert werden muss.
  const COMPONENTS = [
    { id: 'manager', name: 'Code-Manager', short: 'Manager', art: 'eigen', hint: 'Codes anlegen, ändern, sperren' },
    { id: 'handy', name: 'Handy-Frontend', short: 'Handy', art: 'eigen', hint: 'Scan, Anzeige, Formulare' },
    { id: 'link', name: 'Link-Management', short: 'Link', art: 'eigen', hint: 'Signatur, Version, Status, Anmeldung, Sitzung' },
    { id: 'vorgang', name: 'Vorgangslogik', short: 'Vorgang', art: 'eigen', hint: 'Adresse, Dokument, Kontostand' },
    { id: 'zahlung', name: 'Zahlungslogik', short: 'Zahlung', art: 'eigen', hint: 'Zahlung anlegen, abgleichen, verbuchen' },
    { id: 'uebergabe', name: 'Übergabe Fachsystem', short: 'Übergabe', art: 'offen', hint: 'Platzhalter, Schnittstelle noch nicht gebaut' },
    { id: 'zahlungsdienst', name: 'Zahlungsdienst', short: 'Zahldienst', art: 'extern', hint: 'PayPal, Wero, Karte … (simuliert)' },
    { id: 'ident', name: 'Ident-Dienst', short: 'Ident', art: 'extern', hint: 'eID, Video, Bank (simuliert)' },
  ];
  const COMP = Object.fromEntries(COMPONENTS.map((c) => [c.id, c]));
  const ARTS = { eigen: 'Eigenentwicklung', extern: 'Extern angebunden', offen: 'Noch zu bauen' };
  // Ältere Einträge kennen nur "server" und "anbieter"
  const compOf = (e) => (e.actor === 'simulation' ? 'handy'
    : e.actor === 'server' ? (e.payment_id ? 'zahlung' : 'link')
    : e.actor === 'anbieter' ? (e.payment_id ? 'zahlungsdienst' : 'ident')
    : COMP[e.actor] ? e.actor : 'link');
  const shown = new Set(); // leer = alle
  let simEvents = [];

  function renderFilter() {
    const count = (ids) => simEvents.filter((e) => ids.includes(e.comp)).length;
    const chip = (c) => `<button type="button" class="chip c-${c.id}${shown.has(c.id) ? ' on' : ''}${count([c.id]) ? '' : ' zero'}" data-comp="${c.id}" title="${esc(c.hint)}">${esc(c.name)} <b>${count([c.id])}</b></button>`;
    const group = (art) => {
      const ids = COMPONENTS.filter((c) => c.art === art).map((c) => c.id);
      const on = shown.size && ids.length === shown.size && ids.every((id) => shown.has(id));
      return `<button type="button" class="grp g-${art}${on ? ' on' : ''}" data-art="${art}">${ARTS[art]} <b>${count(ids)}</b></button>`;
    };
    $('#sim-filter').innerHTML = `
      <div class="grps"><button type="button" class="grp${shown.size ? '' : ' on'}" data-all>Alle <b>${simEvents.length}</b></button>${Object.keys(ARTS).map(group).join('')}</div>
      <div class="chips">${COMPONENTS.map(chip).join('')}</div>`;
    for (const li of $('#sim-log').children) li.hidden = shown.size > 0 && !shown.has(li.dataset.comp);
  }
  $('#sim-filter').addEventListener('click', (ev) => {
    const b = ev.target.closest('button');
    if (!b) return;
    if (b.dataset.all !== undefined) shown.clear();
    else if (b.dataset.art) {
      const ids = COMPONENTS.filter((c) => c.art === b.dataset.art).map((c) => c.id);
      const same = ids.length === shown.size && ids.every((id) => shown.has(id));
      shown.clear();
      if (!same) ids.forEach((id) => shown.add(id));
    } else shown.has(b.dataset.comp) ? shown.delete(b.dataset.comp) : shown.add(b.dataset.comp);
    renderFilter();
  });
  $('#filter-on').onchange = (ev) => {
    const on = ev.target.checked;
    $('#sim-filter').hidden = !on;
    $('#log-copy').hidden = !on;
    if (!on) shown.clear();
    renderFilter();
  };
  $('#log-copy').onclick = async () => {
    const rows = simEvents.filter((e) => !shown.size || shown.has(e.comp));
    const filter = shown.size ? [...shown].map((id) => COMP[id].name).join(', ') : 'alle Komponenten';
    const text = [`Verlauf ${simCode.id} (${simCode.label}), Filter: ${filter}`, '',
      ...rows.map((e) => `${time(e.ts)}  ${COMP[e.comp].name.padEnd(20)} ${ARTS[COMP[e.comp].art].padEnd(18)} ${e.message}`)].join('\n');
    try { await navigator.clipboard.writeText(text); toast(`${rows.length} Zeilen kopiert`); } catch { toast('Kopieren nicht möglich'); }
  };

  let poll = null, lastEvent = 0, simCode = null;
  function openSim(c, withPhone) {
    simCode = c;
    const d = $('#dlg-sim');
    d.classList.toggle('no-phone', !withPhone);
    $('#sim-title').textContent = withPhone ? `Simulation ${c.id}` : `Verlauf ${c.id}`;
    $('#sim-sub').textContent = c.label;
    $('#sim-log').innerHTML = '';
    $('#sim-payments').innerHTML = '';
    lastEvent = 0;
    simEvents = [];
    renderFilter();
    const url = `/s/${c.token}`;
    $('#sim-frame').src = withPhone ? url : 'about:blank';
    $('#sim-open').href = url;
    d.showModal();
    fetchEvents();
    clearInterval(poll);
    poll = setInterval(fetchEvents, 1000);
  }
  $('#sim-restart').onclick = () => { $('#sim-frame').src = `/s/${simCode.token}`; };
  $('#dlg-sim').addEventListener('close', () => { clearInterval(poll); $('#sim-frame').src = 'about:blank'; loadCodes(); });

  async function fetchEvents() {
    if (!simCode) return;
    const r = await api(`/api/codes/${simCode.id}/events?after=${lastEvent}`).catch(() => null);
    if (!r) return;
    const log = $('#sim-log');
    for (const e of r.events) {
      lastEvent = e.id;
      e.comp = compOf(e);
      simEvents.push(e);
      const c = COMP[e.comp];
      const li = document.createElement('li');
      li.className = `k-${e.kind} c-${c.id}`;
      li.dataset.comp = c.id;
      li.innerHTML = `<time>${time(e.ts)}</time><span class="actor" title="${esc(c.name)} · ${ARTS[c.art]}">${esc(c.short)}</span><span class="msg">${esc(e.message)}${e.payment_id ? ` <i class="mono">${esc(e.payment_id)}</i>` : ''}</span>`;
      log.appendChild(li);
    }
    if (r.events.length) { renderFilter(); log.scrollTop = log.scrollHeight; }
    const subs = (r.submissions || []).map((x) => x.kind === 'adresse'
      ? `<tr><td class="mono">${esc(x.id)}</td><td>Adresse</td><td colspan="2">${esc(x.alt.strasse)}, ${esc(x.alt.plz)} ${esc(x.alt.ort)} → <b>${esc(x.neu.strasse)}, ${esc(x.neu.plz)} ${esc(x.neu.ort)}</b> ab ${dmy(x.neu.ab)}</td></tr>`
      : `<tr><td class="mono">${esc(x.id)}</td><td>Dokument</td><td><a href="/api/eingang/${esc(x.id)}/datei" target="_blank" rel="noopener">${esc(x.filename)}</a> · ${Math.max(1, Math.round(x.size / 1024))} KB</td><td><span class="badge p-bezahlt">${esc(x.ident)} · ${esc(x.niveau)}</span></td></tr>`).join('');
    $('#sim-subs').innerHTML = subs ? `<h4>Eingänge (verschlüsselt gespeichert)</h4><table><tbody>${subs}</tbody></table>` : '';
    $('#sim-payments').innerHTML = r.payments.length ? `<h4>Zahlungen zu diesem Code</h4><table><tbody>${r.payments.map((p) =>
      `<tr><td class="mono">${esc(p.id)}</td><td>${esc(p.methodName)}</td><td>${eur(p.total)}</td><td><span class="badge p-${p.status}">${PSTATUS[p.status]}</span></td></tr>`).join('')}</tbody></table>` : '';
  }

  function openQr(c) {
    $('#qr-title').textContent = c.id;
    $('#qr-sub').textContent = c.label;
    $('#qr-img').src = c.qr;
    $('#qr-open').href = c.scanUrl;
    const local = /^http:\/\/(10\.|192\.168\.|172\.)/.test(c.scanUrl);
    $('#qr-hint').innerHTML = local
      ? `Das Handy muss im selben WLAN sein. Der Code zeigt auf <span class="mono">${esc(new URL(c.scanUrl).host)}</span>.`
      : /localhost|127\.0\.0\.1/.test(c.scanUrl) ? 'Achtung: Der Code zeigt auf localhost, das Handy erreicht ihn nicht. PUBLIC_URL setzen.' : 'Mit der Handy-Kamera scannen.';
    const [body, sig] = c.token.split('.');
    let payload = '';
    try { payload = JSON.stringify(JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/'))), null, 2); } catch {}
    $('#qr-token').textContent = `${payload}\n\nSignatur (HMAC-SHA256):\n${sig}\n\nURL (${c.scanUrl.length} Zeichen):\n${c.scanUrl}`;
    $('#dlg-qr').showModal();
  }
  $('#qr-copy').onclick = async () => { try { await navigator.clipboard.writeText($('#qr-open').href); toast('Link kopiert'); } catch { toast('Kopieren nicht möglich'); } };

  function openEdit(c) {
    const type = types.find((t) => t.id === c.type);
    $('#edit-sub').textContent = `${c.id} · ${type.name} · Version ${c.version}`;
    const form = $('#edit-form');
    form.dataset.type = c.type;
    form.dataset.id = c.id;
    form.innerHTML = `
      <label class="f">Bezeichnung<input name="label" value="${esc(c.label)}"></label>
      <div class="vars">${fieldsHtml(type, c.vars)}</div>
      <div class="f-row">
        <label class="f">Gültigkeit<select name="validDays"><option value="">beibehalten</option><option value="0">unbegrenzt</option><option value="1">1 Tag ab jetzt</option><option value="7">7 Tage ab jetzt</option><option value="30">30 Tage ab jetzt</option></select></label>
        <label class="check"><input type="checkbox" name="singleUse" ${c.single_use ? 'checked' : ''}> Einmal-Code</label>
      </div>
      <div class="sum-preview" id="edit-preview"></div>
      <div class="row"><button class="btn" type="submit">Speichern</button><button class="btn ghost" type="button" data-close>Abbrechen</button></div>`;
    $('#dlg-edit').showModal();
  }
  $('#edit-form').onsubmit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const d = formData(form);
    if (d.validDays === '') delete d.validDays;
    try {
      const c = await api(`/api/codes/${form.dataset.id}`, { method: 'PUT', body: d });
      $('#dlg-edit').close();
      toast(`${c.id} gespeichert (Version ${c.version})`);
      await loadCodes();
      flash(c.id);
    } catch (err) { showErrors(form, err.errors); toast(err.message); }
  };

  // --- Laden --------------------------------------------------------------

  async function loadCodes() { codes = await api('/api/codes'); renderCodes(); }

  async function init() {
    [info, types] = await Promise.all([api('/api/info'), api('/api/types')]);
    $('#meta').innerHTML = `<span title="Adresse, die in den QR-Codes steht">QR zeigt auf <b class="mono">${esc(new URL(info.baseUrl).host)}</b></span><span${/temporär/.test(info.db) ? " style=\"color:#fbbf24\"" : ""}>DB: ${esc(info.db)}</span>`;
    $('#types').innerHTML = types.map((t) => `<div class="type"><span class="badge type-badge">${t.id}</span><div><b>${esc(t.name)}</b><p>${esc(t.description)}</p>
      <small>Variablen: ${t.schema.map((f) => `${esc(f.label.replace(/ \(.*\)/, ''))}${f.secret ? ' 🔒' : ''}${f.required ? '' : ' (optional)'}`).join(', ')}${t.auth ? ` · Anmeldung: ${t.auth === 'ident' ? 'Ident-Verfahren' : 'Geburtsdatum'}` : ''}</small></div></div>`).join('');
    renderCreate('PAY');
    await loadCodes();
  }
  init().catch((e) => { $('#codes').innerHTML = `<p class="empty">Fehler beim Laden: ${esc(e.message)}</p>`; });
})();
