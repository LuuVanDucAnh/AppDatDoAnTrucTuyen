require('./node_modules/dotenv').config({ path: './.env' });
const { sequelize } = require('./src/config/database.js');

async function main() {
  try {
    const restaurantIds = [11, 10, 9];

    for (const resId of restaurantIds) {
      console.log('================================================================');
      const [resRows] = await sequelize.query(`
        SELECT r.id, r.name, r.address, r.phone_number, r.opening_time, r.closing_time, r.status,
               u.id as owner_id, u.full_name as owner_name, u.email as owner_email, u.phone_number as owner_phone, u.role as owner_role, u.password as owner_password_hash
        FROM restaurants r
        LEFT JOIN users u ON r.owner_id = u.id
        WHERE r.id = :resId
      `, { replacements: { resId } });

      if (resRows.length === 0) {
        console.log(`Restaurant ID ${resId} not found`);
        continue;
      }

      const res = resRows[0];
      console.log(`NHÀ HÀNG: ${res.name} (ID: ${res.id})`);
      console.log(`Địa chỉ: ${res.address}`);
      console.log(`Hotline: ${res.phone_number}`);
      console.log(`Thời gian hoạt động: ${res.opening_time} - ${res.closing_time}`);
      console.log(`Trạng thái: ${res.status}`);
      console.log(`CHỦ QUÁN: ${res.owner_name} (ID: ${res.owner_id})`);
      console.log(`Email đăng nhập: ${res.owner_email}`);
      console.log(`Số điện thoại: ${res.owner_phone}`);
      console.log(`Vai trò (Role): ${res.owner_role}`);
      console.log(`Password Hash: ${res.owner_password_hash}`);

      const [foodRows] = await sequelize.query(`
        SELECT f.id, f.name, f.price, f.description, f.status, c.name as category_name
        FROM foods f
        LEFT JOIN categories c ON f.category_id = c.id
        WHERE f.restaurant_id = :resId
        ORDER BY f.id ASC
      `, { replacements: { resId } });

      console.log(`DANH SÁCH MÓN ĂN (${foodRows.length} món):`);
      foodRows.forEach((f, idx) => {
        console.log(`  ${idx + 1}. [${f.category_name || 'Khác'}] ${f.name} - ${Number(f.price).toLocaleString('vi-VN')}đ - Trạng thái: ${f.status} | Mô tả: ${f.description || 'Không có mô tả'}`);
      });
      console.log('\n');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
