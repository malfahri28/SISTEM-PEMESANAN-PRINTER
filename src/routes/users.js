const router = require('express').Router();
const pool = require('../db');
const { HttpError, wrap, parseId, requireFields, partialUpdate } = require('../utils');

const FIELDS = ['name', 'email', 'phone', 'role'];

router.get('/', wrap(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM users ORDER BY id');
  res.json({ message: 'Daftar user', data: rows });
}));

router.get('/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
  if (!rows[0]) throw new HttpError(404, 'User tidak ditemukan');
  res.json({ message: 'Detail user', data: rows[0] });
}));

router.post('/', wrap(async (req, res) => {
  requireFields(req.body, ['name', 'email']);
  const { name, email, phone = null, role = 'customer' } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO users (name, email, phone, role) VALUES ($1, $2, $3, $4) RETURNING *',
    [name, email, phone, role]
  );
  res.status(201).json({ message: 'User berhasil ditambahkan', data: rows[0] });
}));

router.put('/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  requireFields(req.body, ['name', 'email']);
  const { name, email, phone = null, role = 'customer' } = req.body;
  const { rows } = await pool.query(
    'UPDATE users SET name = $1, email = $2, phone = $3, role = $4 WHERE id = $5 RETURNING *',
    [name, email, phone, role, id]
  );
  if (!rows[0]) throw new HttpError(404, 'User tidak ditemukan');
  res.json({ message: 'User berhasil diubah', data: rows[0] });
}));

router.patch('/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  const row = await partialUpdate(pool, 'users', id, req.body, FIELDS);
  if (!row) throw new HttpError(404, 'User tidak ditemukan');
  res.json({ message: 'User berhasil diubah', data: row });
}));

router.delete('/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  const { rows } = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);
  if (!rows[0]) throw new HttpError(404, 'User tidak ditemukan');
  res.json({ message: 'User berhasil dihapus', data: rows[0] });
}));

module.exports = router;
