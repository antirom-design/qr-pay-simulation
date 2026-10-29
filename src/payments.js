// Service 2: Bezahl-Usecase auf Basis eines PAY-Codes (Decoding, Zahlartwahl, simulierter Anbieter, Verbuchung)
const db = require('./db');
const C = require('./codes');
const { eur } = require('./format');

const METHODS = [
  { id: 'paypal', name: 'PayPal', sub: 'Mit PayPal-Konto bezahlen' },
  { id: 'wero', name: 'Wero', sub: 'Europäisches Bezahlen per Handy' },
  { id: 'bank', name: 'Banking-App', sub: 'Direkt aus deiner Bank-App freigeben' },
  { id: 'card', name: 'Kreditkarte', sub: 'Visa, Mastercard, Amex' },
  { id: 'applepay', name: 'Apple Pay', sub: 'Mit Face ID / Touch ID' },
  { id: 'googlepay', name: 'Google Pay', sub: 'Mit gespeicherter Karte' },
  { id: 'klarna', name: 'Klarna', sub: 'Sofort oder in 30 Tagen' },
  { id: 'sepa', name: 'SEPA-Lastschrift', sub: 'Abbuchung vom Girokonto' },
];
const METHOD = Object.fromEntries(METHODS.map((m) => [m.id, m]));
const STALE_MIN = 15;
const IDENTS = [
  { id: 'eid', name: 'Online-Ausweis', sub: 'Personalausweis ans Handy halten, PIN eingeben', niveau: 'hoch' },
  { id: 'video', name: 'Video-Ident', sub: 'Kurzes Video-Gespräch mit Ausweis', niveau: 'substanziell' },
  { id: 'bankident', name: 'Bank-Ident', sub: 'Mit deinem Online-Banking bestätigen', niveau: 'substanziell' },
];
const allowedIdents = (code) => IDENTS.filter((i) => code.vars.niveau !== 'hoch' || i.niveau === 'hoch');

// Kontostand = Startwert aus dem Code + alle bezahlten Ausgleichszahlungen
async function kontoState(code) {
  const r = await db.get(`SELECT CAST(COALESCE(SUM(total), 0) AS INTEGER) AS paid FROM payments WHERE code_id = ? AND status = 'bezahlt'`, [code.id]);
  const saldo = code.vars.kontostand + Number(r.paid);
  return { saldo, open: Math.max(0, -saldo) };
}

const getPayment = (id) => db.get('SELECT * FROM payments WHERE id = ?', [id]);
const paidPayment = (codeId) => db.get(`SELECT * FROM payments WHERE code_id = ? AND status = 'bezahlt' ORDER BY updated_at DESC LIMIT 1`, [codeId]);

// Angefangene, nie abgeschlossene Zahlungen laufen nach 15 Minuten ab
async function expireStale() {
  const limit = new Date(Date.now() - STALE_MIN * 60e3).toISOString();
  const stale = await db.all(`SELECT * FROM payments WHERE status = 'gestartet' AND created_at < ?`, [limit]);
  for (const p of stale) {
    await setPayment(p.id, 'zeitüberschreitung', `Keine Rückmeldung vom Anbieter innerhalb von ${STALE_MIN} Minuten`);
    await C.log(p.code_id, p.id, 'zahlung', 'warn', `Zahlung ${p.id} automatisch abgelaufen (keine Rückmeldung nach ${STALE_MIN} Min.)`);
  }
}

async function setPayment(id, status, reason, providerRef) {
  await db.run('UPDATE payments SET status = ?, reason = ?, provider_ref = COALESCE(?, provider_ref), updated_at = ? WHERE id = ?',
    [status, reason || null, providerRef || null, C.now(), id]);
}

/**
 * Prüft einen gescannten Token Schritt für Schritt. Jeder Schritt wird im Handy als Fortschritt angezeigt.
 * Bricht beim ersten Fehler ab, damit klar ist, woran es lag.
 */
async function decode(token, { source = 'handy', count = true, quiet = false } = {}) {
  const steps = [];
  const step = (label, ok, detail) => { steps.push({ label, ok, detail }); return ok; };
  const fail = async (error, codeId) => {
    if (codeId && !quiet) await C.log(codeId, null, 'link', 'fehler', `Scan abgelehnt: ${error}`);
    return { ok: false, steps, error };
  };

  step('QR-Code gelesen', true, `${String(token).length} Zeichen Nutzdaten`);
  const d = C.decodeToken(token);
  if (!step('Daten entschlüsselt (Base64 → JSON)', !!d.payload, d.payload ? Object.keys(d.payload.d || {}).join(', ') : 'Kein lesbarer Inhalt'))
    return fail('Der QR-Code enthält keine gültigen Daten.');

  const codeId = d.payload.id;
  const code = await C.getCode(codeId);
  if (!step('Signatur geprüft (HMAC-SHA256)', d.sigOk, d.sigOk ? 'Echt, nicht verändert' : 'Signatur passt nicht zum Inhalt'))
    return fail('Der Code wurde verändert oder gefälscht.', code && codeId);

  const type = await C.getType(d.payload.t);
  if (!step('Code-Art erkannt', !!type, type ? `${type.id} · ${type.name}` : `Unbekannt: ${d.payload.t}`))
    return fail('Diese Code-Art wird nicht unterstützt.');

  if (!step('Code in Datenbank gefunden', !!code, code ? code.id : codeId)) return fail('Dieser Code ist nicht (mehr) bekannt.');

  if (count) {
    await db.run('UPDATE codes SET scans = scans + 1 WHERE id = ?', [code.id]);
    await C.log(code.id, null, source, 'info', source === 'simulation' ? 'Code in der Simulation gescannt' : 'Code mit dem Handy gescannt');
  }

  if (!step('Aktuelle Version', d.payload.n === code.version, `Version ${d.payload.n}${d.payload.n === code.version ? '' : `, aktuell ist ${code.version}`}`))
    return fail('Dieser QR-Code ist veraltet. Der Inhalt wurde inzwischen geändert, bitte den neuen Code verwenden.', code.id);

  const paid = await paidPayment(code.id);
  if (code.status === 'bezahlt' && paid) {
    step('Status geprüft', true, 'Bereits bezahlt');
    if (!quiet) await C.log(code.id, null, 'link', 'info', 'Code ist bereits bezahlt, Beleg wird angezeigt');
    return { ok: true, steps, code: publicCode(code), alreadyPaid: publicPayment(paid) };
  }
  if (code.status === 'erledigt') {
    const sub = await db.get('SELECT * FROM submissions WHERE code_id = ? ORDER BY created_at DESC LIMIT 1', [code.id]);
    step('Status geprüft', true, 'Bereits erledigt');
    if (!quiet) await C.log(code.id, null, 'link', 'info', 'Vorgang ist bereits erledigt, Bestätigung wird angezeigt');
    return { ok: true, steps, code: publicCode(code), alreadyDone: sub && { id: sub.id, kind: sub.kind, createdAt: sub.created_at } };
  }
  if (!step('Code aktiv', code.status === 'aktiv', code.status)) return fail('Dieser Code wurde deaktiviert.', code.id);
  const expired = code.expires_at && new Date(code.expires_at) < new Date();
  if (!step('Gültigkeit', !expired, code.expires_at ? `bis ${new Date(code.expires_at).toLocaleString('de-DE')}` : 'unbegrenzt'))
    return fail('Dieser Code ist abgelaufen.', code.id);

  // Jede bestandene Prüfung einzeln protokollieren: das ist die Arbeit des Link-Managements
  if (!quiet) for (const s of steps) await C.log(code.id, null, 'link', 'info', `${s.label}: ${s.detail}`);

  if (code.type === 'PAY') {
    const v = code.vars;
    step('Endbetrag berechnet', true, `${eur(v.betrag)} + ${eur(v.gebuehr)} = ${eur(v.betrag + v.gebuehr)}`);
    if (!quiet) await C.log(code.id, null, 'link', 'ok', `Decoding erfolgreich, Endbetrag ${eur(v.betrag + v.gebuehr)}`);
  } else if (type.auth === 'geburtsdatum') {
    step('Anmeldung erforderlich', true, 'Geburtsdatum, max. 3 Versuche');
    if (!quiet) await C.log(code.id, null, 'link', 'ok', 'Decoding erfolgreich, Kunde muss sich mit dem Geburtsdatum anmelden');
  } else if (type.auth === 'ident') {
    step('Identifizierung erforderlich', true, `Vertrauensniveau ${code.vars.niveau}`);
    if (!quiet) await C.log(code.id, null, 'link', 'ok', `Decoding erfolgreich, Identifizierung mit Vertrauensniveau „${code.vars.niveau}“ nötig`);
  } else {
    if (!quiet) await C.log(code.id, null, 'link', 'ok', 'Decoding erfolgreich');
  }
  return { ok: true, steps, code: publicCode(code), auth: type.auth, methods: code.type === 'PAY' ? METHODS : undefined,
    idents: type.auth === 'ident' ? allowedIdents(code) : undefined };
}

function publicCode(code) {
  const out = { id: code.id, type: code.type, label: code.label, vars: C.publicVars(code.type, code.vars) };
  if (code.type === 'PAY') out.total = code.vars.betrag + code.vars.gebuehr;
  return out;
}
function publicPayment(p) {
  return p && { id: p.id, codeId: p.code_id, method: p.method, methodName: METHOD[p.method]?.name, amount: p.amount, fee: p.fee, total: p.total,
    status: p.status, reason: p.reason, providerRef: p.provider_ref, createdAt: p.created_at, updatedAt: p.updated_at };
}

// Zahlung starten: Daten kommen aus der Datenbank, nie vom Handy
async function start(token, methodId, source = 'handy', session) {
  const res = await decode(token, { count: false, quiet: true });
  if (!res.ok) throw Object.assign(new Error(res.error), { status: 400 });
  if (res.alreadyPaid) throw Object.assign(new Error('Dieser Code ist bereits bezahlt.'), { status: 409 });
  const method = METHOD[methodId];
  if (!method) throw Object.assign(new Error('Unbekannte Zahlart'), { status: 400 });

  let betrag, gebuehr;
  if (res.code.type === 'PAY') {
    ({ betrag, gebuehr } = res.code.vars);
  } else if (res.code.type === 'KONTO') {
    const code = await C.getCode(res.code.id);
    if (!C.verifySession(session, code)) throw Object.assign(new Error('Anmeldung abgelaufen. Bitte erneut anmelden.'), { status: 401 });
    const { open } = await kontoState(code);
    if (!open) throw Object.assign(new Error('Es ist kein Betrag offen.'), { status: 409 });
    betrag = open; gebuehr = 0;
  } else {
    throw Object.assign(new Error('Kein Zahlungscode'), { status: 400 });
  }
  const id = `ZA-${C.rid(8)}`;
  const t = C.now();
  await db.run(`INSERT INTO payments (id, code_id, method, amount, fee, total, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'gestartet', ?, ?)`,
    [id, res.code.id, method.id, betrag, gebuehr, betrag + gebuehr, t, t]);
  await C.log(res.code.id, id, source, 'info', `Zahlart gewählt: ${method.name}`);
  await C.log(res.code.id, id, 'zahlung', 'info', `Zahlung ${id} angelegt, Weiterleitung zum Checkout von ${method.name} (${eur(betrag + gebuehr)})`);
  return { paymentId: id, redirect: `/anbieter/${method.id}/${id}` };
}

const OUTCOMES = {
  success: { status: 'bezahlt', kind: 'ok', hook: 'payment.succeeded' },
  declined: { status: 'abgelehnt', kind: 'fehler', hook: 'payment.failed' },
  cancel: { status: 'abgebrochen', kind: 'warn', hook: 'payment.canceled' },
  timeout: { status: 'zeitüberschreitung', kind: 'warn', hook: 'payment.expired' },
};

// Der simulierte Anbieter meldet das Ergebnis (wie ein Webhook). Idempotent: ein zweiter Aufruf ändert nichts.
async function complete(paymentId, result, reason) {
  const p = await getPayment(paymentId);
  if (!p) throw Object.assign(new Error('Zahlung nicht gefunden'), { status: 404 });
  const o = OUTCOMES[result];
  if (!o) throw Object.assign(new Error('Unbekanntes Ergebnis'), { status: 400 });
  if (p.status !== 'gestartet') return { redirect: `/ergebnis/${p.id}`, payment: publicPayment(p) };

  const name = METHOD[p.method].name;
  const code = await C.getCode(p.code_id);
  const ref = `${p.method.toUpperCase()}-${C.rid(10)}`;
  await C.log(p.code_id, p.id, 'zahlungsdienst', o.kind, `${name} sendet Webhook „${o.hook}“${reason ? `: ${reason}` : ''}`, { ref, betrag: p.total });

  if (o.status === 'bezahlt') {
    if (code.type === 'KONTO') {
      // Ausgleichszahlung: darf nicht mehr sein als aktuell offen ist
      const { open } = await kontoState(code);
      if (p.total > open) {
        await setPayment(p.id, 'abgelehnt', 'Der Betrag war inzwischen schon ausgeglichen, Betrag wird erstattet', ref);
        await C.log(p.code_id, p.id, 'zahlung', 'fehler', `Überzahlung erkannt (offen nur noch ${eur(open)}), Erstattung wird ausgelöst`);
        return { redirect: `/ergebnis/${p.id}` };
      }
      await setPayment(p.id, 'bezahlt', null, ref);
      await C.log(p.code_id, p.id, 'zahlung', 'ok', `Ausgleichszahlung ${eur(p.total)} verbucht, neuer Kontostand ${eur((await kontoState(code)).saldo)}`);
      await C.log(p.code_id, p.id, 'uebergabe', 'info', 'Zahlungseingang an die Forderungsverwaltung gemeldet (Platzhalter, Schnittstelle noch nicht gebaut)');
      return { redirect: `/ergebnis/${p.id}` };
    }
    // Doppelzahlung verhindern: Code inzwischen anders bezahlt oder geändert?
    const other = await paidPayment(p.code_id);
    if (code.single_use && other) {
      await setPayment(p.id, 'abgelehnt', 'Code wurde parallel bereits bezahlt, Betrag wird erstattet', ref);
      await C.log(p.code_id, p.id, 'zahlung', 'fehler', `Doppelzahlung erkannt (schon bezahlt mit ${other.id}), Erstattung wird ausgelöst`);
      return { redirect: `/ergebnis/${p.id}` };
    }
    if (code.vars.betrag + code.vars.gebuehr !== p.total) {
      await setPayment(p.id, 'abgelehnt', 'Betrag passt nicht mehr zum Code, Betrag wird erstattet', ref);
      await C.log(p.code_id, p.id, 'zahlung', 'fehler', 'Betragsabgleich fehlgeschlagen, Code wurde während der Zahlung geändert');
      return { redirect: `/ergebnis/${p.id}` };
    }
    await setPayment(p.id, 'bezahlt', null, ref);
    await C.log(p.code_id, p.id, 'zahlung', 'ok', `Signatur des Webhooks geprüft, Betrag ${eur(p.total)} abgeglichen, Zahlung verbucht`);
    if (code.single_use) {
      await C.setStatus(p.code_id, 'bezahlt');
      await C.log(p.code_id, p.id, 'link', 'ok', 'Code auf „bezahlt“ gesetzt (Einmal-Code), weitere Scans zeigen nur den Beleg');
    }
    await C.log(p.code_id, p.id, 'zahlung', 'info', `Bestätigung an Kunde ${code.vars.kundennummer} erzeugt (Beleg ${p.id})`);
    await C.log(p.code_id, p.id, 'uebergabe', 'info', 'Zahlungseingang an die Forderungsverwaltung gemeldet (Platzhalter, Schnittstelle noch nicht gebaut)');
  } else {
    await setPayment(p.id, o.status, reason, ref);
    await C.log(p.code_id, p.id, 'zahlung', o.kind, `Zahlung ${p.id}: ${o.status}. Code bleibt offen, Kunde kann erneut zahlen`);
  }
  return { redirect: `/ergebnis/${p.id}` };
}

async function paymentsFor(codeId) {
  return (await db.all('SELECT * FROM payments WHERE code_id = ? ORDER BY created_at DESC', [codeId])).map(publicPayment);
}

module.exports = { METHODS, METHOD, IDENTS, allowedIdents, kontoState, decode, start, complete, getPayment, publicPayment, paymentsFor, expireStale };
