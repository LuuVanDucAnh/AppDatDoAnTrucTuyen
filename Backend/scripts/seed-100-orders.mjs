import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function main() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'datdoan',
  });

  console.log('🚀 Kết nối MySQL thành công. Bắt đầu seed ~100 đơn hàng...');

  // 1. Thêm khách hàng mới nếu chưa có
  const newCustomers = [
    { name: 'Hoàng Văn Nam', email: 'hoangnam@gmail.com', phone: '0912111222', addr: 'Số 12 Chùa Bộc, Đống Đa, Hà Nội' },
    { name: 'Nguyễn Thu Hà', email: 'thuha@gmail.com', phone: '0988333444', addr: 'Tòa nhà FPT, Duy Tân, Cầu Giấy, Hà Nội' },
    { name: 'Trần Minh Trí', email: 'minhtri@gmail.com', phone: '0903555666', addr: 'Số 88 Hai Bà Trưng, Quận 1, TP.HCM' },
    { name: 'Đặng Phương Anh', email: 'phuonganh@gmail.com', phone: '0977888999', addr: 'Chung cư Masteri Thảo Điền, Quận 2, TP.HCM' },
    { name: 'Vũ Quốc Bảo', email: 'quocbao@gmail.com', phone: '0933222111', addr: 'Số 154 Nguyễn Đình Chiểu, Quận 3, TP.HCM' },
    { name: 'Bùi Thanh Thảo', email: 'thanhthao@gmail.com', phone: '0966444555', addr: 'Số 45 Trần Thái Tông, Cầu Giấy, Hà Nội' },
    { name: 'Phạm Việt Dũng', email: 'vietdung@gmail.com', phone: '0918777666', addr: 'Khu đô thị Vinhomes Ocean Park, Gia Lâm, Hà Nội' },
    { name: 'Lê Mỹ Duyên', email: 'myduyen@gmail.com', phone: '0909123890', addr: 'Số 200 Phan Xích Long, Phú Nhuận, TP.HCM' },
  ];

  const hashedPassword = await bcrypt.hash('123456', 10);
  for (const c of newCustomers) {
    const [ex] = await db.query('SELECT id FROM users WHERE email = ?', [c.email]);
    let uid;
    if (ex.length) {
      uid = ex[0].id;
    } else {
      const [res] = await db.query(
        'INSERT INTO users (full_name, email, phone_number, password, role, status, created_at, updated_at) VALUES (?,?,?,?,?,1,NOW(),NOW())',
        [c.name, c.email, c.phone, hashedPassword, 'CUSTOMER']
      );
      uid = res.insertId;
      console.log(`+ Thêm khách hàng: ${c.name} (#${uid})`);
    }

    const [exAddr] = await db.query('SELECT id FROM addresses WHERE user_id = ?', [uid]);
    if (!exAddr.length) {
      await db.query(
        'INSERT INTO addresses (user_id, receiver_name, phone_number, address_detail, ward, district, city, is_default, created_at, updated_at) VALUES (?,?,?,?,"Phường 1","Quận 1","Hà Nội",1,NOW(),NOW())',
        [uid, c.name, c.phone, c.addr]
      );
    }
  }

  // 2. Lấy danh sách khách hàng và địa chỉ
  const [customers] = await db.query("SELECT id, full_name, email, phone_number FROM users WHERE role = 'CUSTOMER'");
  const [addresses] = await db.query('SELECT id, user_id, address_detail, phone_number FROM addresses');
  const addressByUserId = {};
  for (const a of addresses) {
    addressByUserId[a.user_id] = a.id;
  }

  // 3. Lấy danh sách nhà hàng và món ăn
  const [restaurants] = await db.query('SELECT id, name FROM restaurants');
  const [foods] = await db.query(
    `SELECT f.id, c.restaurant_id, f.name, f.price 
     FROM foods f 
     JOIN categories c ON f.category_id = c.id 
     WHERE f.status = 'AVAILABLE'`
  );
  const foodsByRestaurant = {};
  for (const r of restaurants) {
    foodsByRestaurant[r.id] = [];
  }
  for (const f of foods) {
    if (foodsByRestaurant[f.restaurant_id]) {
      foodsByRestaurant[f.restaurant_id].push(f);
    }
  }

  const validRestaurants = restaurants.filter((r) => foodsByRestaurant[r.id]?.length > 0);
  console.log(`Tìm thấy ${customers.length} khách hàng, ${validRestaurants.length} nhà hàng có món ăn.`);

  // 4. Lập kế hoạch phân bổ ~90 đơn hàng mới
  // Status breakdown:
  // - 70 DELIVERED
  // - 7 DELIVERING
  // - 5 PREPARING
  // - 5 PENDING
  // - 3 CANCELLED
  const ordersPlan = [];

  // A. DELIVERED: 70 đơn (rải rác từ 10 ngày trước tới hôm nay)
  const notesSample = [
    'Giao nhanh giúp em ạ',
    'Ít cay, không hành',
    'Xin thêm nước chấm',
    'Để trước cửa giúp mình',
    'Gọi trước khi đến 5 phút',
    'Nhiều đá riêng',
    'Món ngon làm cẩn thận nha quán',
    'Cho nhiều tương ớt',
    'Đồ ăn nóng hổi',
    'Xin thêm đũa muỗng',
  ];

  for (let i = 0; i < 70; i++) {
    // Phân bổ ngày: 0 = hôm nay, 1 = hôm qua, ... lên tới 10 ngày trước
    const daysAgo = Math.floor(i / 7); // ~7 đơn mỗi ngày
    ordersPlan.push({
      status: 'DELIVERED',
      daysAgo,
      minutesAgo: daysAgo === 0 ? (i + 1) * 35 : null,
      paymentMethod: i % 4 === 0 ? 'MOMO' : i % 5 === 0 ? 'VNPAY' : 'CASH',
      paymentStatus: 'PAID',
    });
  }

  // B. DELIVERING: 7 đơn (đang giao trong 10 - 45 phút gần đây)
  for (let i = 0; i < 7; i++) {
    ordersPlan.push({
      status: 'DELIVERING',
      daysAgo: 0,
      minutesAgo: 15 + i * 5,
      paymentMethod: i % 2 === 0 ? 'MOMO' : 'CASH',
      paymentStatus: i % 2 === 0 ? 'PAID' : 'UNPAID',
    });
  }

  // C. PREPARING: 5 đơn (đang nấu trong 5 - 25 phút gần đây)
  for (let i = 0; i < 5; i++) {
    ordersPlan.push({
      status: 'PREPARING',
      daysAgo: 0,
      minutesAgo: 10 + i * 4,
      paymentMethod: i % 2 === 0 ? 'VNPAY' : 'CASH',
      paymentStatus: i % 2 === 0 ? 'PAID' : 'UNPAID',
    });
  }

  // D. PENDING: 5 đơn (mới đặt trong 2 - 15 phút gần đây)
  for (let i = 0; i < 5; i++) {
    ordersPlan.push({
      status: 'PENDING',
      daysAgo: 0,
      minutesAgo: 2 + i * 3,
      paymentMethod: 'CASH',
      paymentStatus: 'UNPAID',
    });
  }

  // E. CANCELLED: 3 đơn
  for (let i = 0; i < 3; i++) {
    ordersPlan.push({
      status: 'CANCELLED',
      daysAgo: i + 1,
      minutesAgo: null,
      paymentMethod: i % 2 === 0 ? 'MOMO' : 'CASH',
      paymentStatus: i % 2 === 0 ? 'REFUNDED' : 'UNPAID',
    });
  }

  console.log(`Bắt đầu chèn ${ordersPlan.length} đơn hàng vào cơ sở dữ liệu...`);

  let addedOrders = 0;
  let addedReviews = 0;

  const sampleReviews = [
    { rating: 5, comment: 'Đồ ăn rất ngon, đóng gói sạch sẽ cẩn thận, sẽ tiếp tục ủng hộ!' },
    { rating: 5, comment: 'Món ăn nóng hổi, vị vừa miệng chuẩn vị gia truyền.' },
    { rating: 5, comment: 'Giao siêu nhanh, shipper rất thân thiện và lịch sự.' },
    { rating: 4, comment: 'Hương vị ngon, giá cả hợp lý, điểm trừ nhẹ là hơi ít nước sốt.' },
    { rating: 5, comment: 'Quán làm đồ ăn cực kỳ chất lượng, thịt mềm và thơm phức.' },
    { rating: 4, comment: 'Trà sữa thơm béo, trân châu dai mềm ngon chuẩn vị.' },
    { rating: 5, comment: 'Cơm tấm sườn dày nướng thơm nức mũi, chả trứng béo ngậy.' },
    { rating: 5, comment: 'Phở bò nước dùng trong và ngọt xương, bánh phở mềm tươi.' },
    { rating: 4, comment: 'Gà rán giòn rụm bên ngoài mọng nước bên trong.' },
    { rating: 5, comment: 'Món bún chả đậm đà, nước chấm chua ngọt xuất sắc.' },
    { rating: 4, comment: 'Ăn ngon, vừa miệng, đóng hộp giữ nhiệt tốt.' },
    { rating: 5, comment: 'Quán quen ruột, tuần nào cũng đặt 2-3 lần.' },
    { rating: 3, comment: 'Đồ ăn ổn nhưng hôm nay shipper giao hơi chậm một chút.' },
    { rating: 5, comment: 'Chất lượng 5 sao không có gì để chê.' },
    { rating: 4, comment: 'Bánh mì đầy đặn, patê béo ngậy ăn rất đã.' },
  ];

  for (let idx = 0; idx < ordersPlan.length; idx++) {
    const plan = ordersPlan[idx];
    const customer = customers[idx % customers.length];
    const addressId = addressByUserId[customer.id] || addresses[0]?.id || 1;
    const restaurant = validRestaurants[idx % validRestaurants.length];
    const resFoods = foodsByRestaurant[restaurant.id];

    // Chọn ngẫu nhiên 1 - 3 món ăn
    const numItems = (idx % 3) + 1;
    const pickedFoods = [];
    for (let f = 0; f < numItems; f++) {
      const foodItem = resFoods[(idx + f) % resFoods.length];
      pickedFoods.push(foodItem);
    }

    const foodTotal = pickedFoods.reduce((s, f) => s + Number(f.price), 0);
    const deliveryFee = 15000;
    const discount = idx % 5 === 0 ? 10000 : 0;
    const totalAmount = foodTotal + deliveryFee - discount;
    const note = notesSample[idx % notesSample.length];

    // Tính toán thời gian tạo đơn
    let createdAtExpr;
    if (plan.minutesAgo !== null) {
      createdAtExpr = `DATE_SUB(NOW(), INTERVAL ${plan.minutesAgo} MINUTE)`;
    } else {
      createdAtExpr = `DATE_SUB(DATE_SUB(NOW(), INTERVAL ${plan.daysAgo} DAY), INTERVAL ${(idx % 12) * 45} MINUTE)`;
    }

    const [ordRes] = await db.query(
      `INSERT INTO orders (user_id, restaurant_id, address_id, food_total, delivery_fee, discount, total_amount, note, status, created_at, updated_at)
       VALUES (?,?,?,?,?,?,?,?,?, ${createdAtExpr}, ${createdAtExpr})`,
      [
        customer.id,
        restaurant.id,
        addressId,
        foodTotal,
        deliveryFee,
        discount,
        totalAmount,
        note,
        plan.status,
      ]
    );

    const orderId = ordRes.insertId;
    addedOrders++;

    // Thêm order_items
    for (const f of pickedFoods) {
      await db.query(
        `INSERT INTO order_items (order_id, food_id, food_name, quantity, unit_price, subtotal, created_at, updated_at)
         VALUES (?,?,?,?,1,?, ${createdAtExpr}, ${createdAtExpr})`,
        [orderId, f.id, f.name, f.price, f.price]
      );
    }

    // Thêm payments
    const transCode = plan.paymentMethod !== 'CASH' ? `PAY-${orderId}-${Math.floor(10000 + Math.random() * 90000)}` : null;
    await db.query(
      `INSERT INTO payments (order_id, payment_method, amount, status, transaction_code, payment_date, created_at, updated_at)
       VALUES (?,?,?,?,?, ${plan.paymentStatus === 'PAID' ? createdAtExpr : 'NULL'}, ${createdAtExpr}, ${createdAtExpr})`,
      [orderId, plan.paymentMethod, totalAmount, plan.paymentStatus, transCode]
    );

    // Thêm reviews cho một số đơn DELIVERED
    if (plan.status === 'DELIVERED' && idx % 3 === 0 && addedReviews < 25) {
      const rv = sampleReviews[addedReviews % sampleReviews.length];
      await db.query(
        `INSERT INTO reviews (user_id, restaurant_id, order_id, rating, comment, created_at, updated_at)
         VALUES (?,?,?,?,?, ${createdAtExpr}, ${createdAtExpr})`,
        [customer.id, restaurant.id, orderId, rv.rating, rv.comment]
      );
      addedReviews++;
    }
  }

  const [finalOrders] = await db.query('SELECT count(*) as count FROM orders');
  const [finalPayments] = await db.query('SELECT count(*) as count FROM payments');
  const [finalReviews] = await db.query('SELECT count(*) as count FROM reviews');

  console.log(`\n🎉 HOÀN THÀNH SEED DỮ LIỆU!`);
  console.log(`  + Đã thêm mới: ${addedOrders} đơn hàng, ${addedReviews} đánh giá`);
  console.log(`  📊 Tổng số trong Database hiện tại:`);
  console.log(`     - Orders: ${finalOrders[0].count} đơn`);
  console.log(`     - Payments: ${finalPayments[0].count} giao dịch`);
  console.log(`     - Reviews: ${finalReviews[0].count} đánh giá`);

  await db.end();
}

main().catch((err) => {
  console.error('❌ Lỗi seed:', err);
  process.exit(1);
});
