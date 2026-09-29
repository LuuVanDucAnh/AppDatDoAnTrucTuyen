import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { sendSuccess, sendCreated, sendError } from '../../utils/response.js'
import { getPaginationMeta } from '../../utils/pagination.js'
import Users from '../users/users.model.js'
import Addresses from '../addresses/addresses.model.js'
import Orders from '../orders/orders.model.js'
import OrderItems from '../order_items/order_items.model.js'
import Restaurants from '../restaurants/restaurants.model.js'
import Payments from '../payments/payments.model.js'
import Reviews from '../reviews/reviews.model.js'
import bcrypt from 'bcryptjs'
import { Op } from 'sequelize'

const router = Router()

// Tất cả route profile đều cần đăng nhập
router.use(authMiddleware)

/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: Khách hàng tự quản lý hồ sơ cá nhân
 */

// ─────────────────────────────────────────────────────────────────
// THÔNG TIN CÁ NHÂN
// ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /profile/me:
 *   get:
 *     tags: [Profile]
 *     summary: Xem thông tin cá nhân của tôi
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/me', async (req, res, next) => {
  try {
    const user = await Users.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'deleted_at'] },
    })
    if (!user) return sendError(res, 'Không tìm thấy người dùng', 404)
    sendSuccess(res, 'Lấy thông tin cá nhân thành công', user)
  } catch (err) { next(err) }
})

/**
 * @swagger
 * /profile/me:
 *   put:
 *     tags: [Profile]
 *     summary: Cập nhật thông tin cá nhân (tên, email, số điện thoại, ảnh đại diện)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               full_name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 description: URL ảnh đại diện (lấy từ /upload/avatar)
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/me', async (req, res, next) => {
  try {
    const user = await Users.findByPk(req.user.id)
    if (!user) return sendError(res, 'Không tìm thấy người dùng', 404)

    const { full_name, email, phone_number } = req.body
    if (full_name !== undefined) user.full_name = full_name
    if (email !== undefined) user.email = email
    if (phone_number !== undefined) user.phone_number = phone_number

    await user.save()
    const { password: _, deleted_at: __, ...safeUser } = user.toJSON()
    sendSuccess(res, 'Cập nhật thông tin cá nhân thành công', safeUser)
  } catch (err) { next(err) }
})

/**
 * @swagger
 * /profile/change-password:
 *   patch:
 *     tags: [Profile]
 *     summary: Đổi mật khẩu
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [current_password, new_password]
 *             properties:
 *               current_password:
 *                 type: string
 *                 description: Mật khẩu hiện tại
 *               new_password:
 *                 type: string
 *                 minLength: 6
 *                 description: Mật khẩu mới (ít nhất 6 ký tự)
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *       400:
 *         description: Mật khẩu hiện tại không đúng
 */
router.patch('/change-password', async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body

    if (!current_password || !new_password) {
      return sendError(res, 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới', 400)
    }
    if (new_password.length < 6) {
      return sendError(res, 'Mật khẩu mới phải có ít nhất 6 ký tự', 400)
    }

    const user = await Users.findByPk(req.user.id)
    if (!user) return sendError(res, 'Không tìm thấy người dùng', 404)

    const isMatch = await bcrypt.compare(current_password, user.password)
    if (!isMatch) return sendError(res, 'Mật khẩu hiện tại không đúng', 400)

    user.password = await bcrypt.hash(new_password, 10)
    await user.save()

    sendSuccess(res, 'Đổi mật khẩu thành công')
  } catch (err) { next(err) }
})

// ─────────────────────────────────────────────────────────────────
// ĐỊA CHỈ GIAO HÀNG
// ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /profile/addresses:
 *   get:
 *     tags: [Profile]
 *     summary: Xem danh sách địa chỉ giao hàng của tôi
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *   post:
 *     tags: [Profile]
 *     summary: Thêm địa chỉ giao hàng mới
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [receiver_name, phone_number, address_detail]
 *             properties:
 *               receiver_name:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               address_detail:
 *                 type: string
 *               ward:
 *                 type: string
 *               district:
 *                 type: string
 *               city:
 *                 type: string
 *               is_default:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Thêm địa chỉ thành công
 */
router.get('/addresses', async (req, res, next) => {
  try {
    const addresses = await Addresses.findAll({
      where: { user_id: req.user.id, deleted_at: null },
      order: [['is_default', 'DESC'], ['id', 'DESC']],
    })
    sendSuccess(res, 'Lấy danh sách địa chỉ thành công', addresses)
  } catch (err) { next(err) }
})

router.post('/addresses', async (req, res, next) => {
  try {
    const { receiver_name, phone_number, address_detail, ward, district, city, is_default = false } = req.body

    if (!receiver_name || !phone_number || !address_detail) {
      return sendError(res, 'receiver_name, phone_number và address_detail là bắt buộc', 400)
    }

    // Nếu đặt làm mặc định → bỏ mặc định các địa chỉ cũ
    if (is_default) {
      await Addresses.update({ is_default: false }, { where: { user_id: req.user.id } })
    }

    const address = await Addresses.create({
      user_id: req.user.id,
      receiver_name,
      phone_number,
      address_detail,
      ward: ward || null,
      district: district || null,
      city: city || null,
      is_default: Boolean(is_default),
    })

    sendCreated(res, 'Thêm địa chỉ thành công', address)
  } catch (err) { next(err) }
})

/**
 * @swagger
 * /profile/addresses/{id}:
 *   put:
 *     tags: [Profile]
 *     summary: Cập nhật địa chỉ giao hàng
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               receiver_name:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               address_detail:
 *                 type: string
 *               ward:
 *                 type: string
 *               district:
 *                 type: string
 *               city:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     tags: [Profile]
 *     summary: Xóa địa chỉ giao hàng
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.put('/addresses/:id', async (req, res, next) => {
  try {
    const address = await Addresses.findOne({
      where: { id: req.params.id, user_id: req.user.id, deleted_at: null },
    })
    if (!address) return sendError(res, 'Không tìm thấy địa chỉ', 404)

    const { receiver_name, phone_number, address_detail, ward, district, city } = req.body
    if (receiver_name !== undefined) address.receiver_name = receiver_name
    if (phone_number !== undefined) address.phone_number = phone_number
    if (address_detail !== undefined) address.address_detail = address_detail
    if (ward !== undefined) address.ward = ward
    if (district !== undefined) address.district = district
    if (city !== undefined) address.city = city

    await address.save()
    sendSuccess(res, 'Cập nhật địa chỉ thành công', address)
  } catch (err) { next(err) }
})

router.delete('/addresses/:id', async (req, res, next) => {
  try {
    const address = await Addresses.findOne({
      where: { id: req.params.id, user_id: req.user.id, deleted_at: null },
    })
    if (!address) return sendError(res, 'Không tìm thấy địa chỉ', 404)

    address.deleted_at = new Date()
    await address.save()
    sendSuccess(res, 'Xóa địa chỉ thành công')
  } catch (err) { next(err) }
})

/**
 * @swagger
 * /profile/addresses/{id}/set-default:
 *   patch:
 *     tags: [Profile]
 *     summary: Đặt địa chỉ làm mặc định
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Đã đặt làm địa chỉ mặc định
 */
router.patch('/addresses/:id/set-default', async (req, res, next) => {
  try {
    const address = await Addresses.findOne({
      where: { id: req.params.id, user_id: req.user.id, deleted_at: null },
    })
    if (!address) return sendError(res, 'Không tìm thấy địa chỉ', 404)

    // Bỏ mặc định tất cả địa chỉ cũ của user
    await Addresses.update({ is_default: false }, { where: { user_id: req.user.id } })

    address.is_default = true
    await address.save()
    sendSuccess(res, 'Đã đặt làm địa chỉ mặc định', address)
  } catch (err) { next(err) }
})

// ─────────────────────────────────────────────────────────────────
// LỊCH SỬ ĐƠN HÀNG
// ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /profile/orders:
 *   get:
 *     tags: [Profile]
 *     summary: Xem lịch sử đơn hàng của tôi
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, COMPLETED, CANCELLED, PENDING, CONFIRMED, PREPARING, DELIVERING, DELIVERED]
 *         description: "ACTIVE = các đơn đang xử lý, COMPLETED = đã giao thành công"
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/orders', async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query
    const where = { user_id: req.user.id }

    if (status === 'ACTIVE') {
      where.status = { [Op.in]: ['PENDING', 'CONFIRMED', 'PREPARING', 'DELIVERING'] }
    } else if (status === 'COMPLETED') {
      where.status = 'DELIVERED'
    } else if (status) {
      where.status = status
    }

    const p = Math.max(1, parseInt(page) || 1)
    const l = Math.max(1, parseInt(limit) || 10)

    const { count, rows } = await Orders.findAndCountAll({
      where,
      include: [
        { model: OrderItems, as: 'items' },
        { model: Restaurants, as: 'restaurant', attributes: ['id', 'name', 'image', 'address', 'phone_number'] },
        { model: Payments, as: 'payment' },
      ],
      order: [['id', 'DESC']],
      limit: l,
      offset: (p - 1) * l,
      distinct: true,
    })

    sendSuccess(res, 'Lấy lịch sử đơn hàng thành công', rows, getPaginationMeta(count, p, l))
  } catch (err) { next(err) }
})

/**
 * @swagger
 * /profile/orders/{id}:
 *   get:
 *     tags: [Profile]
 *     summary: Xem chi tiết đơn hàng
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy
 */
router.get('/orders/:id', async (req, res, next) => {
  try {
    const order = await Orders.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: [
        { model: OrderItems, as: 'items' },
        { model: Restaurants, as: 'restaurant', attributes: ['id', 'name', 'image', 'address', 'phone_number'] },
        { model: Addresses, as: 'address' },
        { model: Payments, as: 'payment' },
      ],
    })
    if (!order) return sendError(res, 'Không tìm thấy đơn hàng', 404)
    sendSuccess(res, 'Lấy chi tiết đơn hàng thành công', order)
  } catch (err) { next(err) }
})

// ─────────────────────────────────────────────────────────────────
// ĐÁNH GIÁ CỦA TÔI
// ─────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /profile/reviews:
 *   get:
 *     tags: [Profile]
 *     summary: Xem tất cả đánh giá tôi đã viết
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 *   post:
 *     tags: [Profile]
 *     summary: Viết đánh giá cho đơn hàng đã giao thành công
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [order_id, rating]
 *             properties:
 *               order_id:
 *                 type: integer
 *                 description: ID đơn hàng (phải ở trạng thái DELIVERED)
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Đánh giá thành công
 *       400:
 *         description: Đơn hàng chưa được giao hoặc đã đánh giá rồi
 */
router.get('/reviews', async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query
    const p = Math.max(1, parseInt(page) || 1)
    const l = Math.max(1, parseInt(limit) || 10)

    const { count, rows } = await Reviews.findAndCountAll({
      where: { user_id: req.user.id },
      include: [
        { model: Restaurants, as: 'restaurant', attributes: ['id', 'name', 'image'] },
      ],
      order: [['id', 'DESC']],
      limit: l,
      offset: (p - 1) * l,
      distinct: true,
    })

    sendSuccess(res, 'Lấy danh sách đánh giá thành công', rows, getPaginationMeta(count, p, l))
  } catch (err) { next(err) }
})

router.post('/reviews', async (req, res, next) => {
  try {
    const { order_id, rating, comment } = req.body

    if (!order_id || !rating) return sendError(res, 'order_id và rating là bắt buộc', 400)
    if (rating < 1 || rating > 5) return sendError(res, 'rating phải từ 1 đến 5', 400)

    // Kiểm tra đơn hàng phải của user này và đã DELIVERED
    const order = await Orders.findOne({
      where: { id: order_id, user_id: req.user.id },
    })
    if (!order) return sendError(res, 'Không tìm thấy đơn hàng', 404)
    if (order.status !== 'DELIVERED') {
      return sendError(res, 'Chỉ có thể đánh giá đơn hàng đã giao thành công', 400)
    }

    // Kiểm tra đã đánh giá chưa
    const existed = await Reviews.findOne({ where: { user_id: req.user.id, order_id } })
    if (existed) return sendError(res, 'Bạn đã đánh giá đơn hàng này rồi', 400)

    const review = await Reviews.create({
      user_id: req.user.id,
      restaurant_id: order.restaurant_id,
      order_id,
      rating: Number(rating),
      comment: comment || null,
    })

    sendCreated(res, 'Đánh giá thành công', review)
  } catch (err) { next(err) }
})

/**
 * @swagger
 * /profile/reviews/{id}:
 *   put:
 *     tags: [Profile]
 *     summary: Chỉnh sửa đánh giá của mình
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     tags: [Profile]
 *     summary: Xóa đánh giá của mình
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.put('/reviews/:id', async (req, res, next) => {
  try {
    const review = await Reviews.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    })
    if (!review) return sendError(res, 'Không tìm thấy đánh giá', 404)

    const { rating, comment } = req.body
    if (rating !== undefined) {
      if (rating < 1 || rating > 5) return sendError(res, 'rating phải từ 1 đến 5', 400)
      review.rating = Number(rating)
    }
    if (comment !== undefined) review.comment = comment

    await review.save()
    sendSuccess(res, 'Cập nhật đánh giá thành công', review)
  } catch (err) { next(err) }
})

router.delete('/reviews/:id', async (req, res, next) => {
  try {
    const review = await Reviews.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    })
    if (!review) return sendError(res, 'Không tìm thấy đánh giá', 404)
    await review.destroy()
    sendSuccess(res, 'Xóa đánh giá thành công')
  } catch (err) { next(err) }
})

export default router
