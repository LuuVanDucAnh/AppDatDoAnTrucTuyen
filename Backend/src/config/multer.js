import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Thư mục lưu ảnh: Backend/uploads/<type>/
const UPLOAD_BASE = path.join(__dirname, '..', '..', 'uploads')

// Tạo thư mục nếu chưa có
const ensureDir = (dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
}

/**
 * Tạo multer storage theo loại (foods, restaurants, avatars)
 */
const createStorage = (type) =>
  multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = path.join(UPLOAD_BASE, type)
      ensureDir(dir)
      cb(null, dir)
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase()
      const uniqueName = `${type}_${Date.now()}_${Math.round(Math.random() * 1e6)}${ext}`
      cb(null, uniqueName)
    },
  })

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Chỉ cho phép tải lên ảnh định dạng: JPEG, PNG, WEBP, GIF'), false)
  }
}

const MAX_SIZE = 5 * 1024 * 1024 // 5MB

export const uploadFood = multer({
  storage: createStorage('foods'),
  fileFilter,
  limits: { fileSize: MAX_SIZE },
})

export const uploadRestaurant = multer({
  storage: createStorage('restaurants'),
  fileFilter,
  limits: { fileSize: MAX_SIZE },
})

export const uploadAvatar = multer({
  storage: createStorage('avatars'),
  fileFilter,
  limits: { fileSize: MAX_SIZE },
})
