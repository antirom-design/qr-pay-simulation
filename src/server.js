// Lokaler Start: npm start
const http = require('http');
const os = require('os');
const handler = require('./app');

const PORT = Number(process.env.PORT || 3000);
http.createServer(handler).listen(PORT, () => {
  const ip = Object.values(os.networkInterfaces()).flat().find((i) => i && i.family === 'IPv4' && !i.internal)?.address;
  console.log(`QR-Code-Manager:   http://localhost:${PORT}`);
  if (ip) console.log(`Im WLAN (Handy):   http://${ip}:${PORT}`);
  console.log(`Datenbank:         ${process.env.DATABASE_URL ? 'Postgres' : `SQLite (${process.env.DB_FILE || 'data/qr.sqlite'})`}`);
});
