// Service 1: QR-Code-Manager im Browser
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const eur = (c) => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format((c || 0) / 100);
  const money = (c) => ((c || 0) / 100).toFixed(2).replace('.', ',');
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
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
  const STATUS = { aktiv: 'Aktiv', deaktiviert: 'Deaktiviert', bezahlt: 'Bezahlt' };
  const PSTATUS = { gestartet: 'läuft', bezahlt: 'bezahlt', abgebrochen: 'abgebrochen', abgelehnt: 'abgelehnt', 'zeitüberschreitung': 'Timeout' };
  const randomKdnr = () => Array.from({ length: 12 }, (_, i) => (i === 0 ? 1 + Math.floor(Math.random() * 9) : Math.floor(Math.random() * 10))).join('');

  // --- Formular aus dem Schema der Code-Art ---------------------------------

  function fieldsHtml(type, values = {}) {
    return type.schema.map((f) => {
      let v = values[f.key];
      if ((f.kind === 'money' || f.kind === 'money0') && Number.isInteger(v)) v = money(v);
      const mode = f.kind === 'digits12' ? 'numeric' : f.kind.startsWith('money') ? 'decimal' : f.kind === 'url' ? 'url' : 'text';
      return `<label class="f" data-key="${f.key}">${esc(f.label)}${f.required ? '' : ' <i>optional</i>'}
        <input name="${f.key}" value="${esc(v ?? '')}" inputmode="${mode}" placeholder="${esc(f.hint || '')}" ${f.kind === 'digits12' ? 'maxlength="15"' : ''} autocomplete="off">
        <em class="err"></em></label>`;
    }).join('');
  }

  function renderCreate(typeId = 'PAY') {
    const type = types.find((t) => t.id === typeId);
    const sample = typeId === 'PAY'
      ? { kundennummer: randomKdnr(), betrag: '49,90', gebuehr: '1,50', zweck: `Rechnung 2026-${100 + Math.floor(Math.random() * 900)}` }
      : { titel: 'Produktseite', url: 'https://example.com' };
    $('#create-form').innerHTML = `
      <label class="f">Code-Art
        <select name="type">${types.map((t) => `<option value="${t.id}" ${t.id === typeId ? 'selected' : ''}>${t.id} · ${esc(t.name)}</option>`).join('')}</select></label>
      <label class="f">Bezeichnung <i>intern</i><input name="label" value="${typeId === 'PAY' ? 'Rechnung Kunde' : 'Info-Link'}" autocomplete="off"></label>
      <div class="vars">${fieldsHtml(type, sample)}</div>
      <div class="f-row">
        <label class="f">Gültig<select name="validDays"><option value="0">unbegrenzt</option><option value="1">1 Tag</option><option value="7" selected>7 Tage</option><option value="30">30 Tage</option></select></label>
        <label class="check"><input type="checkbox" name="singleUse" ${typeId === 'PAY' ? 'checked' : ''}> Einmal-Code<small>nach Zahlung gesperrt</small></label>
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
    return `<div class="c-vars"><span><b>${esc(c.vars.titel)}</b></span><span class="mono small">${esc(c.vars.url)}</span></div>`;
  }

  function renderCodes() {
    const list = codes.filter((c) => filter === 'alle' || c.status === filter);
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
          <div class="c-meta"><span>v${c.version}</span><span>${c.scans} Scans</span>${c.type === 'PAY' ? `<span>${c.attempts} Zahlversuche${c.last_payment ? `, zuletzt ${PSTATUS[c.last_payment]}` : ''}</span>` : ''}
            <span>${c.expires_at ? `gültig bis ${new Date(c.expires_at).toLocaleDateString('de-DE')}` : 'unbegrenzt'}</span>${c.single_use ? '<span>Einmal-Code</span>' : ''}</div>
          <div class="c-actions">
            <button class="btn sm" data-act="sim" data-id="${c.id}">▶ Simulation starten</button>
            <button class="btn ghost sm" data-act="qr" data-id="${c.id}">QR</button>
            <button class="btn ghost sm" data-act="log" data-id="${c.id}">Verlauf</button>
            <button class="btn ghost sm" data-act="edit" data-id="${c.id}">Bearbeiten</button>
            ${c.status === 'aktiv' ? `<button class="btn ghost sm" data-act="off" data-id="${c.id}">Deaktivieren</button>`
              : `<button class="btn ghost sm" data-act="on" data-id="${c.id}">${c.status === 'bezahlt' ? 'Wieder öffnen' : 'Aktivieren'}</button>`}
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
    await api('/api/codes', { method: 'POST', body: { type: 'INFO', label: 'Infoseite', vars: { titel: 'So funktioniert QR-Pay', url: 'https://example.com' }, validDays: 0, singleUse: false } });
    const k = randomKdnr();
    await api('/api/codes', { method: 'POST', body: { type: 'PAY', label: 'Stromrechnung Oktober', vars: { kundennummer: k, betrag: '89,40', gebuehr: '1,50', zweck: 'Rechnung 2026-104' }, validDays: 7, singleUse: true } });
    await api('/api/codes', { method: 'POST', body: { type: 'PAY', label: 'Werkstatt Inspektion', vars: { kundennummer: randomKdnr(), betrag: '249,00', gebuehr: '2,90', zweck: 'Auftrag 5531' }, validDays: 30, singleUse: true } });
    await loadCodes();
  }

  // --- Dialoge -------------------------------------------------------------

  document.querySelectorAll('dialog').forEach((d) => {
    d.addEventListener('click', (e) => { if (e.target === d || e.target.closest('[data-close]')) d.close(); });
  });

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
      const li = document.createElement('li');
      li.className = `k-${e.kind} a-${e.actor}`;
      li.innerHTML = `<time>${time(e.ts)}</time><span class="actor">${esc(e.actor)}</span><span class="msg">${esc(e.message)}${e.payment_id ? ` <i class="mono">${esc(e.payment_id)}</i>` : ''}</span>`;
      log.appendChild(li);
    }
    if (r.events.length) log.scrollTop = log.scrollHeight;
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
    $('#meta').innerHTML = `<span title="Adresse, die in den QR-Codes steht">QR zeigt auf <b class="mono">${esc(new URL(info.baseUrl).host)}</b></span><span>DB: ${esc(info.db)}</span>`;
    $('#types').innerHTML = types.map((t) => `<div class="type"><span class="badge type-badge">${t.id}</span><div><b>${esc(t.name)}</b><p>${esc(t.description)}</p>
      <small>Variablen: ${t.schema.map((f) => `${esc(f.label.replace(/ \(.*\)/, ''))}${f.required ? '' : ' (optional)'}`).join(', ')}</small></div></div>`).join('');
    renderCreate('PAY');
    await loadCodes();
  }
  init().catch((e) => { $('#codes').innerHTML = `<p class="empty">Fehler beim Laden: ${esc(e.message)}</p>`; });
})();
