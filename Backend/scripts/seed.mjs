/**
 * Seed dữ liệu mẫu cho DB DatDoAn.
 *
 * Chạy: npm run seed         (thêm dữ liệu nếu chưa có, giữ nguyên dữ liệu cũ)
 *       npm run seed -- --reset   (xoá sạch dữ liệu mẫu rồi seed lại)
 *
 * Tất cả tài khoản seed dùng mật khẩu: 123456
 */
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import mysql from 'mysql2/promise'

const RESET = process.argv.includes('--reset')
const PASSWORD = '123456'

const USERS = [
  { full_name: 'Quản Trị Viên', email: 'admin@datdoan.vn', phone_number: '0900000001', role: 'ADMIN' },
  { full_name: 'Trần Ba Ghiền', email: 'owner1@datdoan.vn', phone_number: '0900000002', role: 'RESTAURANT_OWNER' },
  { full_name: 'Lê Thị KOI', email: 'owner2@datdoan.vn', phone_number: '0900000003', role: 'RESTAURANT_OWNER' },
  { full_name: 'Phạm Văn Pizza', email: 'owner3@datdoan.vn', phone_number: '0900000004', role: 'RESTAURANT_OWNER' },
  { full_name: 'Nguyễn Văn A', email: 'customer@datdoan.vn', phone_number: '0901234567', role: 'CUSTOMER' },
  { full_name: 'Đỗ Thị Khách', email: 'customer2@datdoan.vn', phone_number: '0907654321', role: 'CUSTOMER' },
]

const ADDRESSES = [
  {
    ownerEmail: 'customer@datdoan.vn',
    receiver_name: 'Nguyễn Văn A',
    phone_number: '0901234567',
    address_detail: 'Số 45 Lê Duẩn',
    ward: 'Phường Bến Nghé',
    district: 'Quận 1',
    city: 'TP. Hồ Chí Minh',
    is_default: 1,
  },
  {
    ownerEmail: 'customer@datdoan.vn',
    receiver_name: 'Đức Anh (Công ty)',
    phone_number: '0987654321',
    address_detail: 'Landmark 81, 720A Điện Biên Phủ',
    ward: 'Phường 22',
    district: 'Bình Thạnh',
    city: 'TP. Hồ Chí Minh',
    is_default: 0,
  },
  {
    ownerEmail: 'customer2@datdoan.vn',
    receiver_name: 'Đỗ Thị Khách',
    phone_number: '0907654321',
    address_detail: '128 Cách Mạng Tháng 8',
    ward: 'Phường 5',
    district: 'Quận 3',
    city: 'TP. Hồ Chí Minh',
    is_default: 1,
  },
]

const IMG = {
  comTam: '/uploads/foods/com-tam-suon-bi-cha.jpg',
  comSuon: '/uploads/foods/com-suon-cay-mat-ong.jpg',
  comCotLet: '/uploads/foods/com-tam-suon-cot-let.jpg',
  comOpLa: '/uploads/foods/com-tam-suon-op-la.jpg',
  chaTrung: '/uploads/foods/cha-trung-hap.jpg',
  biTron: '/uploads/foods/bi-tron-thinh.jpg',
  canh: '/uploads/foods/canh-kho-qua-nhoi-thit.jpg',
  traTac: '/uploads/foods/tra-tac-hat-e.jpg',
  pho: '/uploads/foods/pho-bo-tai-nam-gau.jpg',
  phoCover: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
  traSua: '/uploads/foods/tra-sua-tran-chau-duong-den-17.jpg',
  traSuaCover: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80',
  gaRan: '/uploads/foods/ga-ran-gion-cay.jpg',
  gaRanCover: 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?w=800&auto=format&fit=crop&q=80',
  pizza: '/uploads/foods/pizza-vien-pho-mai-hai-san.jpg',
  bunBo: '/uploads/foods/bun-bo-hue-dac-biet.jpg',
}

const RESTAURANTS = [
  {
    ownerEmail: 'owner1@datdoan.vn',
    name: 'Cơm Tấm Ba Ghiền',
    description: 'Cơm tấm, ẩm thực miền Nam',
    address: '84 Nguyễn Văn Trỗi, P.8, Q. Phú Nhuận, TP. Hồ Chí Minh',
    phone_number: '02839951234',
    image: IMG.comSuon,
    opening_time: '07:00:00',
    closing_time: '21:00:00',
    status: 'OPEN',
    categories: [
      {
        name: 'Món Bán Chạy Nhất',
        description: 'Được khách gọi nhiều nhất',
        foods: [
          { name: 'Cơm Tấm Sườn Bì Chả Đặc Biệt', description: 'Sườn nướng than hoa thượng hạng, chả trứng hấp thơm bùi, bì heo giòn dai đậm vị.', price: 65000, image: IMG.comTam },
          { name: 'Cơm Sườn Cây Mật Ong', description: 'Cây sườn cọng to dày ướp nước sốt mật ong rừng, nướng than hoa thơm lừng.', price: 75000, image: IMG.comSuon },
        ],
      },
      {
        name: 'Cơm Sườn & Cốt Lết',
        description: 'Các món cơm chính',
        foods: [
          { name: 'Cơm Tấm Sườn Cốt Lết', description: 'Miếng cốt lết to che kín dĩa cơm, ướp gia vị gia truyền thơm phức.', price: 55000, image: IMG.comCotLet },
          { name: 'Cơm Tấm Sườn Trứng Ốp La', description: 'Sườn nướng mềm thơm kèm trứng gà lòng đào tan chảy béo ngậy.', price: 60000, image: IMG.comOpLa },
        ],
      },
      {
        name: 'Món Ăn Kèm & Gọi Thêm',
        description: 'Gọi thêm cho bữa ăn',
        foods: [
          { name: 'Chả Trứng Hấp Ổ', description: '1 miếng lớn', price: 12000, image: IMG.chaTrung },
          { name: 'Bì Trộn Thính Thơm', description: 'Phần ăn thêm', price: 10000, image: IMG.biTron },
          { name: 'Sườn Nướng Phần Thêm', description: 'Tạm hết hàng trong hôm nay', price: 35000, image: IMG.comSuon, status: 'OUT_OF_STOCK' },
        ],
      },
      {
        name: 'Canh & Rau Thanh Nhiệt',
        description: 'Canh nóng mỗi ngày',
        foods: [
          { name: 'Canh Khổ Qua Nhồi Thịt', description: 'Khổ qua xanh mát nhồi thịt băm, nấm mèo, nước dùng ngọt thanh.', price: 25000, image: IMG.canh },
        ],
      },
      {
        name: 'Nước Giải Khát & Trà',
        description: 'Đồ uống mát lạnh',
        foods: [
          { name: 'Trà Tắc Hạt É Chua Ngọt', description: 'Trà lài ủ lạnh pha quất tươi, hạt é giòn mát giải nhiệt.', price: 15000, image: IMG.traTac },
        ],
      },
    ],
  },
  {
    ownerEmail: 'owner1@datdoan.vn',
    name: 'Phở Bò Gia Truyền 1986',
    description: 'Phở bò, bánh quẩy',
    address: '12 Lý Quốc Sư, Hoàn Kiếm, Hà Nội',
    phone_number: '02439381986',
    image: IMG.phoCover,
    opening_time: '06:00:00',
    closing_time: '22:00:00',
    status: 'OPEN',
    categories: [
      {
        name: 'Phở Bò',
        description: 'Nước dùng ninh xương 12 tiếng',
        foods: [
          { name: 'Phở Bò Tái Nạm Gầu', description: 'Tái mềm, nạm giòn, gầu béo ngậy trong nước dùng trong veo.', price: 65000, image: IMG.pho },
          { name: 'Phở Bò Tái Lăn', description: 'Thịt bò tái xào lăn cùng hành tây thơm lừng.', price: 70000, image: IMG.pho },
          { name: 'Phở Bò Viên', description: 'Bò viên dai ngọt tự làm mỗi sáng.', price: 60000, image: IMG.pho },
        ],
      },
      {
        name: 'Ăn Thêm',
        description: 'Món gọi kèm',
        foods: [
          { name: 'Quẩy Giòn', description: 'Đĩa quẩy nóng giòn rụm.', price: 10000, image: IMG.biTron },
          { name: 'Trứng Chần', description: 'Trứng gà chần lòng đào.', price: 8000, image: IMG.chaTrung },
        ],
      },
    ],
  },
  {
    ownerEmail: 'owner2@datdoan.vn',
    name: 'Trà Sữa KOI Thé - Pasteur',
    description: 'Trà sữa Đài Loan, Macchiato',
    address: '135 Pasteur, P. Võ Thị Sáu, Quận 3, TP. Hồ Chí Minh',
    phone_number: '02838223344',
    image: IMG.traSuaCover,
    opening_time: '09:00:00',
    closing_time: '22:30:00',
    status: 'OPEN',
    categories: [
      {
        name: 'Macchiato',
        description: 'Lớp kem sữa mặn đặc trưng',
        foods: [
          { name: 'Trà Sữa KOI Macchiato', description: 'Trà đen ủ thủ công phủ lớp macchiato mặn ngọt hài hoà.', price: 45000, image: IMG.traSua },
          { name: 'Macchiato Trà Xanh', description: 'Trà xanh Nhật thanh mát, kem sữa béo nhẹ.', price: 48000, image: IMG.traSua },
        ],
      },
      {
        name: 'Trà Sữa Trân Châu',
        description: 'Trân châu nấu mới mỗi 2 tiếng',
        foods: [
          { name: 'Trà Sữa Trân Châu Đường Đen', description: 'Trân châu đường đen dai mềm, sữa tươi thanh ngọt.', price: 50000, image: IMG.traSua },
          { name: 'Hồng Trà Sữa Full Topping', description: 'Hồng trà đậm vị cùng 3 loại topping.', price: 55000, image: IMG.traSua },
        ],
      },
    ],
  },
  {
    ownerEmail: 'owner2@datdoan.vn',
    name: 'Gà Rán Popeyes - Nguyễn Trãi',
    description: 'Gà rán Cajun, Burger',
    address: '215 Nguyễn Trãi, Quận 1, TP. Hồ Chí Minh',
    phone_number: '02838887777',
    image: IMG.gaRanCover,
    opening_time: '09:30:00',
    closing_time: '22:00:00',
    status: 'OPEN',
    categories: [
      {
        name: 'Gà Rán',
        description: 'Cajun giòn cay',
        foods: [
          { name: 'Gà Rán Giòn Cay Giòn Rụm', description: 'Miếng gà tẩm bột Cajun cay nồng, chiên giòn rụm.', price: 49000, image: IMG.gaRan },
          { name: 'Combo 3 Miếng Gà + Khoai', description: '3 miếng gà rán kèm khoai tây chiên và nước ngọt.', price: 129000, image: IMG.gaRan },
        ],
      },
      {
        name: 'Burger & Cơm',
        description: 'Món chính khác',
        foods: [
          { name: 'Burger Gà Cajun', description: 'Burger phi lê gà Cajun, sốt mayonnaise đặc biệt.', price: 59000, image: '/uploads/foods/burger-ga-cajun.jpg' },
          { name: 'Cơm Gà Rán Sốt Cay', description: 'Cơm trắng ăn cùng gà rán sốt cay Hàn Quốc.', price: 65000, image: '/uploads/foods/com-ga-ran-sot-cay.jpg' },
        ],
      },
    ],
  },
  {
    ownerEmail: 'owner3@datdoan.vn',
    name: 'Pizza Hut - Trần Hưng Đạo',
    description: 'Pizza viền phô mai, Mì Ý',
    address: '301 Trần Hưng Đạo, Quận 5, TP. Hồ Chí Minh',
    phone_number: '02839996666',
    image: IMG.pizza,
    opening_time: '10:00:00',
    closing_time: '22:00:00',
    status: 'CLOSED',
    categories: [
      {
        name: 'Pizza',
        description: 'Đế giòn / đế dày',
        foods: [
          { name: 'Pizza Viền Phô Mai Hải Sản', description: 'Viền phô mai tan chảy, topping hải sản tươi.', price: 199000, image: IMG.pizza },
          { name: 'Pizza Bò Bít Tết', description: 'Thịt bò bít tết áp chảo cùng sốt tiêu đen.', price: 219000, image: '/uploads/foods/pizza-bo-bit-tet.jpg' },
        ],
      },
    ],
  },
  {
    ownerEmail: 'owner3@datdoan.vn',
    name: 'Bún Bò Huế Cô Ba',
    description: 'Bún bò Huế, ẩm thực miền Trung',
    address: '56 Nguyễn Thị Minh Khai, Quận 1, TP. Hồ Chí Minh',
    phone_number: '02838224455',
    image: IMG.bunBo,
    opening_time: '06:30:00',
    closing_time: '20:00:00',
    status: 'OPEN',
    categories: [
      {
        name: 'Bún Bò',
        description: 'Nước dùng đậm vị Huế',
        foods: [
          { name: 'Bún Bò Huế Đặc Biệt', description: 'Đầy đủ giò heo, chả cua, bò gân trong nước dùng sả ớt.', price: 60000, image: IMG.bunBo },
          { name: 'Bún Bò Giò Heo', description: 'Khoanh giò heo mềm béo, nước dùng cay nhẹ.', price: 55000, image: IMG.bunBo },
        ],
      },
      {
        name: 'Ăn Thêm',
        description: 'Gọi kèm',
        foods: [
          { name: 'Chả Cua Huế', description: 'Chả cua tươi hấp thủ công.', price: 20000, image: IMG.chaTrung },
        ],
      },
    ],
  },
]

/** Đơn hàng DELIVERED + review để nhà hàng có sẵn điểm đánh giá */
const SEED_REVIEWS = [
  { restaurant: 'Cơm Tấm Ba Ghiền', customerEmail: 'customer@datdoan.vn', rating: 5, comment: 'Sườn nướng thơm, cơm nóng, giao nhanh!' },
  { restaurant: 'Cơm Tấm Ba Ghiền', customerEmail: 'customer2@datdoan.vn', rating: 4, comment: 'Ngon nhưng hơi ít nước mắm.' },
  { restaurant: 'Phở Bò Gia Truyền 1986', customerEmail: 'customer@datdoan.vn', rating: 5, comment: 'Nước dùng ngọt xương, đúng vị Hà Nội.' },
  { restaurant: 'Trà Sữa KOI Thé - Pasteur', customerEmail: 'customer@datdoan.vn', rating: 4, comment: 'Macchiato ngon, trân châu dai.' },
  { restaurant: 'Gà Rán Popeyes - Nguyễn Trãi', customerEmail: 'customer2@datdoan.vn', rating: 4, comment: 'Gà giòn, giao còn nóng.' },
  { restaurant: 'Bún Bò Huế Cô Ba', customerEmail: 'customer@datdoan.vn', rating: 5, comment: 'Đậm vị Huế, giò heo mềm.' },
]

async function main() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: false,
  })

  if (RESET) {
    console.log('⚠️  --reset: xoá toàn bộ dữ liệu giao dịch & thực đơn...')
    await db.query('SET FOREIGN_KEY_CHECKS = 0')
    for (const t of ['reviews', 'payments', 'order_items', 'orders', 'cart_items', 'carts', 'foods', 'categories', 'restaurants', 'addresses']) {
      await db.query(`DELETE FROM \`${t}\``)
      await db.query(`ALTER TABLE \`${t}\` AUTO_INCREMENT = 1`)
    }
    await db.query('DELETE FROM users WHERE email LIKE ?', ['%@datdoan.vn'])
    await db.query('SET FOREIGN_KEY_CHECKS = 1')
  }

  const hashed = await bcrypt.hash(PASSWORD, 10)

  // ── 1. USERS ───────────────────────────────────────────────────────────────
  const userIdByEmail = {}
  for (const u of USERS) {
    const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [u.email])
    if (rows.length) {
      userIdByEmail[u.email] = rows[0].id
      continue
    }
    const [res] = await db.query(
      'INSERT INTO users (full_name, email, phone_number, password, role, status) VALUES (?,?,?,?,?,1)',
      [u.full_name, u.email, u.phone_number, hashed, u.role]
    )
    userIdByEmail[u.email] = res.insertId
  }
  console.log(`✅ users: ${Object.keys(userIdByEmail).length} tài khoản (mật khẩu: ${PASSWORD})`)

  // ── 2. ADDRESSES ───────────────────────────────────────────────────────────
  const addressIdByUser = {}
  for (const a of ADDRESSES) {
    const userId = userIdByEmail[a.ownerEmail]
    const [rows] = await db.query(
      'SELECT id FROM addresses WHERE user_id = ? AND address_detail = ?',
      [userId, a.address_detail]
    )
    let id
    if (rows.length) {
      id = rows[0].id
    } else {
      const [res] = await db.query(
        `INSERT INTO addresses (user_id, receiver_name, phone_number, address_detail, ward, district, city, is_default)
         VALUES (?,?,?,?,?,?,?,?)`,
        [userId, a.receiver_name, a.phone_number, a.address_detail, a.ward, a.district, a.city, a.is_default]
      )
      id = res.insertId
    }
    if (!addressIdByUser[a.ownerEmail] || a.is_default) addressIdByUser[a.ownerEmail] = id
  }
  console.log(`✅ addresses: ${ADDRESSES.length} địa chỉ`)

  // ── 3. RESTAURANTS + CATEGORIES + FOODS ────────────────────────────────────
  const restaurantIdByName = {}
  const foodIdByRestaurant = {}
  let categoryCount = 0
  let foodCount = 0

  for (const r of RESTAURANTS) {
    const ownerId = userIdByEmail[r.ownerEmail]
    const [existing] = await db.query('SELECT id FROM restaurants WHERE name = ?', [r.name])
    let restaurantId
    if (existing.length) {
      restaurantId = existing[0].id
    } else {
      const [res] = await db.query(
        `INSERT INTO restaurants (owner_id, name, description, address, phone_number, image, opening_time, closing_time, status)
         VALUES (?,?,?,?,?,?,?,?,?)`,
        [ownerId, r.name, r.description, r.address, r.phone_number, r.image, r.opening_time, r.closing_time, r.status]
      )
      restaurantId = res.insertId
    }
    restaurantIdByName[r.name] = restaurantId
    foodIdByRestaurant[r.name] = []

    for (const c of r.categories) {
      const [exCat] = await db.query(
        'SELECT id FROM categories WHERE restaurant_id = ? AND name = ?',
        [restaurantId, c.name]
      )
      let categoryId
      if (exCat.length) {
        categoryId = exCat[0].id
      } else {
        const [res] = await db.query(
          'INSERT INTO categories (restaurant_id, name, description) VALUES (?,?,?)',
          [restaurantId, c.name, c.description || null]
        )
        categoryId = res.insertId
        categoryCount++
      }

      for (const f of c.foods) {
        const [exFood] = await db.query(
          'SELECT id FROM foods WHERE category_id = ? AND name = ?',
          [categoryId, f.name]
        )
        let foodId
        if (exFood.length) {
          foodId = exFood[0].id
        } else {
          const [res] = await db.query(
            'INSERT INTO foods (category_id, name, description, price, image, status) VALUES (?,?,?,?,?,?)',
            [categoryId, f.name, f.description, f.price, f.image, f.status || 'AVAILABLE']
          )
          foodId = res.insertId
          foodCount++
        }
        if ((f.status || 'AVAILABLE') === 'AVAILABLE') {
          foodIdByRestaurant[r.name].push({ id: foodId, name: f.name, price: f.price })
        }
      }
    }
  }
  console.log(`✅ restaurants: ${Object.keys(restaurantIdByName).length} quán, ${categoryCount} danh mục mới, ${foodCount} món mới`)

  // ── 4. ĐƠN HÀNG DELIVERED + REVIEW (để có điểm đánh giá) ───────────────────
  let orderCount = 0
  let reviewCount = 0

  for (const rv of SEED_REVIEWS) {
    const userId = userIdByEmail[rv.customerEmail]
    const restaurantId = restaurantIdByName[rv.restaurant]
    const addressId = addressIdByUser[rv.customerEmail]
    const foods = foodIdByRestaurant[rv.restaurant]
    if (!userId || !restaurantId || !addressId || !foods?.length) continue

    // Đã có review của user này cho quán này → bỏ qua
    const [exRv] = await db.query(
      'SELECT id FROM reviews WHERE user_id = ? AND restaurant_id = ?',
      [userId, restaurantId]
    )
    if (exRv.length) continue

    const picked = foods.slice(0, 2)
    const food_total = picked.reduce((s, f) => s + f.price, 0)
    const delivery_fee = 15000
    const total_amount = food_total + delivery_fee

    const [ordRes] = await db.query(
      `INSERT INTO orders (user_id, restaurant_id, address_id, food_total, delivery_fee, discount, total_amount, note, status, created_at)
       VALUES (?,?,?,?,?,0,?,?, 'DELIVERED', DATE_SUB(NOW(), INTERVAL ? DAY))`,
      [userId, restaurantId, addressId, food_total, delivery_fee, total_amount, 'Đơn mẫu đã giao', orderCount + 1]
    )
    const orderId = ordRes.insertId
    orderCount++

    for (const f of picked) {
      await db.query(
        'INSERT INTO order_items (order_id, food_id, food_name, quantity, unit_price, subtotal) VALUES (?,?,?,?,?,?)',
        [orderId, f.id, f.name, 1, f.price, f.price]
      )
    }

    await db.query(
      `INSERT INTO payments (order_id, payment_method, amount, status, payment_date)
       VALUES (?, 'CASH', ?, 'PAID', NOW())`,
      [orderId, total_amount]
    )

    await db.query(
      'INSERT INTO reviews (user_id, restaurant_id, order_id, rating, comment) VALUES (?,?,?,?,?)',
      [userId, restaurantId, orderId, rv.rating, rv.comment]
    )
    reviewCount++
  }
  console.log(`✅ orders: ${orderCount} đơn DELIVERED mẫu, reviews: ${reviewCount} đánh giá`)

  // ── Tổng kết ───────────────────────────────────────────────────────────────
  console.log('\n──── TÀI KHOẢN ĐỂ ĐĂNG NHẬP (mật khẩu: 123456) ────')
  for (const u of USERS) console.log(`  ${u.role.padEnd(17)} ${u.email}`)
  console.log('───────────────────────────────────────────────────\n')

  await db.end()
}

main().catch((err) => {
  console.error('❌ Seed thất bại:', err.message)
  process.exit(1)
})
