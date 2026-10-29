// Hilfe-Seite: Erzeugung, Komponenten, Prüfungen je Code-Art, Abläufe, nicht gebaute Teile
(() => {
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const small = matchMedia('(max-width: 700px)');

  const head = '<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" class="ah"/></marker>'
    + '<marker id="ahh" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" style="fill:var(--hi)"/></marker></defs>';
  const wire = (d, todo) => `<path class="wire${todo ? ' todo' : ''}" d="${d}" marker-end="url(#ah)"/>`;
  const node = (x, y, w, h, t, s, cls = '') => `<g class="n ${cls}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/>`
    + `<text class="t" x="${x + w / 2}" y="${y + (s ? h / 2 - 3 : h / 2 + 5)}" text-anchor="middle">${esc(t)}</text>`
    + (s ? `<text class="s" x="${x + w / 2}" y="${y + h / 2 + 13}" text-anchor="middle">${esc(s)}</text>` : '') + '</g>';

  // Komponenten
  function mapDesktop() {
    const W = 150, H = 50;
    return `<svg viewBox="0 0 1000 172" role="img" aria-label="Komponenten">${head}`
      + node(0, 0, W, H, 'Generator', 'Codes erstellen')
      + node(0, 120, W, H, 'Handy', 'Code scannen')
      + node(210, 60, W, H, 'Link-Dienst', 'Code prüfen')
      + node(420, 60, W, H, 'Vorgang', 'Zugang, Ausführung')
      + node(630, 0, W, H, 'Zahlungsdienst', 'Zahlung', 'ext')
      + node(630, 120, W, H, 'Ident-Dienst', 'Identifizierung', 'ext')
      + node(840, 60, W, H, 'Übergabe', 'an Fachseite', 'todo')
      + wire('M150 25 H180 V75 H208') + wire('M150 145 H180 V95 H208')
      + wire('M360 85 H418')
      + wire('M570 75 H600 V25 H628') + wire('M570 95 H600 V145 H628')
      + wire('M570 85 H838', true)
      + '</svg>';
  }
  function mapMobile() {
    const W = 160, H = 50;
    return `<svg viewBox="0 0 360 420" role="img" aria-label="Komponenten">${head}`
      + node(0, 0, W, H, 'Generator', 'Codes erstellen')
      + node(200, 0, W, H, 'Handy', 'Code scannen')
      + node(100, 90, W, H, 'Link-Dienst', 'Code prüfen')
      + node(100, 180, W, H, 'Vorgang', 'Zugang, Ausführung')
      + node(0, 270, W, H, 'Zahlungsdienst', 'Zahlung', 'ext')
      + node(200, 270, W, H, 'Ident-Dienst', 'Identifizierung', 'ext')
      + node(100, 365, W, H, 'Übergabe', 'an Fachseite', 'todo')
      + wire('M80 50 V70 H160 V88') + wire('M280 50 V70 H200 V88')
      + wire('M180 140 V178')
      + wire('M150 230 V250 H80 V268') + wire('M210 230 V250 H280 V268')
      + wire('M180 230 V363', true)
      + '</svg>';
  }

  // Erzeugung und Zustellung
  const lbl = (x, y, t, a = 'middle') => `<text class="wl" x="${x}" y="${y}" text-anchor="${a}">${esc(t)}</text>`;
  function supplyDesktop() {
    const W = 140, H = 50;
    return `<svg viewBox="0 0 1000 212" role="img" aria-label="Erzeugung und Zustellung">${head}`
      + node(0, 0, 160, H, 'Generator', 'Codes signieren')
      + node(0, 160, 160, H, 'Fachseite', 'Stammdaten, Vorgangsart', 'ext')
      + wire('M40 158 V62', true) + lbl(46, 104, 'Auftrag', 'start')
      + wire('M120 52 V148', true) + lbl(114, 122, 'Code, Link', 'end')
      + node(220, 0, W, H, 'Brief', 'QR-Code gedruckt', 'ext')
      + node(220, 80, W, H, 'Dokument', 'QR-Code und Link', 'ext')
      + node(220, 160, W, H, 'E-Mail', 'Link', 'ext')
      + wire('M160 185 H190 V25 H218') + wire('M190 105 H218') + wire('M190 185 H218')
      + node(440, 0, W, H, 'Druckdienstleister', 'Druck, Versand', 'ext')
      + wire('M360 25 H438')
      + node(660, 80, W, H, 'Empfänger', 'Scan oder Klick')
      + wire('M580 25 H620 V95 H658') + wire('M360 105 H658') + wire('M360 185 H620 V115 H658')
      + node(860, 80, W, H, 'Link-Dienst', 'Code prüfen')
      + wire('M800 105 H858')
      + '</svg>';
  }
  function supplyMobile() {
    const W = 110, H = 50;
    return `<svg viewBox="0 0 360 440" role="img" aria-label="Erzeugung und Zustellung">${head}`
      + node(0, 0, 150, H, 'Generator', 'Codes signieren')
      + node(210, 0, 150, H, 'Fachseite', 'Stammdaten', 'ext')
      + wire('M208 18 H152', true) + wire('M152 34 H208', true)
      + lbl(180, 68, 'Auftrag ← · → Code, Link')
      + node(0, 100, W, H, 'Brief', 'gedruckt', 'ext')
      + node(125, 100, W, H, 'Dokument', 'Code, Link', 'ext')
      + node(250, 100, W, H, 'E-Mail', 'Link', 'ext')
      + wire('M285 50 V80 H55 V98') + wire('M180 80 V98') + wire('M285 80 H305 V98')
      + node(0, 190, W, H, 'Druck', 'Versand', 'ext')
      + wire('M55 150 V188')
      + node(100, 290, 160, H, 'Empfänger', 'Scan oder Klick')
      + wire('M55 240 V266 H150 V288') + wire('M180 150 V288') + wire('M305 150 V266 H210 V288')
      + node(100, 380, 160, H, 'Link-Dienst', 'Code prüfen')
      + wire('M180 340 V378')
      + '</svg>';
  }

  // Prüfungen je Code-Art: y umgesetzt, o nicht gebaut, n entfällt
  const COLS = ['INFO', 'PAY', 'KONTO', 'ADR', 'DOK'];
  const MATRIX = [
    ['Signatur', 'yyyyy'],
    ['Version', 'yyyyy'],
    ['Status und Ablaufdatum', 'yyyyy'],
    ['Anmeldung mit Geburtsdatum', 'nnyyn'],
    ['Identifizierung mit Vertrauensniveau', 'nnnny'],
    ['Signierte Sitzung', 'nnyyy'],
    ['Zahlung über Anbieter', 'nyynn'],
    ['Verschlüsselte Ablage', 'nnnny'],
    ['Einmal-Code (Standard)', 'nynyy'],
    ['Weiterleitung auf Ziel', 'ynnnn'],
    ['Rate-Limit', 'ooooo'],
    ['Übergabe an Fachseite', 'noooo'],
  ];
  function renderMatrix() {
    const t = $('#matrix');
    t.innerHTML = `<thead><tr><th></th>${COLS.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody>`
      + MATRIX.map(([l, v]) => `<tr${v.includes('o') ? ' class="todo"' : ''}><td>${esc(l)}</td>`
        + [...v].map((c) => `<td class="${c}" aria-label="${{ y: 'umgesetzt', o: 'nicht gebaut', n: 'entfällt' }[c]}"></td>`).join('') + '</tr>').join('')
      + '</tbody>';
    if (!t.nextElementSibling) t.insertAdjacentHTML('afterend', '<div class="mx-note">● umgesetzt · ○ nicht gebaut · – entfällt</div>');
  }

  // Abläufe
  const LANES = { H: 'Handy', L: 'Link-Dienst', V: 'Vorgang', X: 'Extern', F: 'Fachseite' };
  const LX = { H: 80, L: 240, V: 400, X: 560, F: 720 };
  const scan = [
    { f: 'H', t: 'L', l: 'Code aufrufen' },
    { f: 'L', t: 'L', l: 'Signatur, Version, Status', p: 'Code prüfen' },
  ];
  const FLOWS = {
    INFO: [...scan,
      { f: 'L', t: 'H', l: 'Weiterleitung auf Ziel' }],
    PAY: [...scan,
      { f: 'L', t: 'V', l: 'Zahlung öffnen' },
      { f: 'V', t: 'H', l: 'Betrag anzeigen' },
      { f: 'H', t: 'X', l: 'Zahlung beim Anbieter' },
      { f: 'X', t: 'V', l: 'Bestätigung', p: 'Rückmeldung prüfen' },
      { f: 'V', t: 'V', l: 'Einmal-Code entwerten', p: 'Einmal-Code' },
      { f: 'V', t: 'F', l: 'Übergabe', todo: true }],
    KONTO: [...scan,
      { f: 'L', t: 'V', l: 'Anmeldung anfordern' },
      { f: 'H', t: 'V', l: 'Geburtsdatum', p: 'Anmeldung' },
      { f: 'V', t: 'V', l: 'Sitzung signieren', p: 'Signierte Sitzung' },
      { f: 'V', t: 'H', l: 'Kontostand anzeigen' },
      { f: 'H', t: 'X', l: 'Zahlung beim Anbieter' },
      { f: 'X', t: 'V', l: 'Bestätigung', p: 'Rückmeldung prüfen' },
      { f: 'V', t: 'F', l: 'Übergabe', todo: true }],
    ADR: [...scan,
      { f: 'L', t: 'V', l: 'Anmeldung anfordern' },
      { f: 'H', t: 'V', l: 'Geburtsdatum', p: 'Anmeldung' },
      { f: 'V', t: 'V', l: 'Sitzung signieren', p: 'Signierte Sitzung' },
      { f: 'H', t: 'V', l: 'Neue Adresse' },
      { f: 'V', t: 'V', l: 'Einmal-Code entwerten', p: 'Einmal-Code' },
      { f: 'V', t: 'F', l: 'Übergabe', todo: true }],
    DOK: [...scan,
      { f: 'L', t: 'V', l: 'Identifizierung anfordern' },
      { f: 'H', t: 'X', l: 'Identifizieren' },
      { f: 'X', t: 'V', l: 'Ergebnis', p: 'Vertrauensniveau' },
      { f: 'V', t: 'V', l: 'Sitzung signieren', p: 'Signierte Sitzung' },
      { f: 'H', t: 'V', l: 'Dokument hochladen' },
      { f: 'V', t: 'V', l: 'Verschlüsselt ablegen', p: 'Verschlüsselte Ablage' },
      { f: 'V', t: 'V', l: 'Einmal-Code entwerten', p: 'Einmal-Code' },
      { f: 'V', t: 'F', l: 'Übergabe', todo: true }],
    Fehlerfälle: [
      { f: 'H', t: 'L', l: 'Code aufrufen' },
      { f: 'L', t: 'L', l: 'Signatur ungültig', p: 'Abbruch' },
      { f: 'L', t: 'L', l: 'Version veraltet', p: 'Abbruch' },
      { f: 'L', t: 'L', l: 'Gesperrt oder abgelaufen', p: 'Abbruch' },
      { f: 'V', t: 'V', l: 'Geburtsdatum falsch (KONTO, ADR)', p: 'Abbruch' },
      { f: 'X', t: 'V', l: 'Zahlung abgebrochen', p: 'Code bleibt gültig' },
      { f: 'L', t: 'H', l: 'Hinweis anzeigen' }],
  };
  let flow = 'PAY', cur = 0, playing = true, timer = null;

  function seqDesktop(steps) {
    const ROW = 40, TOP = 52, H = TOP + steps.length * ROW + 6;
    let s = `<svg viewBox="0 0 800 ${H}" role="img" aria-label="Ablauf ${esc(flow)}">${head}`;
    for (const [k, x] of Object.entries(LX)) {
      const cls = k === 'X' ? 'ext' : k === 'F' ? 'todo' : '';
      s += `<line class="lane-l" x1="${x}" y1="34" x2="${x}" y2="${H}"/>`
        + `<g class="lane-h ${cls}"><rect x="${x - 62}" y="4" width="124" height="28" rx="6"/><text x="${x}" y="23">${LANES[k]}</text></g>`;
    }
    steps.forEach((st, i) => {
      const y = TOP + i * ROW + 20;
      const state = i === cur ? 'now' : i > cur ? 'next' : '';
      let g = `<g class="st ${state}${st.todo ? ' todo' : ''}" data-i="${i}"><rect x="0" y="${y - 20}" width="800" height="${ROW}" fill="transparent"/>`
        + `<text class="num" x="6" y="${y + 4}">${i + 1}</text>`;
      if (st.p) g += `<circle class="pm" cx="28" cy="${y}" r="3"/>`;
      if (st.f === st.t) {
        const x = LX[st.f], w = Math.max(120, st.l.length * 7.4 + 24);
        g += `<rect class="bx${state === 'now' ? ' draw' : ''}" pathLength="1" x="${x - w / 2}" y="${y - 13}" width="${w}" height="26" rx="5"/>`
          + `<text class="lbl" x="${x}" y="${y + 5}">${esc(st.l)}</text>`;
      } else {
        const a = LX[st.f], b = LX[st.t], d = b > a ? -1 : 1;
        g += `<path class="ar${state === 'now' ? ' draw' : ''}" pathLength="1" d="M${a} ${y + 6} H${b + d * 2}" marker-end="url(#${state === 'now' ? 'ahh' : 'ah'})"/>`
          + `<text class="lbl" x="${(a + b) / 2}" y="${y - 1}">${esc(st.l)}</text>`;
      }
      s += g + '</g>';
    });
    return s + '</svg>';
  }

  function seqMobile(steps) {
    const xs = { H: 36, L: 108, V: 180, X: 252, F: 324 };
    const st = steps[cur];
    let s = `<div class="seq-strip"><svg viewBox="0 0 360 56" aria-hidden="true">${head}`;
    for (const [k, x] of Object.entries(xs)) {
      const on = k === st.f || k === st.t;
      s += `<text x="${x}" y="16" text-anchor="middle" style="font-size:11.5px;fill:${on ? 'var(--g1)' : 'var(--g3)'};font-weight:${on ? 600 : 400}">${LANES[k]}</text>`
        + `<circle cx="${x}" cy="36" r="3" style="fill:${on ? 'var(--hi)' : 'var(--g4)'}"/>`;
    }
    if (st.f !== st.t) {
      const a = xs[st.f], b = xs[st.t], d = b > a ? -1 : 1;
      s += `<path class="ar" style="stroke:var(--hi);stroke-width:1.75;fill:none${st.todo ? ';stroke-dasharray:5 4' : ''}" d="M${a - 6 * d} 36 H${b + d * 8}" marker-end="url(#ahh)"/>`;
    } else {
      s += `<rect x="${xs[st.f] - 14}" y="27" width="28" height="18" rx="4" style="fill:none;stroke:var(--hi);stroke-width:1.5"/>`;
    }
    s += '</svg></div><ol class="mlist">';
    steps.forEach((x, i) => {
      const state = i === cur ? 'now' : i > cur ? 'next' : '';
      const who = x.f === x.t ? LANES[x.f] : `${LANES[x.f]} → ${LANES[x.t]}`;
      s += `<li class="ms ${state}${x.todo ? ' todo' : ''}" data-i="${i}"><span class="n">${i + 1}</span>`
        + `<span class="b">${esc(x.l)}<small>${who}</small></span>${x.p ? `<span class="p">${esc(x.p)}</span>` : ''}</li>`;
    });
    return s + '</ol>';
  }

  function renderSeq() {
    const steps = FLOWS[flow];
    $('#seq').innerHTML = small.matches ? seqMobile(steps) : seqDesktop(steps);
    const st = steps[cur];
    $('#fs-count').textContent = `${cur + 1} / ${steps.length}`;
    $('#fs-title').textContent = st.l;
    const who = st.f === st.t ? LANES[st.f] : `${LANES[st.f]} → ${LANES[st.t]}`;
    $('#fs-chips').innerHTML = `<span>${esc(who)}</span>`
      + (st.p ? `<span>Prüfung: ${esc(st.p)}</span>` : '')
      + (st.todo ? '<span class="todo">nicht gebaut</span>' : '');
  }

  function go(i) {
    const n = FLOWS[flow].length;
    cur = (i + n) % n;
    renderSeq();
  }
  function setPlay(on) {
    playing = on;
    clearInterval(timer);
    $('#fs-play').textContent = on ? 'Ⅱ' : '▶';
    $('#fs-play').setAttribute('aria-label', on ? 'Pause' : 'Abspielen');
    if (on) timer = setInterval(() => go(cur + 1), 2400);
  }
  function setFlow(f) {
    flow = f;
    cur = 0;
    $('#flow-tabs').innerHTML = Object.keys(FLOWS).map((k) => `<button type="button" role="tab" data-f="${k}" class="${k === f ? 'on' : ''}" aria-selected="${k === f}">${k}</button>`).join('');
    renderSeq();
    setPlay(playing);
  }

  $('#flow-tabs').addEventListener('click', (e) => { const b = e.target.closest('button'); if (b) setFlow(b.dataset.f); });
  $('#seq').addEventListener('click', (e) => { const g = e.target.closest('[data-i]'); if (g) { setPlay(false); go(+g.dataset.i); } });
  $('#fs-prev').addEventListener('click', () => { setPlay(false); go(cur - 1); });
  $('#fs-next').addEventListener('click', () => { setPlay(false); go(cur + 1); });
  $('#fs-play').addEventListener('click', () => setPlay(!playing));

  // Nicht gebaut
  const SKETCHES = [
    ['Auftrag der Fachseite', ['Stammdaten und Vorgangsart', 'Codes signieren', 'Code und Link zurück']],
    ['Übergabe an die Fachseite', ['Vorgang abgeschlossen', 'Ereignis mit Vorgangs-ID', 'Quittung', 'Wiederholung bei Fehler']],
    ['Schlüsselrotation', ['Neuer Schlüssel', 'Alte Version parallel gültig', 'Alte Version läuft aus']],
    ['Support-Auskunft', ['Code-ID', 'Status und Verlauf', 'Sperren oder neu ausstellen']],
    ['Kurzlink', ['Kurze URL', 'Serverseitige Auflösung', 'Gleiche Prüfungen']],
    ['Missbrauchsschutz', ['Rate-Limit je Code und IP', 'Sperre nach Fehlversuchen', 'Eintrag im Verlauf']],
  ];
  function renderSketches() {
    $('#sketches').innerHTML = '<table class="skt"><tbody>' + SKETCHES.map(([t, chain]) => `<tr><th>${esc(t)}</th><td>${chain.map(esc).join('<span class="sa">→</span>')}</td></tr>`).join('') + '</tbody></table>';
  }

  function renderAll() {
    $('#map').innerHTML = small.matches ? mapMobile() : mapDesktop();
    $('#supply').innerHTML = small.matches ? supplyMobile() : supplyDesktop();
    renderSeq();
  }
  small.addEventListener('change', renderAll);

  renderMatrix();
  renderSketches();
  setFlow('PAY');
  renderAll();
})();
