const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'PrintKu API - Sistem Pemesanan Printing',
    version: '1.0.0',
    endpoints: ['/categories', '/services', '/users', '/orders', '/payments'],
  });
});

app.use('/categories', require('./routes/categories'));
app.use('/services', require('./routes/services'));
app.use('/users', require('./routes/users'));
app.use('/orders', require('./routes/orders'));
app.use('/payments', require('./routes/payments'));

// 404 untuk route yang tidak ada
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} tidak ditemukan` });
});

// Error handler terpusat
app.use((err, req, res, next) => {
  // JSON body rusak
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Body request bukan JSON yang valid' });
  }
  if (err.status) {
    return res.status(err.status).json({ error: err.message });
  }
  // Error PostgreSQL yang umum
  switch (err.code) {
    case '23503':
      return res.status(400).json({ error: 'Data relasi (foreign key) tidak ditemukan atau masih dipakai data lain' });
    case '23505':
      return res.status(409).json({ error: 'Data sudah ada (nilai duplikat pada field unik)' });
    case '23514':
      return res.status(400).json({ error: 'Nilai salah satu field tidak memenuhi aturan yang diizinkan' });
    case '22P02':
    case '22007':
    case '22008':
      return res.status(400).json({ error: 'Format salah satu field tidak valid' });
    case '23502':
      return res.status(400).json({ error: 'Ada field wajib yang kosong' });
  }
  console.error(err);
  res.status(500).json({ error: 'Terjadi kesalahan pada server' });
});

module.exports = app;
