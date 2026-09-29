import { Router } from 'express'
import path from 'path'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { uploadFood, uploadRestaurant, uploadAvatar } from '../../config/multer.js'
import { sendSuccess, sendError } from '../../utils/response.js'

const router = Router()

// URL gốc để truy cập ảnh (dùng trong response)
const getFileUrl = (req, type, filename) => {
  return `${req.protocol}://${req.get('host')}/uploads/${type}/${filename}`
}

const handleUploadError = (err, res) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return sendError(res, 'File quá lớn, tối đa 5MB', 400)
  }
  return sendError(res, err.message || 'Lỗi khi tải ảnh lên', 400)
}

/**
 * @swagger
 * tags:
 *   name: Upload
 *   description: API tải ảnh lên server
 */

/**
 * @swagger
 * /upload/food:
 *   post:
 *     tags: [Upload]
 *     summary: Tải ảnh món ăn lên server
 *     description: Upload 1 file ảnh (JPEG/PNG/WEBP/GIF, tối đa 5MB). Trả về URL của ảnh.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload thành công, trả về URL ảnh
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   example: "http://localhost:3000/uploads/foods/foods_1234567890_123456.jpg"
 *                 filename:
 *                   type: string
 *       400:
 *         description: File không hợp lệ hoặc quá lớn
 */
router.post('/food', authMiddleware, (req, res) => {
  uploadFood.single('image')(req, res, (err) => {
    if (err) return handleUploadError(err, res)
    if (!req.file) return sendError(res, 'Vui lòng chọn file ảnh', 400)
    sendSuccess(res, 'Tải ảnh món ăn thành công', {
      url: getFileUrl(req, 'foods', req.file.filename),
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    })
  })
})

/**
 * @swagger
 * /upload/restaurant:
 *   post:
 *     tags: [Upload]
 *     summary: Tải ảnh nhà hàng lên server
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload thành công, trả về URL ảnh
 *       400:
 *         description: File không hợp lệ
 */
router.post('/restaurant', authMiddleware, (req, res) => {
  uploadRestaurant.single('image')(req, res, (err) => {
    if (err) return handleUploadError(err, res)
    if (!req.file) return sendError(res, 'Vui lòng chọn file ảnh', 400)
    sendSuccess(res, 'Tải ảnh nhà hàng thành công', {
      url: getFileUrl(req, 'restaurants', req.file.filename),
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    })
  })
})

/**
 * @swagger
 * /upload/avatar:
 *   post:
 *     tags: [Upload]
 *     summary: Tải ảnh đại diện người dùng lên server
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [image]
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload thành công, trả về URL ảnh
 *       400:
 *         description: File không hợp lệ
 */
router.post('/avatar', authMiddleware, (req, res) => {
  uploadAvatar.single('image')(req, res, (err) => {
    if (err) return handleUploadError(err, res)
    if (!req.file) return sendError(res, 'Vui lòng chọn file ảnh', 400)
    sendSuccess(res, 'Tải ảnh đại diện thành công', {
      url: getFileUrl(req, 'avatars', req.file.filename),
      filename: req.file.filename,
      size: req.file.size,
      mimetype: req.file.mimetype,
    })
  })
})

export default router
