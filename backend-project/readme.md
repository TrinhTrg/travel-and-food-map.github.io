# tạo db :
npx sequelize-cli db:create

# tạo table
npx sequelize-cli db:migrate

# Chạy seeds
npx sequelize-cli db:seed:all

# Xem migrations đã chạy
npx sequelize-cli db:migrate:status

# Nếu cần undo migrate và seed
# Undo tất cả seeds
npx sequelize-cli db:seed:undo:all

# Undo tất cả migrations (nếu cần reset hoàn toàn)
npx sequelize-cli db:migrate:undo:all
