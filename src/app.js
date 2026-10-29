// HTTP-Schicht ohne Framework: läuft lokal (src/server.js) und als Vercel-Funktion (api/index.js)
const fs = require('fs');
const os = require('os');
const path = require('path');
const QRCode = require('qrcode');
const db = require('./db');
const C = require('./codes');
const P = require('./payments');
const F = require('./flows');
const views = require('./views');

const PUBLIC = path.join(__dirname, '..', 'public');
const MIME = { '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };

// Adresse, die im QR-Code steht. Lokal wird "localhost" durch die WLAN-IP ersetzt, damit das Handy den Server erreicht.
function baseUrl(req) {
  if (process.env.PUBLIC_URL) return process.env.PUBLIC_URL.replace(/\/$/, '');
  const proto = req.headers['x-forwarded-proto'] || 'http';
  let host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost';
  if (/^(localhost|127\.0\.0\.1)(:|$)/.test(host)) {
    const ip = Object.values(os.networkInterfaces()).flat().find((i) => i && i.family === 'IPv4' && !i.internal)?.address;
    if (ip) host = host.replace(/^[^:]+/, ip);
  }
  return `${proto}://${host}`;
}

const send = (res, status, body, type = 'text/html; charset=utf-8', extra = {}) => {
  res.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', ...extra });
  res.end(body);
};
const json = (res, status, data) => send(res, status, JSON.stringify(data), 'application/json; charset=utf-8');

async function body(req) {
  if (req.body !== undefined) return typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body; // Vercel parst schon
  let raw = '';
  for await (const chunk of req) { raw += chunk; if (raw.length > 5e6) throw Object.assign(new Error('Zu groß'), { status: 413 }); }
  return raw ? JSON.parse(raw) : {};
}

// Optionaler Schutz für den Manager: ADMIN_PASSWORD setzen (Benutzername egal)
function authorized(req) {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return true;
  const [, b64] = String(req.headers.authorization || '').split(' ');
  const given = b64 ? Buffer.from(b64, 'base64').toString().split(':').slice(1).join(':') : '';
  return given === pw;
}

async function codeView(code, base) {
  const token = C.tokenFor(code);
  return { ...code, token, scanUrl: `${base}/s/${token}`, qr: `/qr/${code.id}.svg?v=${code.version}` };
}

const routes = [];
const route = (method, pattern, handler, { admin = false } = {}) => routes.push({ method, pattern, handler, admin });

// --- Seiten ---------------------------------------------------------------

route('GET', /^\/$/, (req, res) => send(res, 200, views.manager()), { admin: true });
route('GET', /^\/info$/, (req, res) => send(res, 200, views.info()));
route('GET', /^\/hilfe$/, (req, res) => send(res, 200, views.help()));
route('GET', /^\/s\/([\w.-]+)$/, (req, res, [token]) => send(res, 200, views.pay(token)));
route('GET', /^\/anbieter\/(\w+)\/([\w-]+)$/, async (req, res, [method, pid]) => {
  const p = await P.getPayment(pid);
  if (!p || p.method !== method) return send(res, 404, views.message('Zahlung nicht gefunden', 'Dieser Checkout-Link ist ungültig.'));
  const code = await C.getCode(p.code_id);
  if (p.status !== 'gestartet') { res.writeHead(303, { Location: `/ergebnis/${p.id}` }); return res.end(); }
  send(res, 200, views.provider(P.METHOD[method], P.publicPayment(p), code));
});
route('GET', /^\/ergebnis\/([\w-]+)$/, async (req, res, [pid]) => {
  const p = await P.getPayment(pid);
  if (!p) return send(res, 404, views.message('Zahlung nicht gefunden', 'Unbekannte Zahlungsreferenz.'));
  const code = await C.getCode(p.code_id);
  await C.log(p.code_id, p.id, 'handy', 'info', `Rücksprung zum Händler, Ergebnisseite angezeigt (${p.status})`);
  send(res, 200, views.result(P.publicPayment(p), code, C.tokenFor(code)));
});
route('GET', /^\/qr\/([\w-]+)\.svg$/, async (req, res, [id]) => {
  const code = await C.getCode(id);
  if (!code) return send(res, 404, 'not found', 'text/plain');
  const svg = await QRCode.toString(`${baseUrl(req)}/s/${C.tokenFor(code)}`, { type: 'svg', errorCorrectionLevel: 'M', margin: 1 });
  send(res, 200, svg, 'image/svg+xml');
}, { admin: true });
route('GET', /^\/static\/([\w.-]+)$/, (req, res, [file]) => {
  const f = path.join(PUBLIC, file);
  if (!fs.existsSync(f)) return send(res, 404, 'not found', 'text/plain');
  send(res, 200, fs.readFileSync(f), MIME[path.extname(f)] || 'application/octet-stream', { 'Cache-Control': 'public, max-age=60' });
});

// --- API: Service 1, QR-Code-Manager -----------------------------------------

route('GET', /^\/api\/info$/, (req, res) => json(res, 200, { baseUrl: baseUrl(req), db: db.kind, protected: !!process.env.ADMIN_PASSWORD }), { admin: true });
route('GET', /^\/api\/types$/, async (req, res) => json(res, 200, await C.listTypes()), { admin: true });
route('GET', /^\/api\/codes$/, async (req, res) => {
  await P.expireStale();
  const base = baseUrl(req);
  json(res, 200, await Promise.all((await C.listCodes()).map((c) => codeView(c, base))));
}, { admin: true });
route('POST', /^\/api\/codes$/, async (req, res) => json(res, 201, await codeView(await C.createCode(await body(req)), baseUrl(req))), { admin: true });
route('PUT', /^\/api\/codes\/([\w-]+)$/, async (req, res, [id]) => json(res, 200, await codeView(await C.updateCode(id, await body(req)), baseUrl(req))), { admin: true });
route('DELETE', /^\/api\/codes\/([\w-]+)$/, async (req, res, [id]) => { await C.deleteCode(id); json(res, 200, { ok: true }); }, { admin: true });
route('POST', /^\/api\/codes\/([\w-]+)\/status$/, async (req, res, [id]) => {
  const { status } = await body(req);
  const code = await C.getCode(id);
  if (!code) return json(res, 404, { error: 'Code nicht gefunden' });
  const msg = { aktiv: code.status === 'bezahlt' ? 'Code für eine neue Demo wieder geöffnet' : 'Code aktiviert', deaktiviert: 'Code deaktiviert, Scans werden abgelehnt' }[status];
  if (!msg) return json(res, 400, { error: 'Ungültiger Status' });
  json(res, 200, await codeView(await C.setStatus(id, status, msg), baseUrl(req)));
}, { admin: true });
route('GET', /^\/api\/codes\/([\w-]+)\/events$/, async (req, res, [id]) => {
  const after = Number(new URL(req.url, 'http://x').searchParams.get('after') || 0);
  const [events, payments, submissions, code] = await Promise.all([C.events(id, after), P.paymentsFor(id), F.submissionsFor(id), C.getCode(id)]);
  json(res, 200, { events, payments, submissions, status: code?.status });
}, { admin: true });

// --- API: Service 2, Bezahlstrecke -------------------------------------------

route('POST', /^\/api\/decode$/, async (req, res) => {
  const { token, source } = await body(req);
  json(res, 200, await P.decode(token, { source: source === 'simulation' ? 'simulation' : 'handy' }));
});
route('POST', /^\/api\/pay$/, async (req, res) => {
  const { token, method, source, session } = await body(req);
  json(res, 200, await P.start(token, method, src(source), session));
});

// --- API: weitere Usecases (Anmeldung, Adresse, Dokument) ----------------------------

const src = (s) => (s === 'simulation' ? 'simulation' : 'handy');
route('POST', /^\/api\/login$/, async (req, res) => {
  const { token, geburtsdatum, source } = await body(req);
  json(res, 200, await F.loginBirthdate(token, geburtsdatum, src(source)));
});
route('POST', /^\/api\/ident$/, async (req, res) => {
  const { token, method, outcome, source } = await body(req);
  json(res, 200, await F.ident(token, method, outcome, src(source)));
});
route('POST', /^\/api\/schritt$/, async (req, res) => {
  // Zwischenschritte der simulierten Ident-Verfahren im Statuslog sichtbar machen
  const { token, text, actor } = await body(req);
  const d = C.decodeToken(token);
  if (!d.sigOk) return json(res, 400, { ok: false });
  await C.log(d.payload.id, null, ['handy', 'simulation'].includes(actor) ? actor : 'ident', 'info', String(text).slice(0, 100));
  json(res, 200, { ok: true });
});
route('POST', /^\/api\/adresse$/, async (req, res) => {
  const { token, session, source, ...input } = await body(req);
  json(res, 200, await F.changeAddress(token, session, input, src(source)));
});
route('POST', /^\/api\/dokument$/, async (req, res) => {
  const { token, session, source, ...input } = await body(req);
  json(res, 200, await F.uploadDocument(token, session, input, src(source)));
});
route('GET', /^\/api\/eingang\/([\w-]+)$/, async (req, res, [id]) => {
  const s = await F.submission(id);
  if (!s) return json(res, 404, { error: 'Nicht gefunden' });
  json(res, 200, s);
}, { admin: true });
route('GET', /^\/api\/eingang\/([\w-]+)\/datei$/, async (req, res, [id]) => {
  const { meta, buf } = await F.submissionFile(id);
  res.writeHead(200, { 'Content-Type': meta.mime, 'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(meta.filename)}`, 'Cache-Control': 'no-store' });
  res.end(buf);
}, { admin: true });
route('POST', /^\/api\/anbieter\/([\w-]+)$/, async (req, res, [pid]) => {
  const { result, reason } = await body(req);
  json(res, 200, await P.complete(pid, result, reason && String(reason).slice(0, 120)));
});
route('POST', /^\/api\/anbieter\/([\w-]+)\/schritt$/, async (req, res, [pid]) => {
  const { text } = await body(req);
  const p = await P.getPayment(pid);
  if (!p || p.status !== 'gestartet') return json(res, 200, { ok: false });
  await C.log(p.code_id, p.id, 'zahlungsdienst', 'info', `${P.METHOD[p.method].name}: ${String(text).slice(0, 100)}`);
  json(res, 200, { ok: true });
});

async function handler(req, res) {
  const url = new URL(req.url, 'http://x');
  try {
    await db.ready();
    for (const r of routes) {
      const m = r.method === req.method && url.pathname.match(r.pattern);
      if (!m) continue;
      if (r.admin && !authorized(req)) return send(res, 401, 'Anmeldung erforderlich', 'text/plain; charset=utf-8', { 'WWW-Authenticate': 'Basic realm="QR-Code-Manager", charset="UTF-8"' });
      return await r.handler(req, res, m.slice(1).map(decodeURIComponent));
    }
    send(res, 404, views.message('Nicht gefunden', 'Diese Seite gibt es nicht.'));
  } catch (e) {
    if (!e.status) console.error(e);
    if (url.pathname.startsWith('/api/')) json(res, e.status || 500, { error: e.message, errors: e.errors });
    else send(res, e.status || 500, views.message('Fehler', e.message));
  }
}

module.exports = handler;
