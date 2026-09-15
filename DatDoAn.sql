-- =====================================================
-- 1. TẠO DATABASE
-- =====================================================

CREATE DATABASE DatDoAn

CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE DatDoAn


-- =====================================================
-- 2. BẢNG NGƯỜI DÙNG
-- Khách hàng / Chủ nhà hàng / Admin
-- =====================================================

CREATE TABLE NguoiDung (
    MaNguoiDung INT AUTO_INCREMENT PRIMARY KEY,

    HoTen VARCHAR(100) NOT NULL,

    Email VARCHAR(100) UNIQUE,

    SoDienThoai VARCHAR(15) UNIQUE NOT NULL,

    MatKhau VARCHAR(255) NOT NULL,

    VaiTro ENUM(
        'KHACH_HANG',
        'CHU_NHA_HANG',
        'ADMIN'
    ) DEFAULT 'KHACH_HANG',

    TrangThai BOOLEAN DEFAULT TRUE,

    NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- 3. BẢNG ĐỊA CHỈ
-- Một khách hàng có thể có nhiều địa chỉ
-- =====================================================

CREATE TABLE DiaChi (
    MaDiaChi INT AUTO_INCREMENT PRIMARY KEY,

    MaNguoiDung INT NOT NULL,

    TenNguoiNhan VARCHAR(100) NOT NULL,

    SoDienThoai VARCHAR(15) NOT NULL,

    DiaChiChiTiet VARCHAR(255) NOT NULL,

    PhuongXa VARCHAR(100),

    QuanHuyen VARCHAR(100),

    TinhThanh VARCHAR(100),

    MacDinh BOOLEAN DEFAULT FALSE,

    FOREIGN KEY (MaNguoiDung)
        REFERENCES NguoiDung(MaNguoiDung)
        ON DELETE CASCADE
);


-- =====================================================
-- 4. BẢNG NHÀ HÀNG
-- Đề tài hiện tại chỉ sử dụng 1 nhà hàng
-- =====================================================

CREATE TABLE CuaHang (
    MaCuaHang INT AUTO_INCREMENT PRIMARY KEY,

    MaChuNhaHang INT,

    TenCuaHang VARCHAR(150) NOT NULL,

    MoTa TEXT,

    DiaChi VARCHAR(255) NOT NULL,

    SoDienThoai VARCHAR(15),

    HinhAnh VARCHAR(255),

    GioMoCua TIME,

    GioDongCua TIME,

    TrangThai ENUM(
        'DANG_MO',
        'DONG_CUA',
        'TAM_NGUNG'
    ) DEFAULT 'DANG_MO',

    NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (MaChuNhaHang)
        REFERENCES NguoiDung(MaNguoiDung)
        ON DELETE SET NULL
);


-- =====================================================
-- 5. BẢNG DANH MỤC MÓN ĂN
-- Ví dụ:
-- Cơm, Gà, Đồ uống, Tráng miệng...
-- =====================================================

CREATE TABLE DanhMuc (
    MaDanhMuc INT AUTO_INCREMENT PRIMARY KEY,

    MaCuaHang INT NOT NULL,

    TenDanhMuc VARCHAR(100) NOT NULL,

    MoTa VARCHAR(255),

    FOREIGN KEY (MaCuaHang)
        REFERENCES CuaHang(MaCuaHang)
        ON DELETE CASCADE
);


-- =====================================================
-- 6. BẢNG MÓN ĂN
-- =====================================================

CREATE TABLE MonAn (
    MaMonAn INT AUTO_INCREMENT PRIMARY KEY,

    MaDanhMuc INT NOT NULL,

    TenMonAn VARCHAR(150) NOT NULL,

    MoTa TEXT,

    Gia DECIMAL(12,2) NOT NULL,

    HinhAnh VARCHAR(255),

    TrangThai ENUM(
        'CON_HANG',
        'HET_HANG'
    ) DEFAULT 'CON_HANG',

    NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP,

    CHECK (Gia >= 0),

    FOREIGN KEY (MaDanhMuc)
        REFERENCES DanhMuc(MaDanhMuc)
        ON DELETE CASCADE
);


-- =====================================================
-- 7. BẢNG GIỎ HÀNG
-- Mỗi khách hàng chỉ có 1 giỏ hàng
-- =====================================================

CREATE TABLE GioHang (
    MaGioHang INT AUTO_INCREMENT PRIMARY KEY,

    MaNguoiDung INT NOT NULL UNIQUE,

    NgayTao DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (MaNguoiDung)
        REFERENCES NguoiDung(MaNguoiDung)
        ON DELETE CASCADE
);


-- =====================================================
-- 8. CHI TIẾT GIỎ HÀNG
-- =====================================================

CREATE TABLE ChiTietGioHang (
    MaChiTietGioHang INT AUTO_INCREMENT PRIMARY KEY,

    MaGioHang INT NOT NULL,

    MaMonAn INT NOT NULL,

    SoLuong INT NOT NULL DEFAULT 1,

    GhiChu VARCHAR(255),

    CHECK (SoLuong > 0),

    FOREIGN KEY (MaGioHang)
        REFERENCES GioHang(MaGioHang)
        ON DELETE CASCADE,

    FOREIGN KEY (MaMonAn)
        REFERENCES MonAn(MaMonAn)
        ON DELETE CASCADE,

    UNIQUE (MaGioHang, MaMonAn)
);


-- =====================================================
-- 9. BẢNG ĐƠN HÀNG
-- =====================================================

CREATE TABLE DonHang (
    MaDonHang INT AUTO_INCREMENT PRIMARY KEY,

    MaNguoiDung INT NOT NULL,

    MaCuaHang INT NOT NULL,

    MaDiaChi INT NOT NULL,

    TongTienMon DECIMAL(12,2) NOT NULL DEFAULT 0,

    PhiGiaoHang DECIMAL(12,2) NOT NULL DEFAULT 0,

    GiamGia DECIMAL(12,2) NOT NULL DEFAULT 0,

    TongThanhToan DECIMAL(12,2) NOT NULL DEFAULT 0,

    GhiChu VARCHAR(255),

    TrangThai ENUM(
        'CHO_XAC_NHAN',
        'DA_XAC_NHAN',
        'DANG_CHUAN_BI',
        'DANG_GIAO',
        'DA_GIAO',
        'DA_HUY'
    ) DEFAULT 'CHO_XAC_NHAN',

    NgayDat DATETIME DEFAULT CURRENT_TIMESTAMP,

    NgayCapNhat DATETIME
        DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    FOREIGN KEY (MaNguoiDung)
        REFERENCES NguoiDung(MaNguoiDung),

    FOREIGN KEY (MaCuaHang)
        REFERENCES CuaHang(MaCuaHang),

    FOREIGN KEY (MaDiaChi)
        REFERENCES DiaChi(MaDiaChi)
);


-- =====================================================
-- 10. CHI TIẾT ĐƠN HÀNG
-- Lưu lại tên + giá tại thời điểm khách đặt
-- =====================================================

CREATE TABLE ChiTietDonHang (
    MaChiTietDonHang INT AUTO_INCREMENT PRIMARY KEY,

    MaDonHang INT NOT NULL,

    MaMonAn INT NOT NULL,

    TenMonAn VARCHAR(150) NOT NULL,

    SoLuong INT NOT NULL,

    DonGia DECIMAL(12,2) NOT NULL,

    ThanhTien DECIMAL(12,2) NOT NULL,

    GhiChu VARCHAR(255),

    CHECK (SoLuong > 0),

    CHECK (DonGia >= 0),

    CHECK (ThanhTien >= 0),

    FOREIGN KEY (MaDonHang)
        REFERENCES DonHang(MaDonHang)
        ON DELETE CASCADE,

    FOREIGN KEY (MaMonAn)
        REFERENCES MonAn(MaMonAn)
);


-- =====================================================
-- 11. BẢNG THANH TOÁN
-- =====================================================

CREATE TABLE ThanhToan (
    MaThanhToan INT AUTO_INCREMENT PRIMARY KEY,

    MaDonHang INT NOT NULL,

    PhuongThuc ENUM(
        'TIEN_MAT',
        'CHUYEN_KHOAN',
        'MOMO',
        'VNPAY'
    ) DEFAULT 'TIEN_MAT',

    SoTien DECIMAL(12,2) NOT NULL,

    TrangThai ENUM(
        'CHUA_THANH_TOAN',
        'DA_THANH_TOAN',
        'THAT_BAI',
        'HOAN_TIEN'
    ) DEFAULT 'CHUA_THANH_TOAN',

    MaGiaoDich VARCHAR(100),

    NgayThanhToan DATETIME,

    FOREIGN KEY (MaDonHang)
        REFERENCES DonHang(MaDonHang)
        ON DELETE CASCADE
);


-- =====================================================
-- 12. BẢNG ĐÁNH GIÁ
-- =====================================================

CREATE TABLE DanhGia (
    MaDanhGia INT AUTO_INCREMENT PRIMARY KEY,

    MaNguoiDung INT NOT NULL,

    MaCuaHang INT NOT NULL,

    MaDonHang INT NOT NULL,

    SoSao INT NOT NULL,

    NoiDung TEXT,

    NgayDanhGia DATETIME DEFAULT CURRENT_TIMESTAMP,

    CHECK (SoSao BETWEEN 1 AND 5),

    FOREIGN KEY (MaNguoiDung)
        REFERENCES NguoiDung(MaNguoiDung),

    FOREIGN KEY (MaCuaHang)
        REFERENCES CuaHang(MaCuaHang),

    FOREIGN KEY (MaDonHang)
        REFERENCES DonHang(MaDonHang)
        ON DELETE CASCADE
);
SHOW DATABASES;
