import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { adminMiddleware } from '../../middleware/admin.middleware.js'
import {
  // Dashboard
  getPlatformDashboard,
  getPlatformRevenueStats,
  getTopRestaurants,
  // Users
  getUsers,
  getUserDetail,
  toggleUserStatus,
  changeUserRole,
  createUser,
  updateUser,
  deleteUser,
  // Restaurants
  getRestaurants,
  getRestaurantDetail,
  setRestaurantStatus,
  createRestaurant,
  updateRestaurant,
  deleteRestaurant,
  // Orders
  getAllOrders,
  getOrderDetail,
  forceUpdateOrderStatus,
  deleteOrder,
  // Payments
  getAllPayments,
  // Reviews
  getAllReviews,
  deleteReview,
} from './admin.controller.js'

const router = Router()

// Tất cả các route admin đều yêu cầu đăng nhập + role ADMIN
router.use(authMiddleware, adminMiddleware)

// ═══════════════════════════════════════════════════════════════════
// A. DASHBOARD & THỐNG KÊ TOÀN SÀN
// ═══════════════════════════════════════════════════════════════════

/**
 * @swagger
 * tags:
 *   name: Admin - Dashboard
 *   description: Quản trị viên xem tổng quan & thống kê toàn sàn
 */

/**
 * @swagger
 * /admin/dashboard:
 *   get:
 *     tags: [Admin - Dashboard]
 *     summary: |
 *       Tổng quan hệ thống: tổng user, nhà hàng, đơn hàng hôm nay/tháng,
 *       doanh thu hôm nay/tháng/tất cả, đơn đang chờ, tổng đánh giá
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *       403:
 *         description: Không có quyền admin
 */
router.get('/dashboard', getPlatformDashboard)

/**
 * @swagger
 * /admin/stats/revenue:
 *   get:
 *     tags: [Admin - Dashboard]
 *     summary: Thống kê doanh thu toàn sàn theo ngày/tháng/năm
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: "Từ ngày (VD: 2025-01-01)"
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: "Đến ngày (VD: 2025-12-31)"
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, month, year]
 *           default: day
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/stats/revenue', getPlatformRevenueStats)

/**
 * @swagger
 * /admin/stats/top-restaurants:
 *   get:
 *     tags: [Admin - Dashboard]
 *     summary: Top nhà hàng theo doanh thu hoặc số đơn
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [revenue, orders]
 *           default: revenue
 *         description: Sắp xếp theo doanh thu hoặc số đơn
 *     responses:
 *       200:
 *         description: Thành công
 */
router.get('/stats/top-restaurants', getTopRestaurants)

// ═══════════════════════════════════════════════════════════════════
// B. QUẢN LÝ NGƯỜI DÙNG
// ═══════════════════════════════════════════════════════════════════

/**
 * @swagger
 * tags:
 *   name: Admin - Users
 *   description: Quản trị viên quản lý người dùng
 */

/**
 * @swagger
 * /admin/users:
 *   get:
 *     tags: [Admin - Users]
 *     summary: Lấy danh sách tất cả người dùng (lọc, tìm kiếm, phân trang)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm theo tên, email, số điện thoại
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [CUSTOMER, OWNER, ADMIN]
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *           enum: [0, 1]
 *         description: "0 = bị khoá, 1 = active"
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
 *     tags: [Admin - Users]
 *     summary: Admin tạo tài khoản người dùng mới (có thể tạo OWNER, ADMIN)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [full_name, phone_number, password]
 *             properties:
 *               full_name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [CUSTOMER, OWNER, ADMIN]
 *                 default: CUSTOMER
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.get('/users', getUsers)
router.post('/users', createUser)

/**
 * @swagger
 * /admin/users/{userId}:
 *   get:
 *     tags: [Admin - Users]
 *     summary: Xem chi tiết người dùng (kèm danh sách địa chỉ)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy
 *   put:
 *     tags: [Admin - Users]
 *     summary: Cập nhật thông tin người dùng (kể cả role, status, reset password)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
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
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [CUSTOMER, OWNER, ADMIN]
 *               status:
 *                 type: integer
 *                 enum: [0, 1]
 *     responses:
 *       200:
 *         description: Thành công
 *   delete:
 *     tags: [Admin - Users]
 *     summary: Xóa tài khoản người dùng (soft delete, không thể xóa ADMIN)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Đã xóa thành công
 */
router.get('/users/:userId', getUserDetail)
router.put('/users/:userId', updateUser)
router.delete('/users/:userId', deleteUser)

/**
 * @swagger
 * /admin/users/{userId}/toggle-status:
 *   patch:
 *     tags: [Admin - Users]
 *     summary: Khoá / mở khoá tài khoản người dùng (toggle status 0 ↔ 1)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 *       403:
 *         description: Không thể khóa tài khoản admin
 */
router.patch('/users/:userId/toggle-status', toggleUserStatus)

/**
 * @swagger
 * /admin/users/{userId}/role:
 *   patch:
 *     tags: [Admin - Users]
 *     summary: Thay đổi role người dùng (CUSTOMER | OWNER | ADMIN)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [CUSTOMER, OWNER, ADMIN]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.patch('/users/:userId/role', changeUserRole)

// ═══════════════════════════════════════════════════════════════════
// C. QUẢN LÝ NHÀ HÀNG
// ═══════════════════════════════════════════════════════════════════

/**
 * @swagger
 * tags:
 *   name: Admin - Restaurants
 *   description: Quản trị viên quản lý nhà hàng trên sàn
 */

/**
 * @swagger
 * /admin/restaurants:
 *   get:
 *     tags: [Admin - Restaurants]
 *     summary: Lấy danh sách tất cả nhà hàng (lọc theo trạng thái, tìm kiếm)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Tìm theo tên, địa chỉ
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [OPEN, CLOSED, BUSY, SUSPENDED]
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
 *     tags: [Admin - Restaurants]
 *     summary: Admin tạo nhà hàng mới (tự động nâng role chủ quán lên OWNER)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, address]
 *             properties:
 *               owner_id:
 *                 type: integer
 *                 description: ID của chủ quán (user phải tồn tại)
 *               name:
 *                 type: string
 *               address:
 *                 type: string
 *               phone_number:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *               opening_time:
 *                 type: string
 *                 example: "08:00"
 *               closing_time:
 *                 type: string
 *                 example: "22:00"
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.get('/restaurants', getRestaurants)
router.post('/restaurants', createRestaurant)

/**
 * @swagger
 * /admin/restaurants/{restaurantId}:
 *   get:
 *     tags: [Admin - Restaurants]
 *     summary: Xem chi tiết nhà hàng (kèm thông tin chủ quán, thống kê đơn & doanh thu)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 *   delete:
 *     tags: [Admin - Restaurants]
 *     summary: Xóa nhà hàng (chỉ xóa được khi không còn đơn hàng đang active)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Đã xóa thành công
 *       400:
 *         description: Nhà hàng còn đơn hàng chưa hoàn thành
 */
router.get('/restaurants/:restaurantId', getRestaurantDetail)
router.put('/restaurants/:restaurantId', updateRestaurant)
router.delete('/restaurants/:restaurantId', deleteRestaurant)

/**
 * @swagger
 * /admin/restaurants/{restaurantId}/status:
 *   patch:
 *     tags: [Admin - Restaurants]
 *     summary: Cập nhật trạng thái nhà hàng (OPEN | CLOSED | BUSY | SUSPENDED)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [OPEN, CLOSED, BUSY, SUSPENDED]
 *                 description: SUSPENDED = đình chỉ hoạt động (chỉ admin mới đặt được)
 *     responses:
 *       200:
 *         description: Thành công
 */
router.patch('/restaurants/:restaurantId/status', setRestaurantStatus)

// ═══════════════════════════════════════════════════════════════════
// D. QUẢN LÝ ĐƠN HÀNG
// ═══════════════════════════════════════════════════════════════════

/**
 * @swagger
 * tags:
 *   name: Admin - Orders
 *   description: Quản trị viên theo dõi & xử lý đơn hàng toàn sàn
 */

/**
 * @swagger
 * /admin/orders:
 *   get:
 *     tags: [Admin - Orders]
 *     summary: Xem tất cả đơn hàng toàn sàn (lọc theo trạng thái, nhà hàng, ngày)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, PREPARING, DELIVERING, DELIVERED, CANCELLED]
 *       - in: query
 *         name: restaurant_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
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
router.get('/orders', getAllOrders)

/**
 * @swagger
 * /admin/orders/{orderId}:
 *   get:
 *     tags: [Admin - Orders]
 *     summary: Xem chi tiết đơn hàng (kèm thông tin user, nhà hàng, địa chỉ, thanh toán)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Thành công
 *       404:
 *         description: Không tìm thấy đơn hàng
 */
router.get('/orders/:orderId', getOrderDetail)

/**
 * @swagger
 * /admin/orders/{orderId}/status:
 *   patch:
 *     tags: [Admin - Orders]
 *     summary: |
 *       Admin ép cập nhật trạng thái đơn hàng (không bị ràng buộc flow).
 *       Dùng để can thiệp khi xảy ra sự cố.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, CONFIRMED, PREPARING, DELIVERING, DELIVERED, CANCELLED]
 *     responses:
 *       200:
 *         description: Thành công
 */
router.patch('/orders/:orderId/status', forceUpdateOrderStatus)
router.delete('/orders/:orderId', deleteOrder)

// ═══════════════════════════════════════════════════════════════════
// E. QUẢN LÝ THANH TOÁN
// ═══════════════════════════════════════════════════════════════════

/**
 * @swagger
 * tags:
 *   name: Admin - Payments
 *   description: Quản trị viên theo dõi thanh toán toàn sàn
 */

/**
 * @swagger
 * /admin/payments:
 *   get:
 *     tags: [Admin - Payments]
 *     summary: Xem tất cả thanh toán (lọc theo phương thức, trạng thái, ngày)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: payment_method
 *         schema:
 *           type: string
 *           enum: [CASH, MOMO, VNPAY, ZALOPAY]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [UNPAID, PAID, REFUNDED]
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
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
router.get('/payments', getAllPayments)

// ═══════════════════════════════════════════════════════════════════
// F. QUẢN LÝ ĐÁNH GIÁ
// ═══════════════════════════════════════════════════════════════════

/**
 * @swagger
 * tags:
 *   name: Admin - Reviews
 *   description: Quản trị viên kiểm duyệt đánh giá
 */

/**
 * @swagger
 * /admin/reviews:
 *   get:
 *     tags: [Admin - Reviews]
 *     summary: Xem tất cả đánh giá (lọc theo nhà hàng, số sao)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: restaurant_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
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
router.get('/reviews', getAllReviews)

/**
 * @swagger
 * /admin/reviews/{reviewId}:
 *   delete:
 *     tags: [Admin - Reviews]
 *     summary: Xóa đánh giá vi phạm / spam
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Đã xóa thành công
 *       404:
 *         description: Không tìm thấy đánh giá
 */
router.delete('/reviews/:reviewId', deleteReview)

export default router
