// Menjalankan db/schema.sql (dan seed.sql jika ada argumen --seed)
// Pemakaian: npm run db:init            (hanya tabel)
//            npm run db:init -- --seed  (tabel + data contoh)
const fs = require('fs');
const path = require('path');
const pool = require('../src/db');

(async () => {
  try {
    const run = async (file) => {
      const sql = fs.readFileSync(path.join(__dirname, '..', 'db', file), 'utf8');
      await pool.query(sql);
      console.log(`OK: ${file}`);
    };
    await run('schema.sql');
    if (process.argv.includes('--seed')) await run('seed.sql');
  } catch (err) {
    console.error('Gagal:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
