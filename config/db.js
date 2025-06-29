const mysql = require('mysql2');
const util = require('util');

const db = mysql.createConnection({
  host: '89.163.214.37', // عنوان MaznHost
  user: 'amlhabra_brak',
  password: 'hSgMaUAGjPdGa7ZfRM6T',
  database: 'amlhabra_brak',
  port: 3306,
  connectTimeout: 30000, // زيادة المهلة لـ 30 ثانية
  acquireTimeout: 30000,
  timeout: 30000,
  reconnect: true,
  charset: 'utf8mb4'
});

db.connect((err) => {
  if (err) {
    console.error("❌ لم يتم الاتصال بقاعدة البيانات:", err.message);
    console.error("تفاصيل الخطأ:", err);
    return;
  }
  console.log("✅ تم الاتصال بقاعدة البيانات بنجاح");
});

// إضافة معالج للأخطاء
db.on('error', (err) => {
  console.error('خطأ في قاعدة البيانات:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('تم فقدان الاتصال بقاعدة البيانات. محاولة إعادة الاتصال...');
  } else {
    throw err;
  }
});

db.query = util.promisify(db.query);
module.exports = db;
