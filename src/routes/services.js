const router = require('express').Router();
const pool = require('../db');
const {
  HttpError, wrap, parseId, requireFields, requireNonNegativeNumber, partialUpdate,
} = require('../utils');

const FIELDS = ['category_id', 'name', 'description', 'price_per_unit', 'unit', 'is_active'];

// GET /services?category_id=1&active=true
router.get('/', wrap(async (req, res) => {
  const where = [];
  const params = [];
  if (req.query.category_id) {
    params.push(parseId(req.query.category_id));
    where.push(`s.category_id = $${params.length}`);
  }
  if (req.query.active !== undefined) {
    params.push(req.query.active === 'true');
    where.push(`s.is_active = $${params.length}`);
  }
  const { rows } = await pool.query(
    `SELECT s.*, c.name AS category_name
       FROM services s JOIN categories c ON c.id = s.category_id
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY s.id`,
    params
  );
  res.json({ message: 'Daftar layanan', data: rows });
}));

router.get('/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  const { rows } = await pool.query(
    `SELECT s.*, c.name AS category_name
       FROM services s JOIN categories c ON c.id = s.category_id
      WHERE s.id = $1`,
    [id]
  );
  if (!rows[0]) throw new HttpError(404, 'Layanan tidak ditemukan');
  res.json({ message: 'Detail layanan', data: rows[0] });
}));

router.post('/', wrap(async (req, res) => {
  requireFields(req.body, ['category_id', 'name', 'price_per_unit']);
  requireNonNegativeNumber(req.body.price_per_unit, 'price_per_unit');
  const { category_id, name, description = null, price_per_unit, unit = 'lembar', is_active = true } = req.body;
  const { rows } = await pool.query(
    `INSERT INTO services (category_id, name, description, price_per_unit, unit, is_active)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [category_id, name, description, price_per_unit, unit, is_active]
  );
  res.status(201).json({ message: 'Layanan berhasil ditambahkan', data: rows[0] });
}));

router.put('/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  requireFields(req.body, ['category_id', 'name', 'price_per_unit']);
  requireNonNegativeNumber(req.body.price_per_unit, 'price_per_unit');
  const { category_id, name, description = null, price_per_unit, unit = 'lembar', is_active = true } = req.body;
  const { rows } = await pool.query(
    `UPDATE services
        SET category_id = $1, name = $2, description = $3, price_per_unit = $4, unit = $5, is_active = $6
      WHERE id = $7 RETURNING *`,
    [category_id, name, description, price_per_unit, unit, is_active, id]
  );
  if (!rows[0]) throw new HttpError(404, 'Layanan tidak ditemukan');
  res.json({ message: 'Layanan berhasil diubah', data: rows[0] });
}));

router.patch('/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  if (req.body.price_per_unit !== undefined) {
    requireNonNegativeNumber(req.body.price_per_unit, 'price_per_unit');
  }
  const row = await partialUpdate(pool, 'services', id, req.body, FIELDS);
  if (!row) throw new HttpError(404, 'Layanan tidak ditemukan');
  res.json({ message: 'Layanan berhasil diubah', data: row });
}));

router.delete('/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  const { rows } = await pool.query('DELETE FROM services WHERE id = $1 RETURNING *', [id]);
  if (!rows[0]) throw new HttpError(404, 'Layanan tidak ditemukan');
  res.json({ message: 'Layanan berhasil dihapus', data: rows[0] });
}));

module.exports = router;
