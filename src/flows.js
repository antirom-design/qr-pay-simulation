// Weitere Usecases auf dem QR-Code-Manager: Anmeldung (Geburtsdatum / Ident), Kontostand, Adressänderung, Dokument einreichen
const crypto = require('crypto');
const db = require('./db');
const C = require('./codes');
const P = require('./payments');
const { eur } = require('./format');

const MAX_FAILS = 3;
const LOCK_MIN = 15;
const MAX_FILE = 3 * 1024 * 1024;
const err = (status, message) => Object.assign(new Error(message), { status });
const mask = (name) => String(name || '').split(/\s+/).map((w, i, a) => (i === a.length - 1 ? `${w[0]}.` : w)).join(' ');

// Code aus dem QR-Token laden und vollständig prüfen (Signatur, Version, Status, Ablauf)
async function codeFrom(token, type) {
  const res = await P.decode(token, { count: false, quiet: true });
  if (!res.ok) throw err(400, res.error);
  if (res.alreadyDone) throw err(409, 'Dieser Vorgang ist bereits erledigt.');
  if (type && res.code.type !== type) throw err(400, 'Falsche Code-Art');
  return C.getCode(res.code.id);
}

async function sessionCode(token, session, type) {
  const code = await codeFrom(token, type);
  if (!C.verifySession(session, code)) throw err(401, 'Anmeldung abgelaufen. Bitte erneut anmelden.');
  return code;
}

// --- Anmeldung mit Geburtsdatum (einfach) ---------------------------------------

async function loginBirthdate(token, input, source) {
  const code = await codeFrom(token);
  const st = (await db.get('SELECT * FROM auth_state WHERE code_id = ?', [code.id])) || { fails: 0, locked_until: null };
  if (st.locked_until && new Date(st.locked_until) > new Date()) {
    const min = Math.ceil((new Date(st.locked_until) - Date.now()) / 60e3);
    await C.log(code.id, null, 'link', 'fehler', 'Anmeldung blockiert, Code ist nach zu vielen Fehlversuchen gesperrt');
    throw err(423, `Zu viele Fehlversuche. Bitte in ${min} Minuten erneut versuchen.`);
  }
  const given = C.parseDate(input);
  if (given && given === code.vars.geburtsdatum) {
    await db.run(`INSERT INTO auth_state (code_id, fails, locked_until) VALUES (?, 0, NULL)
      ON CONFLICT(code_id) DO UPDATE SET fails = 0, locked_until = NULL`, [code.id]);
    await C.log(code.id, null, source, 'info', 'Geburtsdatum eingegeben');
    await C.log(code.id, null, 'link', 'ok', 'Anmeldung erfolgreich, Sitzung für 10 Minuten gestartet');
    return { session: C.sessionFor(code, 'geburtsdatum'), ...(await dataFor(code)) };
  }
  const fails = Number(st.fails) + 1;
  const lock = fails >= MAX_FAILS ? new Date(Date.now() + LOCK_MIN * 60e3).toISOString() : null;
  await db.run(`INSERT INTO auth_state (code_id, fails, locked_until) VALUES (?, ?, ?)
    ON CONFLICT(code_id) DO UPDATE SET fails = excluded.fails, locked_until = excluded.locked_until`, [code.id, lock ? 0 : fails, lock]);
  await C.log(code.id, null, source, 'info', 'Geburtsdatum eingegeben');
  if (lock) {
    await C.log(code.id, null, 'link', 'fehler', `${MAX_FAILS}. Fehlversuch, Code für ${LOCK_MIN} Minuten gesperrt`);
    throw err(423, `Das Geburtsdatum stimmt nicht. Aus Sicherheitsgründen ist der Zugang jetzt für ${LOCK_MIN} Minuten gesperrt.`);
  }
  await C.log(code.id, null, 'link', 'warn', `Falsches Geburtsdatum (Versuch ${fails} von ${MAX_FAILS})`);
  throw err(401, `Das Geburtsdatum stimmt nicht. Noch ${MAX_FAILS - fails} Versuch${MAX_FAILS - fails === 1 ? '' : 'e'}.`);
}

// --- Identifizierung (simuliert: Online-Ausweis, Video-Ident, Bank-Ident) -------------

async function ident(token, method, outcome, source) {
  const code = await codeFrom(token, 'DOK');
  const m = P.allowedIdents(code).find((i) => i.id === method);
  if (!m) throw err(400, 'Dieses Verfahren reicht für das geforderte Vertrauensniveau nicht aus.');
  // Der Ident-Anbieter liefert geprüfte Personendaten. In der Simulation: entweder die erwartete Person oder eine andere.
  const person = outcome === 'mismatch'
    ? { name: 'Erika Musterfrau', geburtsdatum: '1964-08-12' }
    : { name: code.vars.name, geburtsdatum: code.vars.geburtsdatum };
  await C.log(code.id, null, 'ident', 'info', `${m.name}: Identität geprüft, Daten an Server übermittelt (Niveau ${m.niveau})`);
  const match = person.name.trim().toLowerCase() === code.vars.name.trim().toLowerCase() && person.geburtsdatum === code.vars.geburtsdatum;
  if (!match) {
    await C.log(code.id, null, 'link', 'fehler', `Abgleich fehlgeschlagen: identifizierte Person (${mask(person.name)}) passt nicht zum Vorgang`);
    throw err(403, 'Die identifizierte Person passt nicht zu diesem Vorgang. Es wurden keine Daten übertragen.');
  }
  await C.log(code.id, null, 'link', 'ok', `Abgleich Name und Geburtsdatum erfolgreich (${mask(person.name)}), Upload freigegeben`);
  return { session: C.sessionFor(code, `ident:${m.id}`, 15), person: mask(person.name), method: m.name, niveau: m.niveau, ...(await dataFor(code)) };
}

// Daten, die nach der Anmeldung angezeigt werden
async function dataFor(code) {
  const v = code.vars;
  if (code.type === 'KONTO') {
    const { saldo, open } = await P.kontoState(code);
    const paid = (await P.paymentsFor(code.id)).filter((p) => p.status === 'bezahlt');
    return {
      name: mask(v.name), saldo, open, start: v.kontostand, methods: open ? P.METHODS : [],
      bookings: paid.map((p) => ({ date: p.updatedAt, text: `Zahlung ${p.methodName}`, amount: p.total })),
    };
  }
  if (code.type === 'ADR') return { name: mask(v.name), address: { strasse: v.strasse, plz: v.plz, ort: v.ort } };
  if (code.type === 'DOK') return { dokument: v.dokument, frist: v.frist || null };
  return {};
}

// --- Adressänderung --------------------------------------------------------------

async function changeAddress(token, session, input, source) {
  const code = await sessionCode(token, session, 'ADR');
  const a = {
    strasse: String(input.strasse || '').trim().slice(0, 80), plz: String(input.plz || '').trim(),
    ort: String(input.ort || '').trim().slice(0, 60), ab: C.parseDate(input.ab) || new Date().toISOString().slice(0, 10),
  };
  const errors = {};
  if (a.strasse.length < 3 || !/\d/.test(a.strasse)) errors.strasse = 'Straße und Hausnummer';
  if (!/^\d{5}$/.test(a.plz)) errors.plz = '5 Ziffern';
  if (a.ort.length < 2) errors.ort = 'Ort fehlt';
  if (Object.keys(errors).length) throw Object.assign(err(400, 'Bitte Eingaben prüfen'), { errors });
  const old = { strasse: code.vars.strasse, plz: code.vars.plz, ort: code.vars.ort };
  if (old.strasse === a.strasse && old.plz === a.plz && old.ort === a.ort) throw err(400, 'Das ist die bisherige Anschrift.');
  const id = `VG-${C.rid(8)}`;
  await db.run('INSERT INTO submissions (id, code_id, kind, data, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, code.id, 'adresse', JSON.stringify({ alt: old, neu: a }), C.now()]);
  await C.log(code.id, id, source, 'info', 'Neue Anschrift eingegeben und bestätigt');
  await C.log(code.id, id, 'vorgang', 'ok', `Adressänderung ${id} gespeichert: ${a.strasse}, ${a.plz} ${a.ort} (gültig ab ${a.ab})`);
  if (code.single_use) await C.setStatus(code.id, 'erledigt');
  await C.log(code.id, id, 'vorgang', 'info', 'Bestätigung für den Kunden erzeugt');
  await C.log(code.id, id, 'uebergabe', 'info', 'Adressänderung an Kundenstamm übergeben (Platzhalter, Schnittstelle noch nicht gebaut)');
  return { id, alt: old, neu: a, createdAt: C.now() };
}

// --- Dokument einreichen (verschlüsselt gespeichert) -----------------------------------

const KEY = crypto.createHash('sha256').update(`dok:${C.SECRET}`).digest();
function encrypt(buf) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', KEY, iv);
  const enc = Buffer.concat([c.update(buf), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString('base64')).join('.');
}
function decrypt(s) {
  const [iv, tag, enc] = s.split('.').map((b) => Buffer.from(b, 'base64'));
  const d = crypto.createDecipheriv('aes-256-gcm', KEY, iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]);
}

const MIMES = ['application/pdf', 'image/jpeg', 'image/png', 'image/heic', 'text/plain'];

async function uploadDocument(token, session, input, source) {
  const code = await sessionCode(token, session, 'DOK');
  const s = C.verifySession(session, code);
  const buf = Buffer.from(String(input.data || ''), 'base64');
  if (!buf.length) throw err(400, 'Keine Datei');
  if (buf.length > MAX_FILE) throw err(413, 'Datei ist größer als 3 MB');
  const mime = MIMES.includes(input.mime) ? input.mime : 'application/octet-stream';
  const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
  if (input.sha256 && input.sha256 !== sha256) throw err(400, 'Prüfsumme stimmt nicht, Übertragung fehlerhaft');
  const id = `VG-${C.rid(8)}`;
  const meta = {
    dokument: code.vars.dokument, filename: String(input.filename || 'dokument').replace(/[^\w.\- äöüÄÖÜß]/g, '_').slice(0, 80),
    mime, size: buf.length, sha256, ident: s.l.replace('ident:', ''), niveau: P.IDENTS.find((i) => `ident:${i.id}` === s.l)?.niveau || code.vars.niveau,
  };
  await db.run('INSERT INTO submissions (id, code_id, kind, data, blob, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [id, code.id, 'dokument', JSON.stringify(meta), encrypt(buf), C.now()]);
  await C.log(code.id, id, source, 'info', `Datei „${meta.filename}“ ausgewählt und hochgeladen (${Math.round(buf.length / 1024)} KB)`);
  await C.log(code.id, id, 'vorgang', 'ok', `Prüfsumme bestätigt (SHA-256 ${sha256.slice(0, 12)}…), Dokument verschlüsselt gespeichert (AES-256-GCM)`);
  if (code.single_use) await C.setStatus(code.id, 'erledigt');
  await C.log(code.id, id, 'vorgang', 'info', 'Bestätigung für den Kunden erzeugt');
  await C.log(code.id, id, 'uebergabe', 'info', `Eingang ${id} an die Sachbearbeitung übergeben (Platzhalter, Schnittstelle noch nicht gebaut)`);
  return { id, ...meta, createdAt: C.now() };
}

// --- Für den Manager ---------------------------------------------------------------

async function submissionsFor(codeId) {
  return (await db.all('SELECT id, code_id, kind, data, created_at FROM submissions WHERE code_id = ? ORDER BY created_at DESC', [codeId]))
    .map((r) => ({ id: r.id, kind: r.kind, createdAt: r.created_at, ...JSON.parse(r.data) }));
}
async function submissionFile(id) {
  const r = await db.get('SELECT * FROM submissions WHERE id = ?', [id]);
  if (!r || !r.blob) throw err(404, 'Kein Dokument');
  const meta = JSON.parse(r.data);
  return { meta, buf: decrypt(r.blob) };
}
async function submission(id) {
  const r = await db.get('SELECT * FROM submissions WHERE id = ?', [id]);
  return r && { id: r.id, codeId: r.code_id, kind: r.kind, createdAt: r.created_at, ...JSON.parse(r.data) };
}

module.exports = { loginBirthdate, ident, changeAddress, uploadDocument, submissionsFor, submissionFile, submission, eur };
