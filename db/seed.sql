-- Data contoh (opsional) untuk mempermudah pengujian

INSERT INTO users (name, email, phone, role) VALUES
  ('Admin PrintKu', 'admin@printku.com', '081200000001', 'admin'),
  ('Budi Santoso', 'budi@example.com', '081200000002', 'customer'),
  ('Siti Aminah', 'siti@example.com', '081200000003', 'customer');

INSERT INTO categories (name, description) VALUES
  ('Dokumen', 'Cetak dokumen, makalah, skripsi, dan jilid'),
  ('Foto', 'Cetak foto berbagai ukuran'),
  ('Banner & Spanduk', 'Cetak banner, spanduk, dan x-banner');

INSERT INTO services (category_id, name, description, price_per_unit, unit) VALUES
  (1, 'Print Hitam Putih A4', 'Cetak dokumen hitam putih kertas A4 80gsm', 500, 'lembar'),
  (1, 'Print Warna A4', 'Cetak dokumen warna kertas A4 80gsm', 1500, 'lembar'),
  (1, 'Jilid Spiral', 'Jilid spiral kawat', 7000, 'buku'),
  (2, 'Cetak Foto 4R', 'Foto ukuran 4R glossy', 3000, 'lembar'),
  (3, 'Banner Flexi 280gr', 'Banner flexi per meter persegi', 25000, 'm2');

INSERT INTO orders (user_id, status, total_price, notes, pickup_date) VALUES
  (2, 'pending', 12500, 'Tolong dijilid rapi', CURRENT_DATE + 1);

INSERT INTO order_items (order_id, service_id, quantity, unit_price, subtotal, paper_size, color_mode, file_url) VALUES
  (1, 1, 10, 500, 5000, 'A4', 'bw', 'https://example.com/files/makalah.pdf'),
  (1, 2, 5, 1500, 7500, 'A4', 'color', 'https://example.com/files/lampiran.pdf');

INSERT INTO payments (order_id, amount, method, status) VALUES
  (1, 12500, 'qris', 'pending');
