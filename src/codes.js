// Service 1: QR-Code-Manager (Code-Arten, Codes, signierte Tokens, Statuslog)
const crypto = require('crypto');
const db = require('./db');

const SECRET = process.env.CODE_SECRET || 'dev-secret-bitte-aendern';
const now = () => new Date().toISOString();
const b64u = (s) => Buffer.from(s).toString('base64url');
const hmac = (s) => crypto.createHmac('sha256', SECRET).update(s).digest('base64url');
const rid = (n) => {
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // ohne 0/O/1/I, gut vorlesbar
  return Array.from(crypto.randomBytes(n), (b) => abc[b % abc.length]).join('');
};

// --- Code-Arten -----------------------------------------------------------

async function listTypes() {
  return (await db.all('SELECT * FROM code_types ORDER BY id')).map((t) => ({ ...t, schema: JSON.parse(t.schema) }));
}
async function getType(id) {
  const t = await db.get('SELECT * FROM code_types WHERE id = ?', [id]);
  return t && { ...t, schema: JSON.parse(t.schema) };
}

// "49,90" -> 4990
function parseMoney(v) {
  const s = String(v ?? '').trim().replace(/\s|€/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return NaN;
  return Math.round(parseFloat(s) * 100);
}

// Prüft und normalisiert Variablen nach dem Schema der Code-Art. Geldbeträge werden in Cent gespeichert.
function validateVars(type, input) {
  const out = {}, errors = {};
  for (const f of type.schema) {
    const raw = input?.[f.key];
    const empty = raw === undefined || raw === null || String(raw).trim() === '';
    if (empty) {
      if (f.required) errors[f.key] = 'Pflichtfeld';
      continue;
    }
    const s = String(raw).trim();
    if (f.kind === 'digits12') {
      const d = s.replace(/\s/g, '');
      if (!/^\d{12}$/.test(d)) errors[f.key] = 'Genau 12 Ziffern';
      else out[f.key] = d;
    } else if (f.kind === 'money' || f.kind === 'money0') {
      const c = typeof raw === 'number' && Number.isInteger(raw) ? raw : parseMoney(s);
      if (!Number.isInteger(c) || c < 0 || (f.kind === 'money' && c === 0)) errors[f.key] = 'Ungültiger Betrag';
      else if (c > 10_000_00) errors[f.key] = 'Maximal 10.000 €';
      else out[f.key] = c;
    } else if (f.kind === 'url') {
      try { const u = new URL(s); if (!/^https?:$/.test(u.protocol)) throw 0; out[f.key] = u.href; } catch { errors[f.key] = 'Ungültige URL'; }
    } else {
      if (s.length > 140) errors[f.key] = 'Maximal 140 Zeichen';
      else out[f.key] = s;
    }
  }
  return { vars: out, errors };
}

// --- Codes ----------------------------------------------------------------

const row = (r) => r && { ...r, vars: JSON.parse(r.vars), single_use: !!r.single_use };

async function getCode(id) {
  return row(await db.get('SELECT * FROM codes WHERE id = ?', [id]));
}

async function listCodes() {
  return (await db.all(`
    SELECT c.*,
      (SELECT CAST(COUNT(*) AS INTEGER) FROM payments p WHERE p.code_id = c.id) AS attempts,
      (SELECT p.status FROM payments p WHERE p.code_id = c.id ORDER BY p.created_at DESC LIMIT 1) AS last_payment
    FROM codes c ORDER BY c.created_at DESC`)).map(row);
}

async function createCode({ type: typeId, label, vars, singleUse = true, validDays }) {
  const type = await getType(typeId);
  if (!type) throw Object.assign(new Error('Unbekannte Code-Art'), { status: 400 });
  const v = validateVars(type, vars);
  if (Object.keys(v.errors).length) throw Object.assign(new Error('Eingaben prüfen'), { status: 400, errors: v.errors });
  const id = `${type.id}-${rid(6)}`;
  const t = now();
  const days = Number(validDays);
  const expires = days > 0 ? new Date(Date.now() + days * 864e5).toISOString() : null;
  await db.run(`INSERT INTO codes (id, type, label, vars, single_use, expires_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, type.id, String(label || type.name).slice(0, 80), JSON.stringify(v.vars), singleUse ? 1 : 0, expires, t, t]);
  await log(id, null, 'manager', 'ok', `Code angelegt (Art ${type.id} · ${type.name})`, v.vars);
  return getCode(id);
}

async function updateCode(id, { label, vars, singleUse, validDays }) {
  const code = await getCode(id);
  if (!code) throw Object.assign(new Error('Code nicht gefunden'), { status: 404 });
  const type = await getType(code.type);
  const v = validateVars(type, vars ?? code.vars);
  if (Object.keys(v.errors).length) throw Object.assign(new Error('Eingaben prüfen'), { status: 400, errors: v.errors });
  const changed = JSON.stringify(v.vars) !== JSON.stringify(code.vars);
  let expires = code.expires_at;
  if (validDays !== undefined) {
    const days = Number(validDays);
    expires = days > 0 ? new Date(Date.now() + days * 864e5).toISOString() : null;
  }
  await db.run(`UPDATE codes SET label = ?, vars = ?, single_use = ?, expires_at = ?, version = version + ?, updated_at = ? WHERE id = ?`,
    [String(label ?? code.label).slice(0, 80), JSON.stringify(v.vars), (singleUse ?? code.single_use) ? 1 : 0, expires, changed ? 1 : 0, now(), id]);
  await log(id, null, 'manager', changed ? 'warn' : 'info',
    changed ? `Code geändert, neue Version ${code.version + 1}. Bereits gedruckte QR-Codes sind ab jetzt ungültig.` : 'Code-Einstellungen geändert', changed ? v.vars : undefined);
  return getCode(id);
}

async function setStatus(id, status, message) {
  await db.run('UPDATE codes SET status = ?, updated_at = ? WHERE id = ?', [status, now(), id]);
  if (message) await log(id, null, 'manager', status === 'deaktiviert' ? 'warn' : 'ok', message);
  return getCode(id);
}

async function deleteCode(id) {
  await db.run('DELETE FROM events WHERE code_id = ?', [id]);
  await db.run('DELETE FROM payments WHERE code_id = ?', [id]);
  await db.run('DELETE FROM codes WHERE id = ?', [id]);
}

// --- Token im QR-Code -------------------------------------------------------
// Inhalt: base64url(JSON) + "." + HMAC-SHA256. Die Daten stehen lesbar im Code, sind aber nicht fälschbar.

function tokenFor(code) {
  const payload = { v: 1, id: code.id, t: code.type, n: code.version, d: code.vars };
  const body = b64u(JSON.stringify(payload));
  return `${body}.${hmac(body)}`;
}

function decodeToken(token) {
  const [body, sig] = String(token || '').split('.');
  let payload = null;
  try { payload = JSON.parse(Buffer.from(body || '', 'base64url').toString('utf8')); } catch {}
  let sigOk = false;
  if (body && sig) {
    const a = Buffer.from(sig), b = Buffer.from(hmac(body));
    sigOk = a.length === b.length && crypto.timingSafeEqual(a, b);
  }
  return { body, sig, payload, sigOk };
}

// --- Statuslog --------------------------------------------------------------

async function log(codeId, paymentId, actor, kind, message, data) {
  await db.run('INSERT INTO events (code_id, payment_id, ts, actor, kind, message, data) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [codeId, paymentId, now(), actor, kind, message, data === undefined ? null : JSON.stringify(data)]);
}

async function events(codeId, afterId = 0) {
  return (await db.all('SELECT * FROM events WHERE code_id = ? AND id > ? ORDER BY id', [codeId, afterId]))
    .map((e) => ({ ...e, id: Number(e.id), data: e.data ? JSON.parse(e.data) : null }));
}

module.exports = {
  listTypes, getType, parseMoney, validateVars,
  getCode, listCodes, createCode, updateCode, setStatus, deleteCode,
  tokenFor, decodeToken, log, events, rid, now,
};
