DROP DATABASE IF EXISTS DatDoAn;

CREATE DATABASE DatDoAn
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE DatDoAn;


-- =====================================================
-- 1. USERS
-- =====================================================

-- =====================================================================
-- 1. USERS — 5 dòng (2 khách, 2 chủ quán, 1 admin)
-- =====================================================================
INSERT INTO users (full_name, email, phone_number, password, role, status) VALUES
('Nguyễn Văn An',   'nguyenvanan@gmail.com', '0901000001', '$2b$10$sjGY6zwdmbHaWB3RGjTlrO1Rr0pImJJzUkoOiI9pPPMoai5hKmIZO', 'CUSTOMER',         TRUE),
('Trần Thị Lan',    'tranthilan@gmail.com',  '0901000002', '$2b$10$sjGY6zwdmbHaWB3RGjTlrO1Rr0pImJJzUkoOiI9pPPMoai5hKmIZO', 'CUSTOMER',         TRUE),
('Lê Minh Tuấn',    'leminhtuan@gmail.com',  '0901000003', '$2b$10$sjGY6zwdmbHaWB3RGjTlrO1Rr0pImJJzUkoOiI9pPPMoai5hKmIZO', 'RESTAURANT_OWNER', TRUE),
('Phạm Văn Hùng',   'phamvanhung@gmail.com', '0901000004', '$2b$10$sjGY6zwdmbHaWB3RGjTlrO1Rr0pImJJzUkoOiI9pPPMoai5hKmIZO', 'RESTAURANT_OWNER', TRUE),
('Admin Hệ Thống',  'quantri@datdoan.vn',    '0901000005', '$2b$10$sjGY6zwdmbHaWB3RGjTlrO1Rr0pImJJzUkoOiI9pPPMoai5hKmIZO', 'ADMIN',            TRUE);


-- =====================================================================
-- 2. ADDRESSES — 5 dòng (An: 3 địa chỉ, Lan: 2 địa chỉ)
--    Mỗi user chỉ có đúng 1 địa chỉ is_default = TRUE
-- =====================================================================
INSERT INTO addresses
(user_id, receiver_name, phone_number, address_detail, ward, district, city, is_default) VALUES
((SELECT id FROM users WHERE email = 'nguyenvanan@gmail.com'),
 'Nguyễn Văn An', '0901000001', 'Số 25 đường Nguyễn Trãi',
 'Thanh Xuân Trung', 'Thanh Xuân', 'Hà Nội', TRUE),

((SELECT id FROM users WHERE email = 'nguyenvanan@gmail.com'),
 'Nguyễn Văn An', '0901000001', 'Số 18 đường Lê Lợi',
 'Lê Lợi', 'Thành phố Hưng Yên', 'Hưng Yên', FALSE),

((SELECT id FROM users WHERE email = 'nguyenvanan@gmail.com'),
 'Nguyễn Văn An', '0901000001', 'Số 50 đường Trần Phú',
 'Lam Sơn', 'Thành phố Hưng Yên', 'Hưng Yên', FALSE),

((SELECT id FROM users WHERE email = 'tranthilan@gmail.com'),
 'Trần Thị Lan', '0901000002', 'Số 36 đường Cầu Giấy',
 'Dịch Vọng', 'Cầu Giấy', 'Hà Nội', TRUE),

((SELECT id FROM users WHERE email = 'tranthilan@gmail.com'),
 'Trần Thị Lan', '0901000002', 'Số 12 đường Nguyễn Thiện Thuật',
 'Lê Lợi', 'Thành phố Hưng Yên', 'Hưng Yên', FALSE);


-- =====================================================================
-- 3. RESTAURANTS — 5 dòng (4 quán OPEN + 1 quán CLOSED)
--    image dùng URL đầy đủ nên ảnh tải trực tiếp từ internet,
--    KHÔNG cần thư mục Backend/uploads/
-- =====================================================================
INSERT INTO restaurants
(owner_id, name, description, address, phone_number, image, opening_time, closing_time, status) VALUES
((SELECT id FROM users WHERE email = 'leminhtuan@gmail.com'),
 'Nhà Hàng Phố Việt', 'Phở bò, bún chả và các món ăn Việt Nam',
 '25 Nguyễn Trãi, Thanh Xuân, Hà Nội', '0912000001',
 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
 '08:00:00', '22:00:00', 'OPEN'),

((SELECT id FROM users WHERE email = 'leminhtuan@gmail.com'),
 'Cơm Nhà Hà Nội', 'Các món cơm gia đình truyền thống',
 '36 Cầu Giấy, Dịch Vọng, Cầu Giấy, Hà Nội', '0912000002',
 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
 '09:00:00', '21:30:00', 'OPEN'),

((SELECT id FROM users WHERE email = 'phamvanhung@gmail.com'),
 'Bếp Việt Hưng Yên', 'Nhà hàng phục vụ món Việt và món gia đình',
 '18 Lê Lợi, Lê Lợi, TP Hưng Yên, Hưng Yên', '0912000003',
 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80',
 '08:00:00', '22:00:00', 'OPEN'),

((SELECT id FROM users WHERE email = 'phamvanhung@gmail.com'),
 'Quán Ngon Phố Nhãn', 'Các món ăn bình dân và đồ uống',
 '50 Trần Phú, Lam Sơn, TP Hưng Yên, Hưng Yên', '0912000004',
 'https://images.unsplash.com/photo-1513639776629-7b61b0ac49cb?w=800&auto=format&fit=crop&q=80',
 '10:00:00', '22:00:00', 'OPEN'),

-- Quán này CLOSED: dùng để kiểm tra API /restaurants/active và /search
-- chỉ trả về quán đang mở (app sẽ hiện 4 quán, không hiện quán này)
((SELECT id FROM users WHERE email = 'leminhtuan@gmail.com'),
 'Góc Ăn Vặt Hà Nội', 'Đồ ăn nhanh, ăn vặt và đồ uống',
 '72 Hồ Tùng Mậu, Mai Dịch, Cầu Giấy, Hà Nội', '0912000005',
 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=800&auto=format&fit=crop&q=80',
 '10:00:00', '23:00:00', 'CLOSED');


-- =====================================================================
-- 4. CATEGORIES — 5 dòng (mỗi quán 1 danh mục)
-- =====================================================================
INSERT INTO categories (restaurant_id, name, description) VALUES
((SELECT id FROM restaurants WHERE name = 'Nhà Hàng Phố Việt'),  'Món chính',        'Các món ăn chính'),
((SELECT id FROM restaurants WHERE name = 'Cơm Nhà Hà Nội'),     'Cơm gia đình',     'Các món cơm truyền thống'),
((SELECT id FROM restaurants WHERE name = 'Bếp Việt Hưng Yên'),  'Món Việt',         'Các món ăn Việt Nam'),
((SELECT id FROM restaurants WHERE name = 'Quán Ngon Phố Nhãn'), 'Đồ ăn bình dân',   'Các món ăn phục vụ hàng ngày'),
((SELECT id FROM restaurants WHERE name = 'Góc Ăn Vặt Hà Nội'),  'Đồ ăn vặt',        'Các món ăn nhanh và ăn vặt');


-- =====================================================================
-- 5. FOODS — 5 dòng
--    Quán "Nhà Hàng Phố Việt" có 2 món để test được giỏ hàng nhiều món
--    cùng một quán (tính food_total nhiều dòng, sửa số lượng từng món).
-- =====================================================================
INSERT INTO foods (category_id, name, description, price, image, status) VALUES
((SELECT c.id FROM categories c JOIN restaurants r ON r.id = c.restaurant_id
  WHERE r.name = 'Nhà Hàng Phố Việt' AND c.name = 'Món chính'),
 'Phở bò đặc biệt', 'Phở bò truyền thống với thịt bò và nước dùng đậm đà',
 55000, 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&auto=format&fit=crop&q=80', 'AVAILABLE'),

((SELECT c.id FROM categories c JOIN restaurants r ON r.id = c.restaurant_id
  WHERE r.name = 'Nhà Hàng Phố Việt' AND c.name = 'Món chính'),
 'Bún chả Hà Nội', 'Bún chả với thịt nướng than hoa và nước chấm chua ngọt',
 50000, 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80', 'AVAILABLE'),

((SELECT c.id FROM categories c JOIN restaurants r ON r.id = c.restaurant_id
  WHERE r.name = 'Cơm Nhà Hà Nội' AND c.name = 'Cơm gia đình'),
 'Cơm gà chiên mắm', 'Cơm trắng ăn kèm gà chiên nước mắm',
 60000, 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&auto=format&fit=crop&q=80', 'AVAILABLE'),

((SELECT c.id FROM categories c JOIN restaurants r ON r.id = c.restaurant_id
  WHERE r.name = 'Bếp Việt Hưng Yên' AND c.name = 'Món Việt'),
 'Bánh đa cua', 'Bánh đa cua truyền thống, nước dùng gạch cua',
 45000, 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&auto=format&fit=crop&q=80', 'AVAILABLE'),

((SELECT c.id FROM categories c JOIN restaurants r ON r.id = c.restaurant_id
  WHERE r.name = 'Quán Ngon Phố Nhãn' AND c.name = 'Đồ ăn bình dân'),
 'Khoai tây chiên', 'Khoai tây chiên giòn, ăn kèm sốt',
 30000, 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=80', 'AVAILABLE');


-- =====================================================================
-- 6. CARTS — 5 dòng (1 giỏ / 1 user, cột user_id là UNIQUE)
-- =====================================================================
INSERT INTO carts (user_id) VALUES
((SELECT id FROM users WHERE email = 'nguyenvanan@gmail.com')),
((SELECT id FROM users WHERE email = 'tranthilan@gmail.com')),
((SELECT id FROM users WHERE email = 'leminhtuan@gmail.com')),
((SELECT id FROM users WHERE email = 'phamvanhung@gmail.com')),
((SELECT id FROM users WHERE email = 'quantri@datdoan.vn'));


-- =====================================================================
-- 7. CART_ITEMS — 5 dòng
--    Giỏ của An có 2 món CÙNG quán "Nhà Hàng Phố Việt" (đúng nghiệp vụ
--    1 giỏ = 1 nhà hàng). 2 dòng cuối chỉ để đủ 5 dòng theo yêu cầu.
-- =====================================================================
INSERT INTO cart_items (cart_id, food_id, quantity, note) VALUES
((SELECT k.id FROM carts k JOIN users u ON u.id = k.user_id WHERE u.email = 'nguyenvanan@gmail.com'),
 (SELECT id FROM foods WHERE name = 'Phở bò đặc biệt'),  2, 'Ít hành'),

((SELECT k.id FROM carts k JOIN users u ON u.id = k.user_id WHERE u.email = 'nguyenvanan@gmail.com'),
 (SELECT id FROM foods WHERE name = 'Bún chả Hà Nội'),   1, 'Thêm rau sống'),

((SELECT k.id FROM carts k JOIN users u ON u.id = k.user_id WHERE u.email = 'tranthilan@gmail.com'),
 (SELECT id FROM foods WHERE name = 'Cơm gà chiên mắm'), 1, 'Không cay'),

((SELECT k.id FROM carts k JOIN users u ON u.id = k.user_id WHERE u.email = 'leminhtuan@gmail.com'),
 (SELECT id FROM foods WHERE name = 'Bánh đa cua'),      1, NULL),

((SELECT k.id FROM carts k JOIN users u ON u.id = k.user_id WHERE u.email = 'phamvanhung@gmail.com'),
 (SELECT id FROM foods WHERE name = 'Khoai tây chiên'),  2, 'Chiên giòn');


-- =====================================================================
-- 8. ORDERS — 5 dòng, MỖI TRẠNG THÁI MỘT KIỂU để test đủ nghiệp vụ:
--      PENDING    → test nút "Huỷ đơn" (chỉ huỷ được khi PENDING)
--      DELIVERING → test tab "Đang xử lý"
--      DELIVERED  → 2 đơn: 1 đơn đã đánh giá, 1 đơn CHƯA đánh giá
--      CANCELLED  → test tab "Đã hủy" + payment REFUNDED
--    total_amount = food_total + delivery_fee(15.000) - discount(0)
--    Cột note được dùng làm khoá tra cứu cho 3 bảng bên dưới.
-- =====================================================================
INSERT INTO orders
(user_id, restaurant_id, address_id, food_total, delivery_fee, discount, total_amount, note, status, created_at) VALUES
-- Đơn 1: PENDING — 2 x Cơm gà chiên mắm (60.000)
((SELECT id FROM users WHERE email = 'nguyenvanan@gmail.com'),
 (SELECT id FROM restaurants WHERE name = 'Cơm Nhà Hà Nội'),
 (SELECT id FROM addresses WHERE address_detail = 'Số 25 đường Nguyễn Trãi'),
 120000, 15000, 0, 135000, 'Giao giờ nghỉ trưa', 'PENDING', NOW()),

-- Đơn 2: DELIVERING — 2 x Khoai tây chiên (30.000)
((SELECT id FROM users WHERE email = 'tranthilan@gmail.com'),
 (SELECT id FROM restaurants WHERE name = 'Quán Ngon Phố Nhãn'),
 (SELECT id FROM addresses WHERE address_detail = 'Số 36 đường Cầu Giấy'),
 60000, 15000, 0, 75000, 'Gọi trước khi giao 5 phút', 'DELIVERING', DATE_SUB(NOW(), INTERVAL 1 HOUR)),

-- Đơn 3: DELIVERED + ĐÃ đánh giá — 2 x Phở bò đặc biệt (55.000)
((SELECT id FROM users WHERE email = 'nguyenvanan@gmail.com'),
 (SELECT id FROM restaurants WHERE name = 'Nhà Hàng Phố Việt'),
 (SELECT id FROM addresses WHERE address_detail = 'Số 18 đường Lê Lợi'),
 110000, 15000, 0, 125000, 'Đơn đã giao và đã đánh giá', 'DELIVERED', DATE_SUB(NOW(), INTERVAL 3 DAY)),

-- Đơn 4: DELIVERED + ĐÃ đánh giá — 1 x Bánh đa cua (45.000)
((SELECT id FROM users WHERE email = 'tranthilan@gmail.com'),
 (SELECT id FROM restaurants WHERE name = 'Bếp Việt Hưng Yên'),
 (SELECT id FROM addresses WHERE address_detail = 'Số 12 đường Nguyễn Thiện Thuật'),
 45000, 15000, 0, 60000, 'Không cho hành', 'DELIVERED', DATE_SUB(NOW(), INTERVAL 2 DAY)),

-- Đơn 5: DELIVERED nhưng CHƯA đánh giá — 1 x Bún chả Hà Nội (50.000)
((SELECT id FROM users WHERE email = 'nguyenvanan@gmail.com'),
 (SELECT id FROM restaurants WHERE name = 'Nhà Hàng Phố Việt'),
 (SELECT id FROM addresses WHERE address_detail = 'Số 50 đường Trần Phú'),
 50000, 15000, 0, 65000, 'Đơn chờ bạn đánh giá', 'DELIVERED', DATE_SUB(NOW(), INTERVAL 1 DAY));


-- =====================================================================
-- 9. ORDER_ITEMS — 5 dòng (snapshot tên & giá món lúc đặt)
--    subtotal = quantity * unit_price, tổng khớp food_total của đơn
-- =====================================================================
INSERT INTO order_items (order_id, food_id, food_name, quantity, unit_price, subtotal, note) VALUES
((SELECT id FROM orders WHERE note = 'Giao giờ nghỉ trưa'),
 (SELECT id FROM foods WHERE name = 'Cơm gà chiên mắm'), 'Cơm gà chiên mắm', 2, 60000, 120000, 'Không cay'),

((SELECT id FROM orders WHERE note = 'Gọi trước khi giao 5 phút'),
 (SELECT id FROM foods WHERE name = 'Khoai tây chiên'),  'Khoai tây chiên',  2, 30000, 60000,  'Chiên giòn'),

((SELECT id FROM orders WHERE note = 'Đơn đã giao và đã đánh giá'),
 (SELECT id FROM foods WHERE name = 'Phở bò đặc biệt'),  'Phở bò đặc biệt',  2, 55000, 110000, 'Ít hành'),

((SELECT id FROM orders WHERE note = 'Không cho hành'),
 (SELECT id FROM foods WHERE name = 'Bánh đa cua'),      'Bánh đa cua',      1, 45000, 45000,  NULL),

((SELECT id FROM orders WHERE note = 'Đơn chờ bạn đánh giá'),
 (SELECT id FROM foods WHERE name = 'Bún chả Hà Nội'),   'Bún chả Hà Nội',   1, 50000, 50000,  'Thêm rau sống');


-- =====================================================================
-- 10. PAYMENTS — 5 dòng (1 đơn / 1 payment), amount = total_amount
--     Đúng nghiệp vụ:
--       PENDING + CASH        → UNPAID (chưa nhận hàng nên chưa trả tiền)
--       DELIVERED + CASH      → PAID   (COD tự chuyển PAID khi giao xong)
--       CANCELLED + đã trả    → REFUNDED
-- =====================================================================
INSERT INTO payments (order_id, payment_method, amount, status, transaction_code, payment_date) VALUES
((SELECT id FROM orders WHERE note = 'Giao giờ nghỉ trưa'),
 'CASH', 135000, 'UNPAID', NULL, NULL),

((SELECT id FROM orders WHERE note = 'Gọi trước khi giao 5 phút'),
 'MOMO', 75000, 'PAID', 'MOMO202609290001', NOW()),

((SELECT id FROM orders WHERE note = 'Đơn đã giao và đã đánh giá'),
 'CASH', 125000, 'PAID', NULL, DATE_SUB(NOW(), INTERVAL 3 DAY)),

((SELECT id FROM orders WHERE note = 'Không cho hành'),
 'VNPAY', 60000, 'PAID', 'VNPAY202609290002', DATE_SUB(NOW(), INTERVAL 2 DAY)),

((SELECT id FROM orders WHERE note = 'Đơn chờ bạn đánh giá'),
 'CASH', 65000, 'PAID', NULL, DATE_SUB(NOW(), INTERVAL 1 DAY));


-- =====================================================================
-- 11. REVIEWS — 2 dòng (chỉ đánh giá đơn DELIVERED, mỗi đơn 1 lần)
--     Cố tình KHÔNG đánh giá đơn 'Đơn chờ bạn đánh giá' để trong app
--     vẫn còn nút "Đánh giá quán ⭐" cho bạn bấm thử.
-- =====================================================================
INSERT INTO reviews (user_id, restaurant_id, order_id, rating, comment) VALUES
((SELECT id FROM users WHERE email = 'nguyenvanan@gmail.com'),
 (SELECT id FROM restaurants WHERE name = 'Nhà Hàng Phố Việt'),
 (SELECT id FROM orders WHERE note = 'Đơn đã giao và đã đánh giá'),
 5, 'Phở bò nước dùng đậm đà, giao hàng nhanh.'),

((SELECT id FROM users WHERE email = 'tranthilan@gmail.com'),
 (SELECT id FROM restaurants WHERE name = 'Bếp Việt Hưng Yên'),
 (SELECT id FROM orders WHERE note = 'Không cho hành'),
 4, 'Bánh đa cua ngon, giá hợp lý.');


-- =====================================================================
-- KIỂM TRA SAU KHI CHẠY
-- =====================================================================
SELECT 'users' AS bang, COUNT(*) AS so_dong FROM users
UNION ALL SELECT 'addresses',   COUNT(*) FROM addresses
UNION ALL SELECT 'restaurants', COUNT(*) FROM restaurants
UNION ALL SELECT 'categories',  COUNT(*) FROM categories
UNION ALL SELECT 'foods',       COUNT(*) FROM foods
UNION ALL SELECT 'carts',       COUNT(*) FROM carts
UNION ALL SELECT 'cart_items',  COUNT(*) FROM cart_items
UNION ALL SELECT 'orders',      COUNT(*) FROM orders
UNION ALL SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL SELECT 'payments',    COUNT(*) FROM payments
UNION ALL SELECT 'reviews',     COUNT(*) FROM reviews;

-- Đối chiếu tiền của từng đơn với tổng order_items (cột lech phải = 0)
SELECT o.id, o.status, o.food_total, SUM(oi.subtotal) AS tong_mon,
       o.total_amount, (o.food_total + o.delivery_fee - o.discount) AS tinh_lai,
       o.total_amount - (o.food_total + o.delivery_fee - o.discount) AS lech
FROM orders o JOIN order_items oi ON oi.order_id = o.id
GROUP BY o.id, o.status, o.food_total, o.total_amount, o.delivery_fee, o.discount
ORDER BY o.id;


-- =====================================================================
-- TUỲ CHỌN — chạy thêm nếu bạn BẮT BUỘC phải có 5 dòng ở bảng reviews
-- (đổi 3 đơn còn lại thành DELIVERED rồi đánh giá nốt).
-- Chạy khối này thì app sẽ KHÔNG còn đơn PENDING / DELIVERING để test
-- huỷ đơn và tab "Đang xử lý".
-- =====================================================================
-- UPDATE orders SET status = 'DELIVERED'
--  WHERE note IN ('Giao giờ nghỉ trưa', 'Gọi trước khi giao 5 phút');
-- UPDATE payments p JOIN orders o ON o.id = p.order_id
--    SET p.status = 'PAID', p.payment_date = NOW()
--  WHERE o.note = 'Giao giờ nghỉ trưa';
--
-- INSERT INTO reviews (user_id, restaurant_id, order_id, rating, comment) VALUES
-- ((SELECT id FROM users WHERE email = 'nguyenvanan@gmail.com'),
--  (SELECT id FROM restaurants WHERE name = 'Cơm Nhà Hà Nội'),
--  (SELECT id FROM orders WHERE note = 'Giao giờ nghỉ trưa'), 4, 'Cơm gà ngon, phần ăn đầy đặn.'),
-- ((SELECT id FROM users WHERE email = 'tranthilan@gmail.com'),
--  (SELECT id FROM restaurants WHERE name = 'Quán Ngon Phố Nhãn'),
--  (SELECT id FROM orders WHERE note = 'Gọi trước khi giao 5 phút'), 5, 'Khoai tây giòn và rất ngon.'),
-- ((SELECT id FROM users WHERE email = 'nguyenvanan@gmail.com'),
--  (SELECT id FROM restaurants WHERE name = 'Nhà Hàng Phố Việt'),
--  (SELECT id FROM orders WHERE note = 'Đơn chờ bạn đánh giá'), 5, 'Bún chả thơm, chả nướng vừa tới.');






-- =====================================================
-- KIỂM TRA CÁC BẢNG
-- =====================================================

SHOW TABLES;