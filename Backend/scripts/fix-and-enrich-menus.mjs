import 'dotenv/config'
import mysql from 'mysql2/promise'

async function run() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })

  console.log('1. Xoá các quán trùng lặp rỗng (id >= 12)...')
  await db.query('DELETE FROM restaurants WHERE id >= 12')

  console.log('2. Cập nhật ảnh chất lượng cao và trạng thái cho các quán 7 đến 11...')
  const resUpdates = [
    {
      id: 7,
      name: 'Nhà Hàng Phố Việt',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
      status: 'OPEN',
      opening_time: '08:00:00',
      closing_time: '22:00:00',
    },
    {
      id: 8,
      name: 'Cơm Nhà Hà Nội',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
      status: 'OPEN',
      opening_time: '09:00:00',
      closing_time: '21:30:00',
    },
    {
      id: 9,
      name: 'Bếp Việt Hưng Yên',
      image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80',
      status: 'OPEN',
      opening_time: '08:00:00',
      closing_time: '22:00:00',
    },
    {
      id: 10,
      name: 'Quán Ngon Phố Nhãn',
      image: 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?w=800&auto=format&fit=crop&q=80',
      status: 'OPEN',
      opening_time: '10:00:00',
      closing_time: '22:00:00',
    },
    {
      id: 11,
      name: 'Góc Ăn Vặt Hà Nội',
      image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80',
      status: 'OPEN',
      opening_time: '10:00:00',
      closing_time: '23:00:00',
    },
  ]

  for (const r of resUpdates) {
    await db.query(
      'UPDATE restaurants SET image = ?, status = ?, opening_time = ?, closing_time = ? WHERE id = ?',
      [r.image, r.status, r.opening_time, r.closing_time, r.id]
    )
  }

  console.log('3. Cập nhật ảnh đẹp cho các món hiện có (id 28-32)...')
  const foodUpdates = [
    { id: 28, name: 'Phở Bò Đặc Biệt', image: '/uploads/foods/pho-bo-dac-biet-28.jpg' },
    { id: 29, name: 'Bún Chả Hà Nội Nướng Than', image: '/uploads/foods/bun-cha-ha-noi-29.jpg' },
    { id: 30, name: 'Cơm Gà Chiên Mắm Giòn', image: '/uploads/foods/com-ga-chien-mam-30.jpg' },
    { id: 31, name: 'Bánh Đa Cua Nồi Đất', image: '/uploads/foods/banh-da-cua-noi-dat-31.jpg' },
    { id: 32, name: 'Khoai Tây Chiên Bơ Tỏi', image: '/uploads/foods/khoai-tay-chien-bo-toi-32.jpg' },
  ]
  for (const f of foodUpdates) {
    await db.query('UPDATE foods SET name = ?, image = ? WHERE id = ?', [f.name, f.image, f.id])
  }

  console.log('4. Bổ sung các danh mục và món ăn mới hấp dẫn cho quán 7 đến 11...')

  const NEW_MENUS = [
    {
      restaurant_id: 7, // Nhà Hàng Phố Việt
      categories: [
        {
          name: 'Ăn Kèm & Đồ Uống',
          description: 'Món gọi thêm ngon miệng',
          foods: [
            {
              name: 'Phở Cuốn Bò Tươi',
              description: 'Bánh phở tươi cuộn thịt bò xào lăn, rau thơm, chấm mắm tỏi ớt.',
              price: 45000,
              image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
            },
            {
              name: 'Nem Rán Hà Nội Giòn Rụm',
              description: 'Đĩa 4 chiếc nem rán nhân thịt nấm mộc nhĩ giòn rụm.',
              price: 40000,
              image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800&auto=format&fit=crop&q=80',
            },
            {
              name: 'Trà Sen Vàng Long Nhãn',
              description: 'Trà lài ủ lạnh hạt sen bùi béo kết hợp thạch long nhãn.',
              price: 25000,
              image: 'https://images.unsplash.com/photo-1558857563-b37cf5a5b515?w=800&auto=format&fit=crop&q=80',
            },
          ],
        },
      ],
    },
    {
      restaurant_id: 8, // Cơm Nhà Hà Nội
      categories: [
        {
          name: 'Món Mặn Gia Đình',
          description: 'Đậm đà hương vị cơm mẹ nấu',
          foods: [
            {
              name: 'Sườn Xào Chua Ngọt',
              description: 'Sườn heo non mềm sụn, sốt cà chua dứa chua ngọt bắt cơm.',
              price: 65000,
              image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
            },
            {
              name: 'Thịt Kho Tàu Nước Dừa',
              description: 'Thịt ba chỉ kho mềm rục cùng trứng vịt bùi ngậy.',
              price: 55000,
              image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80',
            },
          ],
        },
        {
          name: 'Canh & Rau Xào',
          description: 'Món thanh nhiệt mát lành',
          foods: [
            {
              name: 'Canh Cua Mồng Tơi Cà Pháo',
              description: 'Canh riêu cua đồng thơm ngọt ăn cùng đĩa cà pháo giòn tan.',
              price: 30000,
              image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&auto=format&fit=crop&q=80',
            },
            {
              name: 'Rau Muống Xào Tỏi Giòn',
              description: 'Rau muống non xanh mướt xào tỏi đập dập thơm lừng.',
              price: 25000,
              image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
            },
          ],
        },
      ],
    },
    {
      restaurant_id: 9, // Bếp Việt Hưng Yên
      categories: [
        {
          name: 'Món Ngon Phố Hiến',
          description: 'Đặc sản trứ danh Hưng Yên',
          foods: [
            {
              name: 'Bún Thang Phố Hiến',
              description: 'Bát bún thang thanh tao với gà xé, trứng tráng mỏng, giò lụa.',
              price: 55000,
              image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&auto=format&fit=crop&q=80',
            },
            {
              name: 'Cá Kho Tương Bần Niêu Đất',
              description: 'Cá trắm kho nhừ xương với tương Bần thơm nức mũi.',
              price: 65000,
              image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&auto=format&fit=crop&q=80',
            },
            {
              name: 'Chè Sen Long Nhãn',
              description: 'Hạt sen bùi nấu cùng cùi nhãn lồng giòn ngọt thanh tao.',
              price: 30000,
              image: 'https://images.unsplash.com/photo-1558857563-b37cf5a5b515?w=800&auto=format&fit=crop&q=80',
            },
          ],
        },
      ],
    },
    {
      restaurant_id: 10, // Quán Ngon Phố Nhãn
      categories: [
        {
          name: 'Cơm & Món Ăn Nhanh',
          description: 'Phục vụ nhanh gọn, ngon miệng',
          foods: [
            {
              name: 'Cơm Đùi Gà Nướng Mật Ong',
              description: 'Đùi gà góc tư nướng sốt mật ong rừng vàng ươm óng ả.',
              price: 50000,
              image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
            },
            {
              name: 'Cơm Bò Xào Cần Tỏi',
              description: 'Thịt bò phi lê xào nhanh lửa lớn cùng cần tây hành tây giòn ngọt.',
              price: 55000,
              image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
            },
            {
              name: 'Nem Chua Rán Phố Cổ',
              description: 'Đĩa 6 chiếc nem chua rán lăn bột xù giòn bùi ngậy.',
              price: 35000,
              image: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800&auto=format&fit=crop&q=80',
            },
          ],
        },
      ],
    },
    {
      restaurant_id: 11, // Góc Ăn Vặt Hà Nội
      categories: [
        {
          name: 'Món Ăn Vặt Giới Trẻ',
          description: 'Các món hot hit thơm ngon',
          foods: [
            {
              name: 'Bánh Tráng Nướng Trứng Xúc Xích',
              description: 'Bánh tráng nướng giòn rụm với trứng cút, xúc xích, hành phi, phô mai.',
              price: 25000,
              image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
            },
            {
              name: 'Nem Nướng Nha Trang Cuốn',
              description: 'Phần nem nướng thơm phức ăn kèm ram giòn và nước chấm sệt.',
              price: 45000,
              image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80',
            },
            {
              name: 'Chân Gà Rút Xương Sả Tắc',
              description: 'Chân gà rút xương giòn sần sật ngâm chua ngọt sả tắc ớt hiểm.',
              price: 55000,
              image: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=80',
            },
            {
              name: 'Khoai Lang Kén Chiên Giòn',
              description: 'Đĩa khoai lang kén vàng ươm thơm bùi nước cốt dừa.',
              price: 25000,
              image: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
            },
          ],
        },
        {
          name: 'Trà & Giải Khát Phố Cổ',
          description: 'Đồ uống thơm mát mùa hè',
          foods: [
            {
              name: 'Trà Chanh Giã Tay Quảng Đông',
              description: 'Chanh thơm giã tay kết hợp trà lài đậm vị chua ngọt sảng khoái.',
              price: 20000,
              image: 'https://images.unsplash.com/photo-1558857563-b37cf5a5b515?w=800&auto=format&fit=crop&q=80',
            },
            {
              name: 'Trà Đào Cam Sả Tươi',
              description: 'Trà đào thơm nức miếng đào giòn sần sật pha cùng cam vàng và sả.',
              price: 28000,
              image: 'https://images.unsplash.com/photo-1558857563-b37cf5a5b515?w=800&auto=format&fit=crop&q=80',
            },
          ],
        },
      ],
    },
  ]

  for (const m of NEW_MENUS) {
    for (const c of m.categories) {
      // Kiểm tra xem category đã tồn tại chưa để tránh trùng lặp
      const [existing] = await db.query(
        'SELECT id FROM categories WHERE restaurant_id = ? AND name = ?',
        [m.restaurant_id, c.name]
      )
      let categoryId
      if (existing.length > 0) {
        categoryId = existing[0].id
      } else {
        const [resCat] = await db.query(
          'INSERT INTO categories (restaurant_id, name, description) VALUES (?, ?, ?)',
          [m.restaurant_id, c.name, c.description]
        )
        categoryId = resCat.insertId
      }

      for (const f of c.foods) {
        const [exFood] = await db.query(
          'SELECT id FROM foods WHERE category_id = ? AND name = ?',
          [categoryId, f.name]
        )
        if (exFood.length === 0) {
          await db.query(
            'INSERT INTO foods (category_id, name, description, price, image, status) VALUES (?, ?, ?, ?, ?, "AVAILABLE")',
            [categoryId, f.name, f.description, f.price, f.image]
          )
        }
      }
    }
  }

  console.log('✅ Hoàn tất cập nhật thực đơn đầy đủ ảnh cho tất cả quán!')
  await db.end()
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
