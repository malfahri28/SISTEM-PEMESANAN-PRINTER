const router = require('express').Router();
const pool = require('../db');
const { HttpError, wrap, parseId, requireFields, partialUpdate } = require('../utils');

const FIELDS = ['name', 'description'];

router.get('/', wrap(async (req, res) => {
  const { rows } = await pool.query('SELECT * FROM categories ORDER BY id');
  res.json({ message: 'Daftar kategori', data: rows });
}));

router.get('/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  const { rows } = await pool.query('SELECT * FROM categories WHERE id = $1', [id]);
  if (!rows[0]) throw new HttpError(404, 'Kategori tidak ditemukan');
  res.json({ message: 'Detail kategori', data: rows[0] });
}));

router.post('/', wrap(async (req, res) => {
  requireFields(req.body, ['name']);
  const { name, description = null } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *',
    [name, description]
  );
  res.status(201).json({ message: 'Kategori berhasil ditambahkan', data: rows[0] });
}));

router.put('/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  requireFields(req.body, ['name']);
  const { name, description = null } = req.body;
  const { rows } = await pool.query(
    'UPDATE categories SET name = $1, description = $2 WHERE id = $3 RETURNING *',
    [name, description, id]
  );
  if (!rows[0]) throw new HttpError(404, 'Kategori tidak ditemukan');
  res.json({ message: 'Kategori berhasil diubah', data: rows[0] });
}));

router.patch('/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  const row = await partialUpdate(pool, 'categories', id, req.body, FIELDS);
  if (!row) throw new HttpError(404, 'Kategori tidak ditemukan');
  res.json({ message: 'Kategori berhasil diubah', data: row });
}));

router.delete('/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  const { rows } = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
  if (!rows[0]) throw new HttpError(404, 'Kategori tidak ditemukan');
  res.json({ message: 'Kategori berhasil dihapus', data: rows[0] });
}));

module.exports = router;
