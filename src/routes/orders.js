const router = require('express').Router();
const pool = require('../db');
const { HttpError, wrap, parseId, requireFields } = require('../utils');

const STATUSES = ['pending', 'processing', 'ready', 'completed', 'cancelled'];

// Mengambil 1 pesanan lengkap beserta item dan pembayarannya
async function getOrderDetail(client, id) {
  const order = await client.query(
    `SELECT o.*, u.name AS user_name, u.email AS user_email
       FROM orders o JOIN users u ON u.id = o.user_id
      WHERE o.id = $1`,
    [id]
  );
  if (!order.rows[0]) return null;
  const items = await client.query(
    `SELECT oi.*, s.name AS service_name, s.unit
       FROM order_items oi JOIN services s ON s.id = oi.service_id
      WHERE oi.order_id = $1 ORDER BY oi.id`,
    [id]
  );
  const payments = await client.query(
    'SELECT * FROM payments WHERE order_id = $1 ORDER BY id',
    [id]
  );
  return { ...order.rows[0], items: items.rows, payments: payments.rows };
}

// GET /orders?status=pending&user_id=2
router.get('/', wrap(async (req, res) => {
  const where = [];
  const params = [];
  if (req.query.status) {
    if (!STATUSES.includes(req.query.status)) {
      throw new HttpError(400, `Status tidak valid. Pilihan: ${STATUSES.join(', ')}`);
    }
    params.push(req.query.status);
    where.push(`o.status = $${params.length}`);
  }
  if (req.query.user_id) {
    params.push(parseId(req.query.user_id));
    where.push(`o.user_id = $${params.length}`);
  }
  const { rows } = await pool.query(
    `SELECT o.*, u.name AS user_name
       FROM orders o JOIN users u ON u.id = o.user_id
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY o.id DESC`,
    params
  );
  res.json({ message: 'Daftar pesanan', data: rows });
}));

router.get('/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  const data = await getOrderDetail(pool, id);
  if (!data) throw new HttpError(404, 'Pesanan tidak ditemukan');
  res.json({ message: 'Detail pesanan', data });
}));

// POST /orders  -> membuat pesanan + item sekaligus (dalam 1 transaksi)
router.post('/', wrap(async (req, res) => {
  requireFields(req.body, ['user_id', 'items']);
  const { user_id, notes = null, pickup_date = null, items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpError(400, 'Field items harus berupa array dan minimal berisi 1 item');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const user = await client.query('SELECT id FROM users WHERE id = $1', [parseId(user_id)]);
    if (!user.rows[0]) throw new HttpError(404, 'User tidak ditemukan');

    const order = await client.query(
      'INSERT INTO orders (user_id, notes, pickup_date) VALUES ($1, $2, $3) RETURNING id',
      [user_id, notes, pickup_date]
    );
    const orderId = order.rows[0].id;

    let total = 0;
    for (const [i, item] of items.entries()) {
      requireFields(item, ['service_id', 'quantity']);
      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        throw new HttpError(400, `items[${i}].quantity harus berupa bilangan bulat > 0`);
      }
      if (item.color_mode && !['bw', 'color'].includes(item.color_mode)) {
        throw new HttpError(400, `items[${i}].color_mode harus 'bw' atau 'color'`);
      }
      const svc = await client.query(
        'SELECT id, price_per_unit, is_active FROM services WHERE id = $1',
        [parseId(item.service_id)]
      );
      if (!svc.rows[0]) throw new HttpError(404, `Layanan dengan id ${item.service_id} tidak ditemukan`);
      if (!svc.rows[0].is_active) throw new HttpError(400, `Layanan dengan id ${item.service_id} sedang tidak aktif`);

      const unitPrice = Number(svc.rows[0].price_per_unit);
      const subtotal = unitPrice * item.quantity;
      total += subtotal;

      await client.query(
        `INSERT INTO order_items
           (order_id, service_id, quantity, unit_price, subtotal, paper_size, color_mode, file_url, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [orderId, item.service_id, item.quantity, unitPrice, subtotal,
         item.paper_size || 'A4', item.color_mode || 'bw', item.file_url || null, item.notes || null]
      );
    }

    await client.query('UPDATE orders SET total_price = $1 WHERE id = $2', [total, orderId]);
    const data = await getOrderDetail(client, orderId);
    await client.query('COMMIT');
    res.status(201).json({ message: 'Pesanan berhasil dibuat', data });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

// PATCH /orders/:id  -> ubah status / catatan / tanggal ambil
router.patch('/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  const { status, notes, pickup_date } = req.body;
  if (status === undefined && notes === undefined && pickup_date === undefined) {
    throw new HttpError(400, 'Kirim minimal salah satu field: status, notes, pickup_date');
  }
  if (status !== undefined && !STATUSES.includes(status)) {
    throw new HttpError(400, `Status tidak valid. Pilihan: ${STATUSES.join(', ')}`);
  }
  const { rows } = await pool.query(
    `UPDATE orders SET
        status = COALESCE($1, status),
        notes = COALESCE($2, notes),
        pickup_date = COALESCE($3, pickup_date),
        updated_at = NOW()
      WHERE id = $4 RETURNING *`,
    [status ?? null, notes ?? null, pickup_date ?? null, id]
  );
  if (!rows[0]) throw new HttpError(404, 'Pesanan tidak ditemukan');
  res.json({ message: 'Pesanan berhasil diubah', data: rows[0] });
}));

router.delete('/:id', wrap(async (req, res) => {
  const id = parseId(req.params.id);
  const { rows } = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING *', [id]);
  if (!rows[0]) throw new HttpError(404, 'Pesanan tidak ditemukan');
  res.json({ message: 'Pesanan berhasil dihapus', data: rows[0] });
}));

module.exports = router;
