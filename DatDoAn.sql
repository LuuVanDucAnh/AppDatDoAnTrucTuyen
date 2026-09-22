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

    status ENUM(
        'OPEN',
        'CLOSED',
        'TEMPORARILY_CLOSED'
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

    status ENUM(
        'AVAILABLE',
        'OUT_OF_STOCK'
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
-- KIỂM TRA CÁC BẢNG
-- =====================================================

SHOW TABLES;