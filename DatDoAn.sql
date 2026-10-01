-- =====================================================
-- DATABASE: DatDoAn
-- Hệ thống đặt và giao đồ ăn trực tuyến
-- Mật khẩu test cho tất cả user: 123456
-- Mật khẩu được lưu dưới dạng BCrypt
-- Địa điểm mẫu: Hà Nội và Hưng Yên
-- =====================================================

DROP DATABASE IF EXISTS DatDoAn;

CREATE DATABASE DatDoAn
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE DatDoAn;


-- =====================================================
-- 1. USERS
-- =====================================================

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,

    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone_number VARCHAR(15) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,

    role ENUM(
        'CUSTOMER',
        'RESTAURANT_OWNER',
        'ADMIN'
    ) DEFAULT 'CUSTOMER',

    status BOOLEAN DEFAULT TRUE,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL
);


-- =====================================================
-- 2. ADDRESSES
-- =====================================================

CREATE TABLE addresses (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,

    receiver_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(15) NOT NULL,
    address_detail VARCHAR(255) NOT NULL,
    ward VARCHAR(100),
    district VARCHAR(100),
    city VARCHAR(100),

    is_default BOOLEAN DEFAULT FALSE,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    CONSTRAINT fk_addresses_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =====================================================
-- 3. RESTAURANTS
-- =====================================================

CREATE TABLE restaurants (
    id INT AUTO_INCREMENT PRIMARY KEY,

    owner_id INT,

    name VARCHAR(150) NOT NULL,
    description TEXT,
    address VARCHAR(255) NOT NULL,
    phone_number VARCHAR(15),
    image VARCHAR(255),

    opening_time TIME,
    closing_time TIME,

    -- Khớp nghiệp vụ:
    -- OPEN      : đang mở
    -- CLOSED    : đóng cửa
    -- BUSY      : đang bận
    -- SUSPENDED : bị Admin đình chỉ
    status ENUM(
        'OPEN',
        'CLOSED',
        'BUSY',
        'SUSPENDED'
    ) DEFAULT 'OPEN',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    CONSTRAINT fk_restaurants_owner
        FOREIGN KEY (owner_id)
        REFERENCES users(id)
        ON DELETE SET NULL
);


-- =====================================================
-- 4. CATEGORIES
-- =====================================================

CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,

    restaurant_id INT NOT NULL,

    name VARCHAR(100) NOT NULL,
    description VARCHAR(255),

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    CONSTRAINT fk_categories_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(id)
        ON DELETE CASCADE
);


-- =====================================================
-- 5. FOODS
-- =====================================================

CREATE TABLE foods (
    id INT AUTO_INCREMENT PRIMARY KEY,

    category_id INT NOT NULL,

    name VARCHAR(150) NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL,
    image VARCHAR(255),

    -- Khớp nghiệp vụ:
    -- AVAILABLE   : còn món
    -- UNAVAILABLE : hết món / tạm ngừng bán
    status ENUM(
        'AVAILABLE',
        'UNAVAILABLE'
    ) DEFAULT 'AVAILABLE',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    CONSTRAINT fk_foods_category
        FOREIGN KEY (category_id)
        REFERENCES categories(id)
        ON DELETE CASCADE,

    CHECK (price >= 0)
);


-- =====================================================
-- 6. CARTS
-- =====================================================

CREATE TABLE carts (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL UNIQUE,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    CONSTRAINT fk_carts_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);


-- =====================================================
-- 7. CART ITEMS
-- =====================================================

CREATE TABLE cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,

    cart_id INT NOT NULL,
    food_id INT NOT NULL,

    quantity INT NOT NULL DEFAULT 1,
    note VARCHAR(255),

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    CONSTRAINT fk_cart_items_cart
        FOREIGN KEY (cart_id)
        REFERENCES carts(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_cart_items_food
        FOREIGN KEY (food_id)
        REFERENCES foods(id)
        ON DELETE CASCADE,

    UNIQUE (cart_id, food_id),

    CHECK (quantity > 0)
);


-- =====================================================
-- 8. ORDERS
-- =====================================================

CREATE TABLE orders (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,
    restaurant_id INT NOT NULL,
    address_id INT NOT NULL,

    food_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    delivery_fee DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount DECIMAL(12,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,

    note VARCHAR(255),

    status ENUM(
        'PENDING',
        'CONFIRMED',
        'PREPARING',
        'DELIVERING',
        'DELIVERED',
        'CANCELLED'
    ) DEFAULT 'PENDING',

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    CONSTRAINT fk_orders_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_orders_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(id),

    CONSTRAINT fk_orders_address
        FOREIGN KEY (address_id)
        REFERENCES addresses(id)
);


-- =====================================================
-- 9. ORDER ITEMS
-- =====================================================

CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,

    order_id INT NOT NULL,
    food_id INT NOT NULL,

    food_name VARCHAR(150) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(12,2) NOT NULL,
    subtotal DECIMAL(12,2) NOT NULL,

    note VARCHAR(255),

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_order_items_food
        FOREIGN KEY (food_id)
        REFERENCES foods(id),

    CHECK (quantity > 0),
    CHECK (unit_price >= 0),
    CHECK (subtotal >= 0)
);


-- =====================================================
-- 10. PAYMENTS
-- =====================================================

CREATE TABLE payments (
    id INT AUTO_INCREMENT PRIMARY KEY,

    order_id INT NOT NULL,

    payment_method ENUM(
        'CASH',
        'BANK_TRANSFER',
        'MOMO',
        'VNPAY'
    ) DEFAULT 'CASH',

    amount DECIMAL(12,2) NOT NULL,

    status ENUM(
        'UNPAID',
        'PAID',
        'FAILED',
        'REFUNDED'
    ) DEFAULT 'UNPAID',

    transaction_code VARCHAR(100),
    payment_date DATETIME,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_payments_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,

    CHECK (amount >= 0)
);


-- =====================================================
-- 11. REVIEWS
-- =====================================================

CREATE TABLE reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,

    user_id INT NOT NULL,
    restaurant_id INT NOT NULL,
    order_id INT NOT NULL,

    rating INT NOT NULL,
    comment TEXT,

    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    deleted_at DATETIME NULL,

    CONSTRAINT fk_reviews_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_reviews_restaurant
        FOREIGN KEY (restaurant_id)
        REFERENCES restaurants(id),

    CONSTRAINT fk_reviews_order
        FOREIGN KEY (order_id)
        REFERENCES orders(id)
        ON DELETE CASCADE,

    CHECK (rating BETWEEN 1 AND 5),

    UNIQUE (user_id, order_id)
);


-- =====================================================
-- DỮ LIỆU MẪU
-- Mật khẩu đăng nhập của tất cả tài khoản: 123456
-- =====================================================


-- =====================================================
-- 1. USERS - 5 DỮ LIỆU
-- =====================================================

INSERT INTO users
(full_name, email, phone_number, password, role, status)
VALUES
('Nguyễn Văn An',
 'nguyenvanan@gmail.com',
 '0901000001',
 '$2b$10$sjGY6zwdmbHaWB3RGjTlrO1Rr0pImJJzUkoOiI9pPPMoai5hKmIZO',
 'CUSTOMER',
 TRUE),

('Trần Thị Lan',
 'tranthilan@gmail.com',
 '0901000002',
 '$2b$10$sjGY6zwdmbHaWB3RGjTlrO1Rr0pImJJzUkoOiI9pPPMoai5hKmIZO',
 'CUSTOMER',
 TRUE),

('Lê Minh Tuấn',
 'leminhtuan@gmail.com',
 '0901000003',
 '$2b$10$sjGY6zwdmbHaWB3RGjTlrO1Rr0pImJJzUkoOiI9pPPMoai5hKmIZO',
 'RESTAURANT_OWNER',
 TRUE),

('Phạm Văn Hùng',
 'phamvanhung@gmail.com',
 '0901000004',
 '$2b$10$sjGY6zwdmbHaWB3RGjTlrO1Rr0pImJJzUkoOiI9pPPMoai5hKmIZO',
 'RESTAURANT_OWNER',
 TRUE),

('Admin Hệ Thống',
 'admin@datdoan.vn',
 '0901000005',
 '$2b$10$sjGY6zwdmbHaWB3RGjTlrO1Rr0pImJJzUkoOiI9pPPMoai5hKmIZO',
 'ADMIN',
 TRUE);


-- =====================================================
-- 2. ADDRESSES - 5 DỮ LIỆU
-- =====================================================

INSERT INTO addresses
(user_id, receiver_name, phone_number, address_detail,
 ward, district, city, is_default)
VALUES
(1, 'Nguyễn Văn An', '0901000001',
 'Số 25 đường Nguyễn Trãi',
 'Thanh Xuân Trung', 'Thanh Xuân', 'Hà Nội', TRUE),

(1, 'Nguyễn Văn An', '0901000001',
 'Số 18 đường Lê Lợi',
 'Lê Lợi', 'Thành phố Hưng Yên', 'Hưng Yên', FALSE),

(2, 'Trần Thị Lan', '0901000002',
 'Số 36 đường Cầu Giấy',
 'Dịch Vọng', 'Cầu Giấy', 'Hà Nội', TRUE),

(2, 'Trần Thị Lan', '0901000002',
 'Số 12 đường Nguyễn Thiện Thuật',
 'Lê Lợi', 'Thành phố Hưng Yên', 'Hưng Yên', FALSE),

(1, 'Nguyễn Văn An', '0901000001',
 'Số 50 đường Trần Phú',
 'Lam Sơn', 'Thành phố Hưng Yên', 'Hưng Yên', FALSE);


-- =====================================================
-- 3. RESTAURANTS - 5 DỮ LIỆU
-- =====================================================

INSERT INTO restaurants
(owner_id, name, description, address, phone_number,
 image, opening_time, closing_time, status)
VALUES
(3,
 'Nhà Hàng Phố Việt',
 'Nhà hàng chuyên các món ăn Việt Nam',
 '25 Nguyễn Trãi, Thanh Xuân, Hà Nội',
 '0912000001',
 'pho-viet.jpg',
 '08:00:00', '22:00:00', 'OPEN'),

(3,
 'Cơm Nhà Hà Nội',
 'Các món cơm gia đình truyền thống',
 '36 Cầu Giấy, Dịch Vọng, Cầu Giấy, Hà Nội',
 '0912000002',
 'com-nha-ha-noi.jpg',
 '09:00:00', '21:30:00', 'OPEN'),

(4,
 'Bếp Việt Hưng Yên',
 'Nhà hàng phục vụ món Việt và món gia đình',
 '18 Lê Lợi, Lê Lợi, TP Hưng Yên, Hưng Yên',
 '0912000003',
 'bep-viet-hung-yen.jpg',
 '08:00:00', '22:00:00', 'OPEN'),

(4,
 'Quán Ngon Phố Nhãn',
 'Các món ăn bình dân và đồ uống',
 '50 Trần Phú, Lam Sơn, TP Hưng Yên, Hưng Yên',
 '0912000004',
 'quan-ngon-pho-nhan.jpg',
 '10:00:00', '22:00:00', 'OPEN'),

(3,
 'Góc Ăn Vặt Hà Nội',
 'Đồ ăn nhanh, ăn vặt và đồ uống',
 '72 Hồ Tùng Mậu, Mai Dịch, Cầu Giấy, Hà Nội',
 '0912000005',
 'goc-an-vat.jpg',
 '10:00:00', '23:00:00', 'OPEN');


-- =====================================================
-- 4. CATEGORIES - 5 DỮ LIỆU
-- =====================================================

INSERT INTO categories
(restaurant_id, name, description)
VALUES
(1, 'Món chính', 'Các món ăn chính'),
(2, 'Cơm gia đình', 'Các món cơm truyền thống'),
(3, 'Món Việt', 'Các món ăn Việt Nam'),
(4, 'Đồ ăn bình dân', 'Các món ăn phục vụ hàng ngày'),
(5, 'Đồ ăn vặt', 'Các món ăn nhanh và ăn vặt');


-- =====================================================
-- 5. FOODS - 5 DỮ LIỆU
-- =====================================================

INSERT INTO foods
(category_id, name, description, price, image, status)
VALUES
(1,
 'Phở bò đặc biệt',
 'Phở bò truyền thống với thịt bò và nước dùng đậm đà',
 55000, 'pho-bo.jpg', 'AVAILABLE'),

(2,
 'Cơm gà chiên mắm',
 'Cơm trắng ăn kèm gà chiên nước mắm',
 60000, 'com-ga.jpg', 'AVAILABLE'),

(3,
 'Bún chả Hưng Yên',
 'Bún chả với thịt nướng và nước chấm',
 50000, 'bun-cha.jpg', 'AVAILABLE'),

(4,
 'Bánh đa cua',
 'Bánh đa cua truyền thống',
 45000, 'banh-da-cua.jpg', 'AVAILABLE'),

(5,
 'Khoai tây chiên',
 'Khoai tây chiên giòn',
 30000, 'khoai-tay.jpg', 'AVAILABLE');


-- =====================================================
-- 6. CARTS - 5 DỮ LIỆU
-- =====================================================

INSERT INTO carts (user_id)
VALUES
(1),
(2),
(3),
(4),
(5);


-- =====================================================
-- 7. CART_ITEMS - 5 DỮ LIỆU
-- =====================================================

INSERT INTO cart_items
(cart_id, food_id, quantity, note)
VALUES
(1, 1, 2, 'Ít hành'),
(2, 2, 1, 'Không cay'),
(3, 3, 2, 'Thêm rau'),
(4, 4, 1, NULL),
(5, 5, 2, 'Chiên giòn');


-- =====================================================
-- 8. ORDERS - 5 DỮ LIỆU
-- Tất cả đều DELIVERED để có thể test đánh giá
-- =====================================================

INSERT INTO orders
(user_id, restaurant_id, address_id,
 food_total, delivery_fee, discount, total_amount,
 note, status)
VALUES
(1, 1, 1,
 110000, 15000, 0, 125000,
 'Giao giờ nghỉ trưa', 'DELIVERED'),

(2, 2, 3,
 60000, 15000, 0, 75000,
 'Gọi trước khi giao', 'DELIVERED'),

(1, 3, 2,
 100000, 15000, 0, 115000,
 'Thêm rau', 'DELIVERED'),

(2, 4, 4,
 45000, 15000, 0, 60000,
 'Không cho hành', 'DELIVERED'),

(1, 5, 5,
 60000, 15000, 0, 75000,
 'Giao tận nơi', 'DELIVERED');


-- =====================================================
-- 9. ORDER_ITEMS - 5 DỮ LIỆU
-- =====================================================

INSERT INTO order_items
(order_id, food_id, food_name, quantity,
 unit_price, subtotal, note)
VALUES
(1, 1, 'Phở bò đặc biệt', 2, 55000, 110000, 'Ít hành'),

(2, 2, 'Cơm gà chiên mắm', 1, 60000, 60000, 'Không cay'),

(3, 3, 'Bún chả Hưng Yên', 2, 50000, 100000, 'Thêm rau'),

(4, 4, 'Bánh đa cua', 1, 45000, 45000, 'Không cho hành'),

(5, 5, 'Khoai tây chiên', 2, 30000, 60000, 'Chiên giòn');


-- =====================================================
-- 10. PAYMENTS - 5 DỮ LIỆU
-- =====================================================

INSERT INTO payments
(order_id, payment_method, amount,
 status, transaction_code, payment_date)
VALUES
(1, 'CASH', 125000,
 'PAID', NULL, NOW()),

(2, 'MOMO', 75000,
 'PAID', 'MOMO202609290001', NOW()),

(3, 'VNPAY', 115000,
 'PAID', 'VNPAY202609290002', NOW()),

(4, 'BANK_TRANSFER', 60000,
 'PAID', 'BANK202609290003', NOW()),

(5, 'CASH', 75000,
 'PAID', NULL, NOW());


-- =====================================================
-- 11. REVIEWS - 5 DỮ LIỆU
-- Chỉ review các đơn DELIVERED
-- =====================================================

INSERT INTO reviews
(user_id, restaurant_id, order_id, rating, comment)
VALUES
(1, 1, 1, 5,
 'Món ăn ngon, giao hàng nhanh.'),

(2, 2, 2, 4,
 'Cơm ngon, phần ăn khá đầy đặn.'),

(1, 3, 3, 5,
 'Bún chả ngon, nước chấm vừa miệng.'),

(2, 4, 4, 4,
 'Đồ ăn ổn, giá hợp lý.'),

(1, 5, 5, 5,
 'Khoai tây giòn và rất ngon.');


-- =====================================================
-- KIỂM TRA CÁC BẢNG
-- =====================================================

SHOW TABLES;

SELECT * FROM users;
SELECT * FROM addresses;
SELECT * FROM restaurants;
SELECT * FROM categories;
SELECT * FROM foods;
SELECT * FROM carts;
SELECT * FROM cart_items;
SELECT * FROM orders;
SELECT * FROM order_items;
SELECT * FROM payments;
SELECT * FROM reviews;


-- =====================================================
-- THÔNG TIN ĐĂNG NHẬP TEST
-- =====================================================
-- CUSTOMER:
-- Email: nguyenvanan@gmail.com
-- Password: 123456
--
-- CUSTOMER:
-- Email: tranthilan@gmail.com
-- Password: 123456
--
-- RESTAURANT_OWNER:
-- Email: leminhtuan@gmail.com
-- Password: 123456
--
-- RESTAURANT_OWNER:
-- Email: phamvanhung@gmail.com
-- Password: 123456
--
-- ADMIN:
-- Email: admin@datdoan.vn
-- Password: 123456
-- =====================================================
