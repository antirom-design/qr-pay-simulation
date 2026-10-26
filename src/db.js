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
    id: 'INFO',
    name: 'Info-Link',
    description: 'Einfacher verwalteter Link, z. B. zu einer Produktseite. Zeigt, dass der Manager mehr als Zahlungen kann.',
    schema: [
      { key: 'titel', label: 'Titel', kind: 'text', required: true },
      { key: 'url', label: 'Ziel-URL', kind: 'url', required: true, hint: 'https://…' },
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
`;

function sqlite() {
  const { DatabaseSync } = require('node:sqlite');
  const file = process.env.DB_FILE || path.join(__dirname, '..', 'data', 'qr.sqlite');
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const d = new DatabaseSync(file);
  d.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  d.exec(schema('INTEGER PRIMARY KEY AUTOINCREMENT'));
  return {
    kind: 'SQLite',
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
let seeded;
db.ready = () => (seeded ??= Promise.all(TYPES.map((t) => db.run(
  `INSERT INTO code_types (id, name, description, schema) VALUES (?, ?, ?, ?)
   ON CONFLICT(id) DO UPDATE SET name = excluded.name, description = excluded.description, schema = excluded.schema`,
  [t.id, t.name, t.description, JSON.stringify(t.schema)],
))).catch((e) => { seeded = null; throw e; }));

module.exports = db;
