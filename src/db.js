// Datenbank: Postgres, wenn DATABASE_URL gesetzt ist (Vercel + Neon/Supabase), sonst SQLite-Datei (lokal).
// Beide bekommen dieselben SQL-Befehle mit ?-Platzhaltern.
const path = require('path');
const fs = require('fs');

const TYPES = [
  {
    id: 'PAY',
    name: 'Zahlung',
    description: 'Zahlungsaufforderung: Kundennummer, Betrag und Gebühr werden signiert im QR-Code übergeben.',
    schema: [
      { key: 'kundennummer', label: 'Kundennummer', kind: 'digits12', required: true, hint: '12 Ziffern' },
      { key: 'betrag', label: 'Betrag (€)', kind: 'money', required: true, hint: 'z. B. 49,90' },
      { key: 'gebuehr', label: 'Gebühr (€)', kind: 'money0', required: true, hint: 'z. B. 1,50, auch 0' },
      { key: 'zweck', label: 'Verwendungszweck', kind: 'text', required: false, hint: 'z. B. Rechnung 2026-104' },
    ],
  },
  {
    id: 'KONTO',
    name: 'Kontostand',
    description: 'Kunde sieht nach Anmeldung mit dem Geburtsdatum seinen Kontostand und kann einen offenen Betrag direkt bezahlen.',
    auth: 'geburtsdatum',
    schema: [
      { key: 'kundennummer', label: 'Kundennummer', kind: 'digits12', required: true, hint: '12 Ziffern' },
      { key: 'name', label: 'Name', kind: 'text', required: true, secret: true, hint: 'z. B. Max Mustermann' },
      { key: 'geburtsdatum', label: 'Geburtsdatum', kind: 'date', required: true, secret: true, hint: 'TT.MM.JJJJ' },
      { key: 'kontostand', label: 'Kontostand (€)', kind: 'moneySigned', required: true, secret: true, hint: 'negativ = offen, z. B. -45,20' },
    ],
  },
  {
    id: 'ADR',
    name: 'Adressänderung',
    description: 'Kunde meldet nach Anmeldung mit dem Geburtsdatum eine neue Anschrift. Die Änderung landet als Eingang beim Sachbearbeiter.',
    auth: 'geburtsdatum',
    schema: [
      { key: 'kundennummer', label: 'Kundennummer', kind: 'digits12', required: true, hint: '12 Ziffern' },
      { key: 'name', label: 'Name', kind: 'text', required: true, secret: true },
      { key: 'geburtsdatum', label: 'Geburtsdatum', kind: 'date', required: true, secret: true, hint: 'TT.MM.JJJJ' },
      { key: 'strasse', label: 'Bisherige Straße und Nr.', kind: 'text', required: true, secret: true },
      { key: 'plz', label: 'Bisherige PLZ', kind: 'plz', required: true, secret: true },
      { key: 'ort', label: 'Bisheriger Ort', kind: 'text', required: true, secret: true },
    ],
  },
  {
    id: 'DOK',
    name: 'Dokument einreichen',
    description: 'Sichere Übermittlung eines Nachweises (z. B. Befreiungsbescheinigung) nach Identifizierung per Online-Ausweis, Video-Ident oder Bank-Ident.',
    auth: 'ident',
    schema: [
      { key: 'kundennummer', label: 'Kundennummer', kind: 'digits12', required: true, hint: '12 Ziffern' },
      { key: 'dokument', label: 'Angefordertes Dokument', kind: 'text', required: true, hint: 'z. B. Befreiungsbescheinigung 2027' },
      { key: 'frist', label: 'Frist', kind: 'date', required: false, hint: 'TT.MM.JJJJ' },
      { key: 'niveau', label: 'Vertrauensniveau', kind: 'select', required: true, options: [['substanziell', 'substanziell (alle Verfahren)'], ['hoch', 'hoch (nur Online-Ausweis)']] },
      { key: 'name', label: 'Name (wird beim Ident geprüft)', kind: 'text', required: true, secret: true },
      { key: 'geburtsdatum', label: 'Geburtsdatum (wird beim Ident geprüft)', kind: 'date', required: true, secret: true, hint: 'TT.MM.JJJJ' },
    ],
  },
  {
    id: 'INFO',
    name: 'Info-Link',
    description: 'Einfacher verwalteter Link, z. B. zu einer Produktseite. Zeigt, dass der Manager mehr als Zahlungen kann.',
    schema: [
      { key: 'titel', label: 'Titel', kind: 'text', required: true },
      { key: 'url', label: 'Ziel', kind: 'url', required: true, hint: '/info oder https://…' },
    ],
  },
];

// Code-Arten: die Code-ID beginnt mit der Art (z. B. PAY-7K3QX9). Die Art legt fest, welche Variablen ein Code hat.
const schema = (serial) => `
CREATE TABLE IF NOT EXISTS code_types (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  description TEXT NOT NULL,
  schema      TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS codes (
  id          TEXT PRIMARY KEY,
  type        TEXT NOT NULL REFERENCES code_types(id),
  label       TEXT NOT NULL,
  vars        TEXT NOT NULL,
  version     INTEGER NOT NULL DEFAULT 1,
  status      TEXT NOT NULL DEFAULT 'aktiv',
  single_use  INTEGER NOT NULL DEFAULT 1,
  expires_at  TEXT,
  scans       INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS payments (
  id           TEXT PRIMARY KEY,
  code_id      TEXT NOT NULL REFERENCES codes(id) ON DELETE CASCADE,
  method       TEXT NOT NULL,
  amount       INTEGER NOT NULL,
  fee          INTEGER NOT NULL,
  total        INTEGER NOT NULL,
  status       TEXT NOT NULL,
  provider_ref TEXT,
  reason       TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS events (
  id          ${serial},
  code_id     TEXT NOT NULL REFERENCES codes(id) ON DELETE CASCADE,
  payment_id  TEXT,
  ts          TEXT NOT NULL,
  actor       TEXT NOT NULL,
  kind        TEXT NOT NULL,
  message     TEXT NOT NULL,
  data        TEXT
);
CREATE INDEX IF NOT EXISTS events_code ON events(code_id, id);
CREATE INDEX IF NOT EXISTS payments_code ON payments(code_id);
CREATE TABLE IF NOT EXISTS auth_state (
  code_id      TEXT PRIMARY KEY REFERENCES codes(id) ON DELETE CASCADE,
  fails        INTEGER NOT NULL DEFAULT 0,
  locked_until TEXT
);
CREATE TABLE IF NOT EXISTS submissions (
  id          TEXT PRIMARY KEY,
  code_id     TEXT NOT NULL REFERENCES codes(id) ON DELETE CASCADE,
  kind        TEXT NOT NULL,
  data        TEXT NOT NULL,
  blob        TEXT,
  created_at  TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS submissions_code ON submissions(code_id);
`;

function sqlite() {
  const { DatabaseSync } = require('node:sqlite');
  // Auf Vercel ohne Postgres nur als Notlösung: /tmp ist pro Instanz und nicht dauerhaft
  const temp = !process.env.DB_FILE && !!process.env.VERCEL;
  const file = process.env.DB_FILE || (temp ? '/tmp/qr.sqlite' : path.join(__dirname, '..', 'data', 'qr.sqlite'));
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const d = new DatabaseSync(file);
  d.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  d.exec(schema('INTEGER PRIMARY KEY AUTOINCREMENT'));
  return {
    kind: temp ? 'SQLite (temporär, Postgres verbinden!)' : 'SQLite',
    all: async (q, p = []) => d.prepare(q).all(...p),
    get: async (q, p = []) => d.prepare(q).get(...p),
    run: async (q, p = []) => { d.prepare(q).run(...p); },
  };
}

function postgres() {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3, ssl: /localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL) ? false : { rejectUnauthorized: false } });
  const conv = (q) => { let i = 0; return q.replace(/\?/g, () => `$${++i}`); };
  let init;
  const ready = () => (init ??= pool.query(schema('BIGSERIAL PRIMARY KEY')).catch((e) => { init = null; throw e; }));
  const query = async (q, p) => { await ready(); return (await pool.query(conv(q), p)).rows; };
  return {
    kind: 'Postgres',
    all: (q, p = []) => query(q, p),
    get: async (q, p = []) => (await query(q, p))[0],
    run: async (q, p = []) => { await query(q, p); },
  };
}

const db = process.env.DATABASE_URL ? postgres() : sqlite();

// Code-Arten bei jedem Start aktualisieren
async function seed() {
  for (const t of TYPES) {
    await db.run(`INSERT INTO code_types (id, name, description, schema) VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET name = excluded.name, description = excluded.description, schema = excluded.schema`,
    [t.id, t.name, t.description, JSON.stringify(t.schema)]);
  }
  // Frühere Beispiel-Codes zeigten auf example.com, jetzt auf die eigene Info-Seite
  await db.run(`UPDATE codes SET vars = REPLACE(vars, '"url":"https://example.com/"', '"url":"/info"') WHERE type = 'INFO' AND vars LIKE '%example.com%'`);
}
let seeded;
db.ready = () => (seeded ??= seed().catch((e) => { seeded = null; throw e; }));

db.TYPES = Object.fromEntries(TYPES.map((t) => [t.id, t]));

module.exports = db;
