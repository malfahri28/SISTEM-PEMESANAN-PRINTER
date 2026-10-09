class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Membungkus handler async agar error otomatis diteruskan ke error handler
const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const parseId = (value) => {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) {
    throw new HttpError(400, 'ID harus berupa angka bulat positif');
  }
  return n;
};

const requireFields = (body, fields) => {
  for (const f of fields) {
    if (body[f] === undefined || body[f] === null || body[f] === '') {
      throw new HttpError(400, `Field ${f} wajib diisi`);
    }
  }
};

const requireNonNegativeNumber = (value, field) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
    throw new HttpError(400, `Field ${field} harus berupa angka >= 0`);
  }
};

// Membangun query UPDATE parsial dari field yang diizinkan
const partialUpdate = async (pool, table, id, body, allowed, extraSet = '') => {
  const keys = allowed.filter((k) => body[k] !== undefined);
  if (keys.length === 0) {
    throw new HttpError(400, `Tidak ada field yang diubah. Field yang diizinkan: ${allowed.join(', ')}`);
  }
  const sets = keys.map((k, i) => `${k} = $${i + 1}`);
  if (extraSet) sets.push(extraSet);
  const values = keys.map((k) => body[k]);
  values.push(id);
  const { rows } = await pool.query(
    `UPDATE ${table} SET ${sets.join(', ')} WHERE id = $${values.length} RETURNING *`,
    values
  );
  return rows[0];
};

module.exports = {
  HttpError,
  wrap,
  parseId,
  requireFields,
  requireNonNegativeNumber,
  partialUpdate,
};
