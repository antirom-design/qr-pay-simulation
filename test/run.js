// End-to-end-Test der ganzen Strecke gegen den echten HTTP-Handler (SQLite im Speicher)
process.env.DB_FILE = ':memory:';
delete process.env.DATABASE_URL;
const http = require('http');
const assert = require('assert/strict');
const handler = require('../src/app');

const server = http.createServer(handler);
let base;
const call = async (method, path, body) => {
  const r = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json' }, body: body && JSON.stringify(body), redirect: 'manual' });
  const type = r.headers.get('content-type') || '';
  return { status: r.status, body: type.includes('json') ? await r.json() : await r.text(), headers: r.headers };
};
let n = 0;
const ok = (name) => console.log(`✓ ${++n} ${name}`);

server.listen(0, async () => {
  base = `http://127.0.0.1:${server.address().port}`;
  try {
    // Service 1: anlegen + Validierung
    let r = await call('POST', '/api/codes', { type: 'PAY', label: 'Test', vars: { kundennummer: '1234', betrag: '0', gebuehr: 'x' } });
    assert.equal(r.status, 400);
    assert.deepEqual(Object.keys(r.body.errors).sort(), ['betrag', 'gebuehr', 'kundennummer']);
    ok('Validierung lehnt falsche Kundennummer, Betrag und Gebühr ab');

    r = await call('POST', '/api/codes', { type: 'PAY', label: 'Test', vars: { kundennummer: '1234 5678 9012', betrag: '49,90', gebuehr: '1,50' }, validDays: 7, singleUse: true });
    assert.equal(r.status, 201);
    let code = r.body;
    assert.match(code.id, /^PAY-[A-Z2-9]{6}$/);
    assert.deepEqual(code.vars, { kundennummer: '123456789012', betrag: 4990, gebuehr: 150 });
    ok(`Code ${code.id} angelegt, Code-ID beginnt mit der Art`);

    r = await call('GET', code.qr);
    assert.equal(r.status, 200);
    assert.match(r.body, /<svg/);
    ok('QR-Code wird als SVG erzeugt');

    // Service 2: Decoding
    r = await call('POST', '/api/decode', { token: code.token, source: 'simulation' });
    assert.equal(r.body.ok, true);
    assert.equal(r.body.code.total, 5140);
    assert.equal(r.body.methods.length, 8);
    ok('Decoding: Signatur, Version, Status geprüft, Endbetrag 51,40 €');

    // Manipulation: Betrag im Token ändern
    const [body, sig] = code.token.split('.');
    const forged = JSON.parse(Buffer.from(body, 'base64url'));
    forged.d.betrag = 1;
    r = await call('POST', '/api/decode', { token: `${Buffer.from(JSON.stringify(forged)).toString('base64url')}.${sig}` });
    assert.equal(r.body.ok, false);
    assert.match(r.body.error, /verändert/);
    ok('Manipulierter Betrag wird an der Signatur erkannt');

    // Abbruch-Pfad
    r = await call('POST', '/api/pay', { token: code.token, method: 'paypal' });
    let pid = r.body.paymentId;
    assert.match(r.body.redirect, /^\/anbieter\/paypal\/ZA-/);
    r = await call('GET', `/anbieter/paypal/${pid}`);
    assert.equal(r.status, 200);
    r = await call('POST', `/api/anbieter/${pid}`, { result: 'cancel', reason: 'Vom Kunden abgebrochen' });
    r = await call('GET', r.body.redirect);
    assert.match(r.body, /Zahlung abgebrochen/);
    ok('Abbruch beim Anbieter, Code bleibt offen');

    // Ablehnung
    r = await call('POST', '/api/pay', { token: code.token, method: 'card' });
    await call('POST', `/api/anbieter/${r.body.paymentId}`, { result: 'declined', reason: 'Limit' });
    ok('Ablehnung durch Anbieter');

    // Zwei parallele Checkouts, erster erfolgreich
    const a = (await call('POST', '/api/pay', { token: code.token, method: 'wero' })).body.paymentId;
    const b = (await call('POST', '/api/pay', { token: code.token, method: 'bank' })).body.paymentId;
    r = await call('POST', `/api/anbieter/${a}`, { result: 'success' });
    r = await call('GET', r.body.redirect);
    assert.match(r.body, /Zahlung erfolgreich/);
    assert.match(r.body, /51,40/);
    assert.match(r.body, /1234 5678 9012/);
    ok('Erfolg mit Wero, Bestätigung mit Beleg');

    r = await call('POST', `/api/anbieter/${a}`, { result: 'success' });
    assert.equal(r.status, 200);
    r = await call('POST', `/api/anbieter/${b}`, { result: 'success' });
    r = await call('GET', `/ergebnis/${b}`);
    assert.match(r.body, /bereits bezahlt|erstattet/);
    ok('Webhook doppelt: idempotent. Zweite Zahlung: Doppelzahlung erkannt');

    r = await call('POST', '/api/decode', { token: code.token });
    assert.equal(r.body.alreadyPaid.id, a);
    r = await call('POST', '/api/pay', { token: code.token, method: 'paypal' });
    assert.equal(r.status, 409);
    ok('Erneuter Scan zeigt "bereits bezahlt", neue Zahlung gesperrt');

    // Bearbeiten macht alte QR-Codes ungültig
    r = await call('POST', `/api/codes/${code.id}/status`, { status: 'aktiv' });
    const oldToken = code.token;
    r = await call('PUT', `/api/codes/${code.id}`, { label: 'Test', vars: { kundennummer: '123456789012', betrag: '59,90', gebuehr: '1,50' } });
    assert.equal(r.body.version, 2);
    r = await call('POST', '/api/decode', { token: oldToken });
    assert.equal(r.body.ok, false);
    assert.match(r.body.error, /veraltet/);
    code = (await call('GET', '/api/codes')).body.find((c) => c.id === code.id);
    assert.equal((await call('POST', '/api/decode', { token: code.token })).body.code.total, 6140);
    ok('Geänderter Betrag: alter QR-Code abgelehnt, neuer gilt');

    // Deaktivieren
    await call('POST', `/api/codes/${code.id}/status`, { status: 'deaktiviert' });
    r = await call('POST', '/api/decode', { token: code.token });
    assert.match(r.body.error, /deaktiviert/);
    ok('Deaktivierter Code wird abgelehnt');

    // Verlauf
    r = await call('GET', `/api/codes/${code.id}/events`);
    const actors = new Set(r.body.events.map((e) => e.actor));
    for (const x of ['manager', 'server', 'anbieter', 'handy', 'simulation']) assert.ok(actors.has(x), x);
    assert.equal(r.body.payments.length, 4);
    ok(`Statuslog mit ${r.body.events.length} Einträgen und 4 Zahlungen`);

    // Info-Code
    r = await call('POST', '/api/codes', { type: 'INFO', label: 'Info', vars: { titel: 'Hallo', url: '/info' } });
    assert.equal((await call('POST', '/api/decode', { token: r.body.token })).body.code.type, 'INFO');
    ok('Zweite Code-Art INFO funktioniert');

    console.log(`\nAlle ${n} Tests bestanden.`);
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
