import 'dotenv/config'
import mysql from 'mysql2/promise'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsDir = path.join(__dirname, '..', 'uploads', 'foods')

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

// Danh sách khớp chính xác từng món với hình ảnh thực tế chất lượng cao
const FOOD_IMAGE_MAPPING = [
  // Cơm Tấm Ba Ghiền
  {
    id: 1,
    name: 'Cơm Tấm Sườn Bì Chả Đặc Biệt',
    slug: 'com-tam-suon-bi-cha',
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/b0/C%C6%A1m_T%E1%BA%A5m%2C_Da_Nang%2C_Vietnam.jpg',
    fallback: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 2,
    name: 'Cơm Sườn Cây Mật Ong',
    slug: 'com-suon-cay-mat-ong',
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 3,
    name: 'Cơm Tấm Sườn Cốt Lết',
    slug: 'com-tam-suon-cot-let',
    url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 4,
    name: 'Cơm Tấm Sườn Trứng Ốp La',
    slug: 'com-tam-suon-op-la',
    url: 'https://images.unsplash.com/photo-1525755662778-989d0524087e?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 5,
    name: 'Chả Trứng Hấp Ổ',
    slug: 'cha-trung-hap',
    url: 'https://images.unsplash.com/photo-1552611052-33e04de081de?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 6,
    name: 'Bì Trộn Thính Thơm',
    slug: 'bi-tron-thinh',
    url: 'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 7,
    name: 'Sườn Nướng Phần Thêm',
    slug: 'suon-nuong-them',
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 8,
    name: 'Canh Khổ Qua Nhồi Thịt',
    slug: 'canh-kho-qua-nhoi-thit',
    url: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Canhchua2.jpg',
    fallback: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 9,
    name: 'Trà Tắc Hạt É Chua Ngọt',
    slug: 'tra-tac-hat-e',
    url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 33,
    name: 'Phở bò đặc biệt',
    slug: 'pho-bo-dac-biet-33',
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/99/Ph%E1%BB%9F_b%C3%B2%2C_C%E1%BA%A7u_Gi%E1%BA%A5y%2C_H%C3%A0_N%E1%BB%99i.jpg',
    fallback: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 34,
    name: 'Cơm gà chiên mắm',
    slug: 'com-ga-chien-mam-34',
    url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 35,
    name: 'Bún chả Hưng Yên',
    slug: 'bun-cha-hung-yen-35',
    url: 'https://upload.wikimedia.org/wikipedia/commons/8/8b/B%C3%BAn_ch%E1%BA%A3_Th%E1%BB%A5y_Khu%C3%AA.jpg',
    fallback: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 36,
    name: 'Bánh đa cua',
    slug: 'banh-da-cua-36',
    url: 'https://upload.wikimedia.org/wikipedia/commons/8/81/BANH_DA_CUA_1.jpg',
    fallback: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 37,
    name: 'Khoai tây chiên',
    slug: 'khoai-tay-chien-37',
    url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&auto=format&fit=crop&q=80',
  },

  // Phở Bò Gia Truyền 1986
  {
    id: 10,
    name: 'Phở Bò Tái Nạm Gầu',
    slug: 'pho-bo-tai-nam-gau',
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/99/Ph%E1%BB%9F_b%C3%B2%2C_C%E1%BA%A7u_Gi%E1%BA%A5y%2C_H%C3%A0_N%E1%BB%99i.jpg',
    fallback: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 11,
    name: 'Phở Bò Tái Lăn',
    slug: 'pho-bo-tai-lan',
    url: 'https://images.unsplash.com/photo-1576577445504-6af96477db52?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 12,
    name: 'Phở Bò Viên',
    slug: 'pho-bo-vien',
    url: 'https://images.unsplash.com/photo-1503764654157-72d979d9af2f?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 13,
    name: 'Quẩy Giòn',
    slug: 'quay-gion',
    url: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Youtiao_at_street_stall.jpg',
    fallback: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 14,
    name: 'Trứng Chần',
    slug: 'trung-chan',
    url: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 78,
    name: 'Phở Bò Sốt Vang',
    slug: 'pho-bo-sot-vang',
    url: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 79,
    name: 'Quẩy Giòn Phố Cổ (Đĩa 3 chiếc)',
    slug: 'quay-gion-pho-co',
    url: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Youtiao_at_street_stall.jpg',
    fallback: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&auto=format&fit=crop&q=80'
  },

  // Trà Sữa KOI Thé - Pasteur
  {
    id: 15,
    name: 'Trà Sữa KOI Macchiato',
    slug: 'tra-sua-koi-macchiato',
    url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 16,
    name: 'Macchiato Trà Xanh',
    slug: 'macchiato-tra-xanh',
    url: 'https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 17,
    name: 'Trà Sữa Trân Châu Đường Đen',
    slug: 'tra-sua-tran-chau-duong-den-17',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/%D7%9E%D7%A9%D7%A7%D7%94_%D7%A2%D7%9D_%D7%9B%D7%93%D7%95%D7%A8%D7%99_%D7%98%D7%A4%D7%99%D7%95%D7%A7%D7%94.jpg',
    fallback: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 18,
    name: 'Hồng Trà Sữa Full Topping',
    slug: 'hong-tra-sua-full-topping',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/%D7%9E%D7%A9%D7%A7%D7%94_%D7%A2%D7%9D_%D7%9B%D7%93%D7%95%D7%A8%D7%99_%D7%98%D7%A4%D7%99%D7%95%D7%A7%D7%94.jpg',
    fallback: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 80,
    name: 'Trà Sữa Trân Châu Hoàng Kim',
    slug: 'tra-sua-tran-chau-hoang-kim',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/%D7%9E%D7%A9%D7%A7%D7%94_%D7%A2%D7%9D_%D7%9B%D7%93%D7%95%D7%A8%D7%99_%D7%98%D7%A4%D7%99%D7%95%D7%A7%D7%94.jpg',
    fallback: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 81,
    name: 'Lục Trà Macchiato Lớp Kem Dày',
    slug: 'luc-tra-macchiato',
    url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80',
  },

  // Gà Rán Popeyes - Nguyễn Trãi
  {
    id: 19,
    name: 'Gà Rán Giòn Cay Giòn Rụm',
    slug: 'ga-ran-gion-cay',
    url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 20,
    name: 'Combo 3 Miếng Gà + Khoai',
    slug: 'combo-3-mieng-ga-khoai',
    url: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 21,
    name: 'Burger Gà Cajun',
    slug: 'burger-ga-cajun',
    url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 22,
    name: 'Cơm Gà Rán Sốt Cay',
    slug: 'com-ga-ran-sot-cay',
    url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=800&auto=format&fit=crop&q=80',
  },

  // Pizza Hut - Trần Hưng Đạo
  {
    id: 23,
    name: 'Pizza Viền Phô Mai Hải Sản',
    slug: 'pizza-vien-pho-mai-hai-san',
    url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 24,
    name: 'Pizza Bò Bít Tết',
    slug: 'pizza-bo-bit-tet',
    url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80',
  },

  // Bún Bò Huế Cô Ba
  {
    id: 25,
    name: 'Bún Bò Huế Đặc Biệt',
    slug: 'bun-bo-hue-dac-biet',
    url: 'https://upload.wikimedia.org/wikipedia/commons/0/00/Bun-Bo-Hue-from-Huong-Giang-2011.jpg',
    fallback: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 26,
    name: 'Bún Bò Giò Heo',
    slug: 'bun-bo-gio-heo',
    url: 'https://upload.wikimedia.org/wikipedia/commons/0/00/Bun-Bo-Hue-from-Huong-Giang-2011.jpg',
    fallback: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 27,
    name: 'Chả Cua Huế',
    slug: 'cha-cua-hue',
    url: 'https://upload.wikimedia.org/wikipedia/commons/b/b7/Ch%E1%BA%A3_c%C3%A1_L%C3%A3_V%E1%BB%8Dng.jpg',
    fallback: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80'
  },

  // Nhà Hàng Phố Việt
  {
    id: 28,
    name: 'Phở Bò Đặc Biệt',
    slug: 'pho-bo-dac-biet-28',
    url: 'https://upload.wikimedia.org/wikipedia/commons/9/99/Ph%E1%BB%9F_b%C3%B2%2C_C%E1%BA%A7u_Gi%E1%BA%A5y%2C_H%C3%A0_N%E1%BB%99i.jpg',
    fallback: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 29,
    name: 'Bún Chả Hà Nội Nướng Than',
    slug: 'bun-cha-ha-noi-29',
    url: 'https://upload.wikimedia.org/wikipedia/commons/8/8b/B%C3%BAn_ch%E1%BA%A3_Th%E1%BB%A5y_Khu%C3%AA.jpg',
    fallback: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 38,
    name: 'Phở Cuốn Bò Tươi',
    slug: 'pho-cuon-bo-tuoi',
    url: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Vegetable_pho_and_spring_rolls_%2843702095594%29.jpg',
    fallback: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 39,
    name: 'Nem Rán Hà Nội Giòn Rụm',
    slug: 'nem-ran-ha-noi-39',
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Cha_gio.jpg',
    fallback: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 40,
    name: 'Trà Sen Vàng Long Nhãn',
    slug: 'tra-sen-vang-long-nhan',
    url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&auto=format&fit=crop&q=80',
  },

  // Cơm Nhà Hà Nội
  {
    id: 30,
    name: 'Cơm Gà Chiên Mắm Giòn',
    slug: 'com-ga-chien-mam-30',
    url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 41,
    name: 'Sườn Xào Chua Ngọt',
    slug: 'suon-xao-chua-ngot-41',
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 42,
    name: 'Thịt Kho Tàu Nước Dừa',
    slug: 'thit-kho-tau-nuoc-dua',
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/39/Th%E1%BB%8Bt_kho_T%C3%A0u.jpg',
    fallback: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 43,
    name: 'Canh Cua Mồng Tơi Cà Pháo',
    slug: 'canh-cua-mong-toi',
    url: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Canhchua2.jpg',
    fallback: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 44,
    name: 'Rau Muống Xào Tỏi Giòn',
    slug: 'rau-muong-xao-toi',
    url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
  },

  // Bếp Việt Hưng Yên
  {
    id: 31,
    name: 'Bánh Đa Cua Nồi Đất',
    slug: 'banh-da-cua-noi-dat-31',
    url: 'https://upload.wikimedia.org/wikipedia/commons/8/81/BANH_DA_CUA_1.jpg',
    fallback: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 45,
    name: 'Bún Thang Phố Hiến',
    slug: 'bun-thang-pho-hien',
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/64/B%C3%BAn_thang.JPG',
    fallback: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 46,
    name: 'Cá Kho Tương Bần Niêu Đất',
    slug: 'ca-kho-tuong-ban',
    url: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 47,
    name: 'Chè Sen Long Nhãn',
    slug: 'che-sen-long-nhan',
    url: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Ch%C3%A8_xo%C3%A0i.jpg',
    fallback: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 72,
    name: 'Gà Đồi Hấp Lá Chanh Nửa Con',
    slug: 'ga-doi-hap-la-chanh',
    url: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/BeiQieJi-WhiteCutChicken.jpg',
    fallback: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 73,
    name: 'Cơm Niêu Cháy Giòn Thịt Kho Tiêu',
    slug: 'com-nieu-chay-gion',
    url: 'https://upload.wikimedia.org/wikipedia/commons/3/39/Th%E1%BB%8Bt_kho_T%C3%A0u.jpg',
    fallback: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 74,
    name: 'Canh Cua Rau Đay Cà Pháo Mướp Hương',
    slug: 'canh-cua-rau-day',
    url: 'https://upload.wikimedia.org/wikipedia/commons/a/a0/Canhchua2.jpg',
    fallback: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 75,
    name: 'Rau Bí Xào Tỏi Xém Cạnh',
    slug: 'rau-bi-xao-toi',
    url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 77,
    name: 'Nước Vối Tươi Đá Lạnh',
    slug: 'nuoc-voi-tuoi',
    url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&auto=format&fit=crop&q=80',
  },

  // Quán Ngon Phố Nhãn
  {
    id: 32,
    name: 'Khoai Tây Chiên Bơ Tỏi',
    slug: 'khoai-tay-chien-bo-toi-32',
    url: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 48,
    name: 'Cơm Đùi Gà Nướng Mật Ong',
    slug: 'com-dui-ga-nuong-mat-ong',
    url: 'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 49,
    name: 'Cơm Bò Xào Cần Tỏi',
    slug: 'com-bo-xao-can-toi',
    url: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 62,
    name: 'Cơm Sườn Xào Chua Ngọt',
    slug: 'com-suon-xao-chua-ngot-62',
    url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 63,
    name: 'Cơm Rang Dưa Bò Hà Nội',
    slug: 'com-rang-dua-bo-ha-noi',
    url: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 65,
    name: 'Nem Chua Rán Phố Cổ',
    slug: 'nem-chua-ran-65',
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Cha_gio.jpg',
    fallback: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 66,
    name: 'Bún Đậu Mẹt Thập Cẩm',
    slug: 'bun-dau-met-thap-cam',
    url: 'https://upload.wikimedia.org/wikipedia/commons/1/11/B%C3%BAn_%C4%91%E1%BA%ADu_m%E1%BA%AFm_t%C3%B4m_%282019%29.jpg',
    fallback: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 67,
    name: 'Trà Nhãn Lồng Hạt Sen Phố Hiến',
    slug: 'tra-nhan-long-hat-sen',
    url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 68,
    name: 'Nước Mía Sầu Riêng Béo Ngậy',
    slug: 'nuoc-mia-sau-rieng',
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/63/Sugarcanejuice.jpg',
    fallback: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80'
  },

  // Góc Ăn Vặt Hà Nội
  {
    id: 51,
    name: 'Bánh Tráng Nướng Trứng Xúc Xích',
    slug: 'banh-trang-nuong-trung-xuc-xich',
    url: 'https://upload.wikimedia.org/wikipedia/commons/8/8c/Pizzabanhtrangnuong2.jpg',
    fallback: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 52,
    name: 'Nem Nướng Nha Trang Cuốn',
    slug: 'nem-nuong-nha-trang-52',
    url: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/Vegetable_pho_and_spring_rolls_%2843702095594%29.jpg',
    fallback: 'https://images.unsplash.com/photo-1541544741938-0af808871cc0?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 53,
    name: 'Chân Gà Rút Xương Sả Tắc',
    slug: 'chan-ga-rut-xuong-sa-tac',
    url: 'https://upload.wikimedia.org/wikipedia/commons/c/cd/Ga_xao_sa_ot.jpg',
    fallback: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 54,
    name: 'Khoai Lang Kén Chiên Giòn',
    slug: 'khoai-lang-ken-chien-gion',
    url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 55,
    name: 'Trà Chanh Giã Tay Quảng Đông',
    slug: 'tra-chanh-gia-tay-quang-dong',
    url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 56,
    name: 'Trà Đào Cam Sả Tươi',
    slug: 'tra-dao-cam-sa-tuoi',
    url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 57,
    name: 'Tokbokki Phô Mai Cay Kéo Sợi',
    slug: 'tokbokki-pho-mai-cay',
    url: 'https://upload.wikimedia.org/wikipedia/commons/5/56/Korean.snacks-Tteokbokki-08.jpg',
    fallback: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 58,
    name: 'Cá Viên Chiên Nước Mắm Sốt Tỏi',
    slug: 'ca-vien-chien-nuoc-mam',
    url: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 59,
    name: 'Nem Chua Rán Phố Cổ Hà Nội',
    slug: 'nem-chua-ran-pho-co-ha-noi',
    url: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Cha_gio.jpg',
    fallback: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=800&auto=format&fit=crop&q=80'
  },
  {
    id: 60,
    name: 'Hồ Lô Nướng Mật Ong Rừng',
    slug: 'ho-lo-nuong-mat-ong',
    url: 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=800&auto=format&fit=crop&q=80',
  },
  {
    id: 61,
    name: 'Sữa Tươi Trân Châu Đường Đen',
    slug: 'sua-tuoi-tran-chau-duong-den-61',
    url: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/%D7%9E%D7%A9%D7%A7%D7%94_%D7%A2%D7%9D_%D7%9B%D7%93%D7%95%D7%A8%D7%99_%D7%98%D7%A4%D7%99%D7%95%D7%A7%D7%94.jpg',
    fallback: 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?w=800&auto=format&fit=crop&q=80'
  },
]

async function downloadImage(url, dest) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) FoodApp/1.0',
      'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
    }
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length < 1000) throw new Error(`File too small: ${buf.length} bytes`)
  fs.writeFileSync(dest, buf)
  return buf.length
}

async function main() {
  console.log('Connecting to database...')
  const db = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: +process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  })

  console.log(`Starting to download and sync ${FOOD_IMAGE_MAPPING.length} food images...`)

  for (const item of FOOD_IMAGE_MAPPING) {
    const filename = `${item.slug}.jpg`
    const dest = path.join(uploadsDir, filename)
    let downloaded = false
    let finalPath = `/uploads/foods/${filename}`

    // 1. Download image locally
    try {
      const bytes = await downloadImage(item.url, dest)
      console.log(`[OK] Downloaded #${item.id} ${item.name} -> ${filename} (${bytes} bytes)`)
      downloaded = true
    } catch (err) {
      console.warn(`[WARN] Primary URL failed for #${item.id} ${item.name} (${err.message})`)
      if (item.fallback) {
        try {
          const bytes = await downloadImage(item.fallback, dest)
          console.log(`[OK - Fallback] Downloaded #${item.id} ${item.name} -> ${filename} (${bytes} bytes)`)
          downloaded = true
        } catch (fErr) {
          console.error(`[ERR] Fallback failed for #${item.id} ${item.name}: ${fErr.message}`)
        }
      }
    }

    if (!downloaded) {
      // Nếu không download được thì dùng fallback URL trực tiếp
      finalPath = item.fallback || item.url
    }

    // 2. Cập nhật vào DB
    await db.query('UPDATE foods SET image = ? WHERE id = ?', [finalPath, item.id])
    console.log(`  -> Updated DB food #${item.id} image = ${finalPath}`)
  }

  console.log('\n✅ All food images processed successfully!')
  await db.end()
}

main().catch(console.error)
