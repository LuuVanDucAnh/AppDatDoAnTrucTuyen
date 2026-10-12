require('./node_modules/dotenv').config({ path: './.env' });
const fs = require('fs');
const path = require('path');
const { sequelize } = require('./src/config/database.js');

const rootDir = path.resolve(__dirname, '..');
const uploadsFoodsDir = path.resolve(__dirname, 'uploads', 'foods');

if (!fs.existsSync(uploadsFoodsDir)) {
  fs.mkdirSync(uploadsFoodsDir, { recursive: true });
}

const assignments = [
  // ==========================================
  // 1. GÓC ĂN VẶT HÀ NỘI (restaurant_id: 11)
  // ==========================================
  {
    foodId: 51,
    restaurantId: 11,
    foodName: 'Bánh Tráng Nướng Trứng Xúc Xích',
    sourceFile: path.join(rootDir, 'nhahanggocanvathanoi', 'banh-trang-nuong-4.jpg'),
    destFilename: 'banh-trang-nuong-trung-xuc-xich.jpg'
  },
  {
    foodId: 52,
    restaurantId: 11,
    foodName: 'Nem Nướng Nha Trang Cuốn',
    sourceFile: path.join(rootDir, 'nhahanggocanvathanoi', 'nemnuong.jpg'),
    destFilename: 'nem-nuong-nha-trang.jpg'
  },
  {
    foodId: 53,
    restaurantId: 11,
    foodName: 'Chân Gà Rút Xương Sả Tắc',
    sourceFile: path.join(rootDir, 'nhahanggocanvathanoi', 'changarutxuong.webp'),
    destFilename: 'chan-ga-rut-xuong-sa-tac.webp'
  },
  {
    foodId: 54,
    restaurantId: 11,
    foodName: 'Khoai Lang Kén Chiên Giòn',
    sourceFile: path.join(rootDir, 'nhahanggocanvathanoi', '2-cach-lam-khoai-lang-ken-thom-gion-don-gian-ngay-tai-nha-202112310923093776.jpg'),
    destFilename: 'khoai-lang-ken-chien-gion.jpg'
  },
  {
    foodId: 55,
    restaurantId: 11,
    foodName: 'Trà Chanh Giã Tay Quảng Đông',
    sourceFile: path.join(rootDir, 'nhahanggocanvathanoi', 'tra-chanh-gia-tay-829x1024.jpg'),
    destFilename: 'tra-chanh-gia-tay-quang-dong.jpg'
  },
  {
    foodId: 56,
    restaurantId: 11,
    foodName: 'Trà Đào Cam Sả Tươi',
    sourceFile: path.join(rootDir, 'nhahanggocanvathanoi', 'huong-dan-cong-thuc-tra-dao-cam-sa-hut-khach-ngon-kho-cuong_20240526180626.jpg'),
    destFilename: 'tra-dao-cam-sa-tuoi.jpg'
  },
  {
    foodId: 57,
    restaurantId: 11,
    foodName: 'Tokbokki Phô Mai Cay Kéo Sợi',
    sourceFile: path.join(rootDir, 'nhahanggocanvathanoi', 'cach-lam-tokbokki-pho-mai-thom-ngon-be-se-thich-me-141945.webp'),
    destFilename: 'tokbokki-pho-mai-cay.webp'
  },
  {
    foodId: 58,
    restaurantId: 11,
    foodName: 'Cá Viên Chiên Nước Mắm Sốt Tỏi',
    sourceFile: path.join(uploadsFoodsDir, 'ca-vien-chien-nuoc-mam.jpg'),
    destFilename: 'ca-vien-chien-nuoc-mam.jpg'
  },
  {
    foodId: 59,
    restaurantId: 11,
    foodName: 'Nem Chua Rán Phố Cổ Hà Nội',
    sourceFile: path.join(rootDir, 'nhahanggocanvathanoi', 'nemchuaran.jpg'),
    destFilename: 'nem-chua-ran-pho-co-ha-noi.jpg'
  },
  {
    foodId: 60,
    restaurantId: 11,
    foodName: 'Hồ Lô Nướng Mật Ong Rừng',
    sourceFile: path.join(rootDir, 'nhahanggocanvathanoi', 'holonuong.jpg'),
    destFilename: 'ho-lo-nuong-mat-ong.jpg'
  },
  {
    foodId: 61,
    restaurantId: 11,
    foodName: 'Sữa Tươi Trân Châu Đường Đen',
    sourceFile: path.join(rootDir, 'nhahanggocanvathanoi', 'sua-tuoi-tran-chau-duong-den-ly-500ml_20240527104717.jpg'),
    destFilename: 'sua-tuoi-tran-chau-duong-den.jpg'
  },

  // ==========================================
  // 2. QUÁN NGON PHỐ NHÃN (restaurant_id: 10)
  // ==========================================
  {
    foodId: 32,
    restaurantId: 10,
    foodName: 'Khoai Tây Chiên Bơ Tỏi',
    sourceFile: path.join(rootDir, 'nhahangquanngonphonhan', 'Khoai Tây Chiên Bơ Tỏ.jpg'),
    destFilename: 'khoai-tay-chien-bo-toi.jpg'
  },
  {
    foodId: 48,
    restaurantId: 10,
    foodName: 'Cơm Đùi Gà Nướng Mật Ong',
    sourceFile: path.join(rootDir, 'nhahangquanngonphonhan', 'comduiganuong.jpg'),
    destFilename: 'com-dui-ga-nuong-mat-ong.jpg'
  },
  {
    foodId: 49,
    restaurantId: 10,
    foodName: 'Cơm Bò Xào Cần Tỏi',
    sourceFile: path.join(rootDir, 'nhahangquanngonphonhan', 'comboxaocantoi.jpg'),
    destFilename: 'com-bo-xao-can-toi.jpg'
  },
  {
    foodId: 62,
    restaurantId: 10,
    foodName: 'Cơm Sườn Xào Chua Ngọt',
    sourceFile: path.join(rootDir, 'nhahangquanngonphonhan', 'comsuonxaochuangot.jpg'),
    destFilename: 'com-suon-xao-chua-ngot.jpg'
  },
  {
    foodId: 63,
    restaurantId: 10,
    foodName: 'Cơm Rang Dưa Bò Hà Nội',
    sourceFile: path.join(rootDir, 'nhahangquanngonphonhan', 'Cơm Rang Dưa Bò Hà Nội.jpg'),
    destFilename: 'com-rang-dua-bo-ha-noi.jpg'
  },
  {
    foodId: 65,
    restaurantId: 10,
    foodName: 'Nem Chua Rán Phố Cổ',
    sourceFile: path.join(rootDir, 'nhahanggocanvathanoi', 'nemchuaran.jpg'),
    destFilename: 'nem-chua-ran-pho-co.jpg'
  },
  {
    foodId: 66,
    restaurantId: 10,
    foodName: 'Bún Đậu Mẹt Thập Cẩm',
    sourceFile: path.join(rootDir, 'nhahangquanngonphonhan', 'Bún Đậu Mẹt Thập Cẩm.jpeg'),
    destFilename: 'bun-dau-met-thap-cam.jpeg'
  },
  {
    foodId: 67,
    restaurantId: 10,
    foodName: 'Trà Nhãn Lồng Hạt Sen Phố Hiến',
    sourceFile: path.join(rootDir, 'nhahangquanngonphonhan', 'Trà Nhãn Lồng Hạt Sen Phố Hiến.jpg'),
    destFilename: 'tra-nhan-long-hat-sen-pho-hien.jpg'
  },
  {
    foodId: 68,
    restaurantId: 10,
    foodName: 'Nước Mía Sầu Riêng Béo Ngậy',
    sourceFile: path.join(rootDir, 'nhahangquanngonphonhan', 'Nước Mía Sầu Riêng Béo Ngậy.jpg'),
    destFilename: 'nuoc-mia-sau-rieng-beo-ngay.jpg'
  },

  // ==========================================
  // 3. BẾP VIỆT HƯNG YÊN (restaurant_id: 9)
  // ==========================================
  {
    foodId: 31,
    restaurantId: 9,
    foodName: 'Bánh Đa Cua Nồi Đất',
    sourceFile: path.join(rootDir, 'nhahangbepviethungyen', 'Bánh Đa Cua Nồi Đất.jpg'),
    destFilename: 'banh-da-cua-noi-dat.jpg'
  },
  {
    foodId: 45,
    restaurantId: 9,
    foodName: 'Bún Thang Phố Hiến',
    sourceFile: path.join(rootDir, 'nhahangbepviethungyen', 'Bún Thang Phố Hiến.jpg'),
    destFilename: 'bun-thang-pho-hien.jpg'
  },
  {
    foodId: 46,
    restaurantId: 9,
    foodName: 'Cá Kho Tương Bần Niêu Đất',
    sourceFile: path.join(rootDir, 'nhahangbepviethungyen', 'Cá Kho Tương Bần Niêu Đất.jpg'),
    destFilename: 'ca-kho-tuong-ban-nieu-dat.jpg'
  },
  {
    foodId: 47,
    restaurantId: 9,
    foodName: 'Chè Sen Long Nhãn',
    sourceFile: path.join(uploadsFoodsDir, 'che-sen-long-nhan.jpg'),
    destFilename: 'che-sen-long-nhan.jpg'
  },
  {
    foodId: 72,
    restaurantId: 9,
    foodName: 'Gà Đồi Hấp Lá Chanh Nửa Con',
    sourceFile: path.join(rootDir, 'nhahangbepviethungyen', 'Gà Đồi Hấp Lá Chanh Nửa Con.jpg'),
    destFilename: 'ga-doi-hap-la-chanh-nua-con.jpg'
  },
  {
    foodId: 73,
    restaurantId: 9,
    foodName: 'Cơm Niêu Cháy Giòn Thịt Kho Tiêu',
    sourceFile: path.join(rootDir, 'nhahangbepviethungyen', 'Cơm Niêu Cháy Giòn Thịt Kho Tiêu.webp'),
    destFilename: 'com-nieu-chay-gion-thit-kho-tieu.webp'
  },
  {
    foodId: 74,
    restaurantId: 9,
    foodName: 'Canh Cua Rau Đay Cà Pháo Mướp Hương',
    sourceFile: path.join(rootDir, 'nhahangbepviethungyen', 'Canh Cua Rau Đay Cà Pháo Mướp Hương.jpg'),
    destFilename: 'canh-cua-rau-day-ca-phao-muop-huong.jpg'
  },
  {
    foodId: 75,
    restaurantId: 9,
    foodName: 'Rau Bí Xào Tỏi Xém Cạnh',
    sourceFile: path.join(rootDir, 'nhahangbepviethungyen', 'Rau Bí Xào Tỏi Xém Cạnh.jpg'),
    destFilename: 'rau-bi-xao-toi-xem-canh.jpg'
  },
  {
    foodId: 77,
    restaurantId: 9,
    foodName: 'Nước Vối Tươi Đá Lạnh',
    sourceFile: path.join(uploadsFoodsDir, 'nuoc-voi-tuoi.jpg'),
    destFilename: 'nuoc-voi-tuoi.jpg'
  }
];

async function main() {
  try {
    console.log('=== BẮT ĐẦU CẬP NHẬT ẢNH MÓN ĂN THẬT CHO 3 NHÀ HÀNG ===\n');

    let successCount = 0;

    for (const item of assignments) {
      const destPath = path.join(uploadsFoodsDir, item.destFilename);
      const relativeDbPath = `/uploads/foods/${item.destFilename}`;

      // Check source file
      if (!fs.existsSync(item.sourceFile)) {
        console.error(`[ERROR] File nguồn không tồn tại: ${item.sourceFile}`);
        continue;
      }

      // Copy file to uploads/foods if source and destination are different
      if (path.resolve(item.sourceFile) !== path.resolve(destPath)) {
        fs.copyFileSync(item.sourceFile, destPath);
        console.log(`[COPIED] ${path.basename(item.sourceFile)} -> ${item.destFilename} (${fs.statSync(destPath).size} bytes)`);
      } else {
        console.log(`[EXISTING] ${item.destFilename} (${fs.statSync(destPath).size} bytes)`);
      }

      // For .jpeg also make a .jpg fallback copy if appropriate
      if (item.destFilename.endsWith('.jpeg')) {
        const altJpgPath = destPath.replace('.jpeg', '.jpg');
        fs.copyFileSync(destPath, altJpgPath);
      }

      // Update Database
      await sequelize.query(
        'UPDATE foods SET image = :image WHERE id = :id',
        { replacements: { image: relativeDbPath, id: item.foodId } }
      );

      console.log(`[DB UPDATED] ID ${item.foodId} - "${item.foodName}" -> ${relativeDbPath}\n`);
      successCount++;
    }

    console.log(`\n=== HOÀN TẤT: Cập nhật thành công ${successCount}/${assignments.length} món ăn! ===\n`);

    // Verify back from DB
    const [verified] = await sequelize.query(`
      SELECT f.id, c.restaurant_id, r.name as restaurant_name, f.name as food_name, f.image
      FROM foods f
      JOIN categories c ON f.category_id = c.id
      JOIN restaurants r ON c.restaurant_id = r.id
      WHERE c.restaurant_id IN (9, 10, 11)
      ORDER BY c.restaurant_id, f.id
    `);

    console.log('=== KẾT QUẢ KIỂM TRA TỪ CƠ SỞ DỮ LIỆU ===');
    verified.forEach(row => {
      const fullPath = path.join(rootDir, 'Backend', row.image.replace(/^\//, '').replace(/\//g, path.sep));
      const exists = fs.existsSync(fullPath);
      console.log(`[Res ${row.restaurant_id}] [ID ${row.id}] ${row.food_name} | DB Image: ${row.image} | File Exists: ${exists}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
}

main();
