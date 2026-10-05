import 'dotenv/config'
import mysql from 'mysql2/promise'

const c = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: +process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

console.log('Connected to MySQL database.')

// Helper to get or create category
async function getOrCreateCategory(restaurantId, name, description) {
  const [existing] = await c.query(
    'SELECT id FROM categories WHERE restaurant_id = ? AND name = ?',
    [restaurantId, name]
  )
  if (existing.length > 0) {
    return existing[0].id
  }
  const [res] = await c.query(
    'INSERT INTO categories (restaurant_id, name, description, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())',
    [restaurantId, name, description]
  )
  return res.insertId
}

// Helper to add food if not existing
async function addFood(categoryId, name, description, price, image, status = 'AVAILABLE') {
  const [existing] = await c.query(
    'SELECT id FROM foods WHERE category_id = ? AND name = ?',
    [categoryId, name]
  )
  if (existing.length > 0) {
    await c.query(
      'UPDATE foods SET description = ?, price = ?, image = ?, status = ?, updated_at = NOW() WHERE id = ?',
      [description, price, image, status, existing[0].id]
    )
    return existing[0].id
  }
  const [res] = await c.query(
    'INSERT INTO foods (category_id, name, description, price, image, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())',
    [categoryId, name, description, price, image, status]
  )
  return res.insertId
}

// 1. Góc Ăn Vặt Hà Nội (ID: 11)
console.log('Enriching Restaurant 11 (Góc Ăn Vặt Hà Nội)...')
const cat11_1 = await getOrCreateCategory(11, 'Món Ăn Vặt Giới Trẻ', 'Các món hot hit thơm ngon')
await addFood(cat11_1, 'Bánh Tráng Nướng Trứng Xúc Xích', 'Bánh tráng nướng giòn rụm với trứng cút, xúc xích, hành phi, phô mai.', 25000, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80')
await addFood(cat11_1, 'Nem Nướng Nha Trang Cuốn', 'Phần nem nướng thơm phức ăn kèm ram giòn và nước chấm sệt.', 45000, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80')
await addFood(cat11_1, 'Chân Gà Rút Xương Sả Tắc', 'Chân gà rút xương giòn sần sật ngâm chua ngọt sả tắc ớt hiểm.', 55000, 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=80')
await addFood(cat11_1, 'Khoai Lang Kén Chiên Giòn', 'Đĩa khoai lang kén vàng ươm thơm bùi nước cốt dừa.', 25000, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80')
await addFood(cat11_1, 'Tokbokki Phô Mai Cay Kéo Sợi', 'Bánh gạo dẻo sốt tương ớt Hàn Quốc cay nồng ngập phô mai mozzarella.', 42000, 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&auto=format&fit=crop&q=80')

const cat11_2 = await getOrCreateCategory(11, 'Xiên Nướng & Chiên Giòn', 'Các xiên que ăn liền thơm lừng giòn rụm')
await addFood(cat11_2, 'Cá Viên Chiên Nước Mắm Sốt Tỏi', 'Cá viên chiên phồng xóc nước mắm thơm bơ tỏi ớt cay ngọt.', 35000, 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80')
await addFood(cat11_2, 'Nem Chua Rán Phố Cổ Hà Nội', 'Nem chua rán bọc bột xù ngoài giòn rụm trong mềm dẻo.', 35000, 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&auto=format&fit=crop&q=80')
await addFood(cat11_2, 'Hồ Lô Nướng Mật Ong Rừng', '5 viên hồ lô nướng than hoa thơm mùi mật ong và hạt tiêu.', 30000, 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800&auto=format&fit=crop&q=80')

const cat11_3 = await getOrCreateCategory(11, 'Trà & Giải Khát Phố Cổ', 'Đồ uống thơm mát mùa hè')
await addFood(cat11_3, 'Trà Chanh Giã Tay Quảng Đông', 'Chanh thơm giã tay kết hợp trà lài đậm vị chua ngọt sảng khoái.', 20000, 'https://images.unsplash.com/photo-1558857563-b37cf5a5b515?w=800&auto=format&fit=crop&q=80')
await addFood(cat11_3, 'Trà Đào Cam Sả Tươi', 'Trà đào thơm nức miếng đào giòn sần sật pha cùng cam vàng và sả.', 28000, 'https://images.unsplash.com/photo-1558857563-b37cf5a5b515?w=800&auto=format&fit=crop&q=80')
await addFood(cat11_3, 'Sữa Tươi Trân Châu Đường Đen', 'Sữa tươi thanh trùng Đà Lạt hòa quyện đường đen organic và trân châu dẻo.', 32000, 'https://images.unsplash.com/photo-1558857563-b37cf5a5b515?w=800&auto=format&fit=crop&q=80')


// 2. Quán Ngon Phố Nhãn (ID: 10)
console.log('Enriching Restaurant 10 (Quán Ngon Phố Nhãn)...')
const cat10_1 = await getOrCreateCategory(10, 'Cơm & Món Ăn Nhanh', 'Cơm suất văn phòng đầy đặn chất lượng')
await addFood(cat10_1, 'Cơm Đùi Gà Nướng Mật Ong', 'Đùi gà góc tư nướng sốt mật ong vàng óng kèm canh và rau.', 50000, 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80')
await addFood(cat10_1, 'Cơm Bò Xào Cần Tỏi', 'Thịt bò tươi xào cần tây, tỏi giòn, cơm trắng dẻo thơm.', 55000, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80')
await addFood(cat10_1, 'Cơm Sườn Xào Chua Ngọt', 'Sườn non mềm mọng sốt cà chua dứa chua ngọt đậm đà chuẩn vị.', 52000, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80')
await addFood(cat10_1, 'Cơm Rang Dưa Bò Hà Nội', 'Cơm rang hạt tơi giòn xào cùng dưa chua muối giòn và thịt bò.', 50000, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop&q=80')

const cat10_2 = await getOrCreateCategory(10, 'Đồ Ăn Bình Dân & Ăn Kèm', 'Món ăn kèm phục vụ mỗi ngày')
await addFood(cat10_2, 'Khoai Tây Chiên Bơ Tỏi', 'Khoai tây chiên giòn lắc bơ tỏi thơm lừng.', 30000, 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&auto=format&fit=crop&q=80')
await addFood(cat10_2, 'Nem Chua Rán Phố Cổ', 'Nem chua rán bọc bột xù nóng hổi ăn kèm tương ớt.', 35000, 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80')
await addFood(cat10_2, 'Bún Đậu Mẹt Thập Cẩm', 'Mẹt bún lá, đậu mơ rán giòn, chả cốm nướng than và mắm tôm gia truyền.', 55000, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80')

const cat10_3 = await getOrCreateCategory(10, 'Đồ Uống Đặc Sản Phố Hiến', 'Đồ uống hoa quả và đặc sản nhãn lồng')
await addFood(cat10_3, 'Trà Nhãn Lồng Hạt Sen Phố Hiến', 'Trà sen ướp hương kết hợp cùi nhãn lồng giòn ngọt và hạt sen bùi bùi.', 32000, 'https://images.unsplash.com/photo-1558857563-b37cf5a5b515?w=800&auto=format&fit=crop&q=80')
await addFood(cat10_3, 'Nước Mía Sầu Riêng Béo Ngậy', 'Nước mía tươi ép cùng múi sầu riêng cơm vàng béo ngậy thơm nức.', 25000, 'https://images.unsplash.com/photo-1558857563-b37cf5a5b515?w=800&auto=format&fit=crop&q=80')


// 3. Bếp Việt Hưng Yên (ID: 9)
console.log('Enriching Restaurant 9 (Bếp Việt Hưng Yên)...')
const cat9_1 = await getOrCreateCategory(9, 'Món Ngon Phố Hiến & Món Việt', 'Món Việt truyền thống đậm đà')
await addFood(cat9_1, 'Bánh Đa Cua Nồi Đất', 'Bánh đa cua đỏ truyền thống với gạch cua đồng, giò tai, rau muống chẻ.', 45000, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80')
await addFood(cat9_1, 'Bún Thang Phố Hiến', 'Bún thang đầy đủ giò lụa, trứng tráng mỏng, thịt gà xé, củ cải dầm và nấm hương.', 55000, 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&auto=format&fit=crop&q=80')
await addFood(cat9_1, 'Cá Kho Tương Bần Niêu Đất', 'Cá trắm kho tương Bần gia truyền mục xương, thịt chắc nịch đậm đà.', 65000, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80')
await addFood(cat9_1, 'Gà Đồi Hấp Lá Chanh Nửa Con', 'Gà đồi thịt dai ngọt tự nhiên hấp lá chanh ăn kèm muối tiêu chanh ớt.', 120000, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80')

const cat9_2 = await getOrCreateCategory(9, 'Cơm Niêu & Canh Gia Đình', 'Cơm ấm nóng như cơm mẹ nấu')
await addFood(cat9_2, 'Cơm Niêu Cháy Giòn Thịt Kho Tiêu', 'Niêu cơm cháy vàng rụm ăn cùng thịt ba chỉ kho tiêu đen thơm nức mũi.', 58000, 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop&q=80')
await addFood(cat9_2, 'Canh Cua Rau Đay Cà Pháo Mướp Hương', 'Bát canh riêu cua ngọt mát ăn kèm đĩa cà pháo trắng giòn tan.', 35000, 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&auto=format&fit=crop&q=80')
await addFood(cat9_2, 'Rau Bí Xào Tỏi Xém Cạnh', 'Đọt rau bí non xào tỏi đập dập thơm lừng giòn ngọt.', 30000, 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80')

const cat9_3 = await getOrCreateCategory(9, 'Tráng Miệng & Trà Quê', 'Chè truyền thống giải nhiệt mùa hè')
await addFood(cat9_3, 'Chè Sen Long Nhãn', 'Long nhãn Hưng Yên ôm hạt sen bùi ngậy trong nước đường phèn thanh mát.', 30000, 'https://images.unsplash.com/photo-1558857563-b37cf5a5b515?w=800&auto=format&fit=crop&q=80')
await addFood(cat9_3, 'Nước Vối Tươi Đá Lạnh', 'Ấm vối nếp nấu tự nhiên ngọt hậu thanh lọc cơ thể.', 12000, 'https://images.unsplash.com/photo-1558857563-b37cf5a5b515?w=800&auto=format&fit=crop&q=80')


// Also enrich Phở Bò Gia Truyền (ID 2) and KOI Thé (ID 3)
console.log('Enriching Restaurant 2 & 3...')
const cat2_1 = await getOrCreateCategory(2, 'Phở Bò', 'Nước dùng ninh xương 12 tiếng')
await addFood(cat2_1, 'Phở Bò Sốt Vang', 'Bò sốt vang thơm nồng rượu vang đỏ và quế hồi, thịt bò mềm tan.', 70000, 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&auto=format&fit=crop&q=80')
await addFood(cat2_1, 'Quẩy Giòn Phố Cổ (Đĩa 3 chiếc)', 'Quẩy nóng hổi vừa chiên vàng giòn rụm.', 10000, 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&auto=format&fit=crop&q=80')

const cat3_1 = await getOrCreateCategory(3, 'Trà Sữa Chữ Ký', 'Trà pha tươi theo công thức Đài Loan')
await addFood(cat3_1, 'Trà Sữa Trân Châu Hoàng Kim', 'Trân châu hoàng kim dai giòn tự làm, trà đen đậm vị béo ngậy.', 45000, 'https://images.unsplash.com/photo-1558857563-b37cf5a5b515?w=800&auto=format&fit=crop&q=80')
await addFood(cat3_1, 'Lục Trà Macchiato Lớp Kem Dày', 'Lục trà lài thơm thanh mát phủ lớp kem mặn macchiato béo ngậy 4cm.', 50000, 'https://images.unsplash.com/photo-1558857563-b37cf5a5b515?w=800&auto=format&fit=crop&q=80')

console.log('Finished enriching all restaurants!')
await c.end()
