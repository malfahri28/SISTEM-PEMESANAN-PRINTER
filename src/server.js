// Entry point untuk menjalankan secara lokal: npm start
require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`PrintKu API berjalan di http://localhost:${PORT}`));
