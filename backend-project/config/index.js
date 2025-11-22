const { createDatabase, createUsersTable } = require('./database');

(async () => {
  await createDatabase();     // Tạo DB nếu chưa tồn tại
  await createUsersTable();   // Tạo bảng
})();
