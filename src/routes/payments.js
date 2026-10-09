const router = require('express').Router();
const pool = require('../db');
const { HttpError, wrap, parseId, requireFields, requireNonNegativeNumber } = require('../utils');
 
const METHODS = ['cash', 'transfer', 'qris', 'ewallet'];
const STATUSES = ['pending', 'paid', 'failed'];
 
// GET /payments?order_id=1&status=paid
router.get('/', wrap(async (req, res) => {
  const where = [];
  const params = [];
  if (req.query.order_id) {
    params.push(parseId(req.query.order_id));
    where.push(`order_id = $${params.length}`);
  }
  if (req.query.status) {
    params.push(req.query.status);
    where.push(`status = $${params.length}`);
  }
  const { rows } = await pool.query(
    `SELECT * FROM payments ${where.length ? 'WHERE ' + where.join(' AND ') : ''} ORDER BY id`,
    params
  );
  res.json({ message: 'Daftar pembayaran', data: rows });
}));
 
router.get('/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  const { rows } = await pool.query('SELECT * FROM payments WHERE id = $1', [id]);
  if (!rows[0]) throw new HttpError(404, 'Pembayaran tidak ditemukan');
  res.json({ message: 'Detail pembayaran', data: rows[0] });
}));
 
router.post('/', wrap(async (req, res) => {
  requireFields(req.body, ['order_id', 'amount', 'method']);
  requireNonNegativeNumber(req.body.amount, 'amount');
  const { order_id, amount, method, status = 'pending' } = req.body;
  if (!METHODS.includes(method)) {
    throw new HttpError(400, `Method tidak valid. Pilihan: ${METHODS.join(', ')}`);
  }
  if (!STATUSES.includes(status)) {
    throw new HttpError(400, `Status tidak valid. Pilihan: ${STATUSES.join(', ')}`);
  }
  const order = await pool.query('SELECT id FROM orders WHERE id = $1', [parseId(order_id)]);
  if (!order.rows[0]) throw new HttpError(404, 'Pesanan tidak ditemukan');
 
  // paid_at dihitung di JavaScript agar tipe parameter SQL tidak ambigu
  const paidAt = status === 'paid' ? new Date() : null;
  const { rows } = await pool.query(
    `INSERT INTO payments (order_id, amount, method, status, paid_at)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [order_id, amount, method, status, paidAt]
  );
  res.status(201).json({ message: 'Pembayaran berhasil dicatat', data: rows[0] });
}));
 
// PATCH /payments/:id  -> ubah status pembayaran (misal pending -> paid)
router.patch('/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  requireFields(req.body, ['status']);
  if (!STATUSES.includes(req.body.status)) {
    throw new HttpError(400, `Status tidak valid. Pilihan: ${STATUSES.join(', ')}`);
  }
  const paidAt = req.body.status === 'paid' ? new Date() : null;
  const { rows } = await pool.query(
    `UPDATE payments SET status = $1, paid_at = $2 WHERE id = $3 RETURNING *`,
    [req.body.status, paidAt, id]
  );
  if (!rows[0]) throw new HttpError(404, 'Pembayaran tidak ditemukan');
  res.json({ message: 'Status pembayaran berhasil diubah', data: rows[0] });
}));
 
router.delete('/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  const { rows } = await pool.query('DELETE FROM payments WHERE id = $1 RETURNING *', [id]);
  if (!rows[0]) throw new HttpError(404, 'Pembayaran tidak ditemukan');
  res.json({ message: 'Pembayaran berhasil dihapus', data: rows[0] });
}));
 
module.exports = router;
 
