import { Router } from 'express'
import { authMiddleware } from '../../middleware/auth.middleware.js'
import { ownerMiddleware, restaurantOwnerMiddleware } from '../../middleware/owner.middleware.js'
import {
  // Restaurant management
  getMyRestaurants,
  updateRestaurantInfo,
  toggleRestaurantStatus,
  setRestaurantStatus,
  // Order management
  getRestaurantOrders,
  getOrderDetail,
  updateOrderStatus,
  // Food management
  getRestaurantFoods,
  createFood,
  updateFood,
  toggleFoodStatus,
  deleteFood,
  // Category management
  getRestaurantCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  // Dashboard & Stats
  getDashboard,
  getRevenueStats,
  getTopFoods,
  getRestaurantReviews,
} from './owner.controller.js'

const router = Router()

// Tất cả các route chủ quán đều yêu cầu đăng nhập + role OWNER
router.use(authMiddleware, ownerMiddleware)

// ═══════════════════════════════════════════════════════════════════
// A. QUẢN LÝ NHÀ HÀNG CỦA TÔI
// ═══════════════════════════════════════════════════════════════════

/**
 * @swagger
 * tags:
 *   name: Owner - Restaurants
 *   description: Chủ quán quản lý nhà hàng của mình
 */

/**
 * @swagger
 * /owner/my-restaurants:
 *   get:
 *     tags: [Owner - Restaurants]
 *     summary: Lấy danh sách nhà hàng của chủ quán
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Thành công
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không phải chủ quán
 */
router.get('/my-restaurants', getMyRestaurants)

/**
 * @swagger
 * /owner/restaurants/{restaurantId}:
 *   put:
 *     tags: [Owner - Restaurants]
 *     summary: Cập nhật thông tin nhà hàng (tên, mô tả, địa chỉ, giờ mở cửa...)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               address:
 *                 type: string
 *               phone_number:
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
 *       200:
 *         description: Cập nhật thành công
 */
router.put('/restaurants/:restaurantId', restaurantOwnerMiddleware, updateRestaurantInfo)

/**
 * @swagger
 * /owner/restaurants/{restaurantId}/toggle-status:
 *   patch:
 *     tags: [Owner - Restaurants]
 *     summary: Mở/đóng cửa nhà hàng (toggle OPEN ↔ CLOSED)
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
 *         description: Đã đổi trạng thái
 */
router.patch('/restaurants/:restaurantId/toggle-status', restaurantOwnerMiddleware, toggleRestaurantStatus)

/**
 * @swagger
 * /owner/restaurants/{restaurantId}/status:
 *   patch:
 *     tags: [Owner - Restaurants]
 *     summary: Đặt trạng thái nhà hàng (OPEN | CLOSED | BUSY)
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
 *                 enum: [OPEN, CLOSED, BUSY]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 */
router.patch('/restaurants/:restaurantId/status', restaurantOwnerMiddleware, setRestaurantStatus)

// ═══════════════════════════════════════════════════════════════════
// B. QUẢN LÝ ĐƠN HÀNG
// ═══════════════════════════════════════════════════════════════════

/**
 * @swagger
 * tags:
 *   name: Owner - Orders
 *   description: Chủ quán quản lý đơn hàng
 */

/**
 * @swagger
 * /owner/restaurants/{restaurantId}/orders:
 *   get:
 *     tags: [Owner - Orders]
 *     summary: Xem danh sách đơn hàng của nhà hàng
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, PREPARING, DELIVERING, DELIVERED, CANCELLED]
 *         description: Lọc theo trạng thái đơn hàng
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
router.get('/restaurants/:restaurantId/orders', restaurantOwnerMiddleware, getRestaurantOrders)

/**
 * @swagger
 * /owner/restaurants/{restaurantId}/orders/{orderId}:
 *   get:
 *     tags: [Owner - Orders]
 *     summary: Xem chi tiết một đơn hàng
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: integer
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
router.get('/restaurants/:restaurantId/orders/:orderId', restaurantOwnerMiddleware, getOrderDetail)

/**
 * @swagger
 * /owner/restaurants/{restaurantId}/orders/{orderId}/status:
 *   patch:
 *     tags: [Owner - Orders]
 *     summary: |
 *       Cập nhật trạng thái đơn hàng.
 *       Flow: PENDING → CONFIRMED → PREPARING → DELIVERING → DELIVERED
 *       Hủy: PENDING/CONFIRMED → CANCELLED
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: integer
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
 *                 enum: [CONFIRMED, PREPARING, DELIVERING, DELIVERED, CANCELLED]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Chuyển trạng thái không hợp lệ
 */
router.patch('/restaurants/:restaurantId/orders/:orderId/status', restaurantOwnerMiddleware, updateOrderStatus)

// ═══════════════════════════════════════════════════════════════════
// C. QUẢN LÝ MÓN ĂN
// ═══════════════════════════════════════════════════════════════════

/**
 * @swagger
 * tags:
 *   name: Owner - Foods
 *   description: Chủ quán quản lý thực đơn
 */

/**
 * @swagger
 * /owner/restaurants/{restaurantId}/foods:
 *   get:
 *     tags: [Owner - Foods]
 *     summary: Xem danh sách món ăn của nhà hàng (có thể lọc theo trạng thái, danh mục)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, UNAVAILABLE]
 *       - in: query
 *         name: category_id
 *         schema:
 *           type: integer
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
 *     tags: [Owner - Foods]
 *     summary: Thêm món ăn mới vào nhà hàng
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
 *             required: [category_id, name, price]
 *             properties:
 *               category_id:
 *                 type: integer
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               image:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, UNAVAILABLE]
 *                 default: AVAILABLE
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.get('/restaurants/:restaurantId/foods', restaurantOwnerMiddleware, getRestaurantFoods)
router.post('/restaurants/:restaurantId/foods', restaurantOwnerMiddleware, createFood)

/**
 * @swagger
 * /owner/restaurants/{restaurantId}/foods/{foodId}:
 *   put:
 *     tags: [Owner - Foods]
 *     summary: Cập nhật thông tin món ăn
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: foodId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category_id:
 *                 type: integer
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               image:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [AVAILABLE, UNAVAILABLE]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     tags: [Owner - Foods]
 *     summary: Xóa món ăn
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: foodId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 */
router.put('/restaurants/:restaurantId/foods/:foodId', restaurantOwnerMiddleware, updateFood)
router.delete('/restaurants/:restaurantId/foods/:foodId', restaurantOwnerMiddleware, deleteFood)

/**
 * @swagger
 * /owner/restaurants/{restaurantId}/foods/{foodId}/toggle-status:
 *   patch:
 *     tags: [Owner - Foods]
 *     summary: Bật/tắt món ăn (AVAILABLE ↔ UNAVAILABLE)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: foodId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Đã đổi trạng thái
 */
router.patch('/restaurants/:restaurantId/foods/:foodId/toggle-status', restaurantOwnerMiddleware, toggleFoodStatus)

// ═══════════════════════════════════════════════════════════════════
// D. QUẢN LÝ DANH MỤC
// ═══════════════════════════════════════════════════════════════════

/**
 * @swagger
 * tags:
 *   name: Owner - Categories
 *   description: Chủ quán quản lý danh mục món ăn
 */

/**
 * @swagger
 * /owner/restaurants/{restaurantId}/categories:
 *   get:
 *     tags: [Owner - Categories]
 *     summary: Xem danh sách danh mục của nhà hàng (kèm món ăn trong mỗi danh mục)
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
 *   post:
 *     tags: [Owner - Categories]
 *     summary: Tạo danh mục mới cho nhà hàng
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
 *             required: [name]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo thành công
 */
router.get('/restaurants/:restaurantId/categories', restaurantOwnerMiddleware, getRestaurantCategories)
router.post('/restaurants/:restaurantId/categories', restaurantOwnerMiddleware, createCategory)

/**
 * @swagger
 * /owner/restaurants/{restaurantId}/categories/{categoryId}:
 *   put:
 *     tags: [Owner - Categories]
 *     summary: Cập nhật danh mục
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *   delete:
 *     tags: [Owner - Categories]
 *     summary: Xóa danh mục (chỉ xóa được khi danh mục không có món ăn)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: categoryId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       400:
 *         description: Danh mục vẫn còn món ăn
 */
router.put('/restaurants/:restaurantId/categories/:categoryId', restaurantOwnerMiddleware, updateCategory)
router.delete('/restaurants/:restaurantId/categories/:categoryId', restaurantOwnerMiddleware, deleteCategory)

// ═══════════════════════════════════════════════════════════════════
// E. DASHBOARD & THỐNG KÊ
// ═══════════════════════════════════════════════════════════════════

/**
 * @swagger
 * tags:
 *   name: Owner - Dashboard
 *   description: Chủ quán xem thống kê & dashboard
 */

/**
 * @swagger
 * /owner/restaurants/{restaurantId}/dashboard:
 *   get:
 *     tags: [Owner - Dashboard]
 *     summary: |
 *       Tổng quan dashboard: đơn hôm nay, doanh thu hôm nay, đơn tháng,
 *       doanh thu tháng, đơn đang chờ, đánh giá trung bình, tổng món ăn
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
 */
router.get('/restaurants/:restaurantId/dashboard', restaurantOwnerMiddleware, getDashboard)

/**
 * @swagger
 * /owner/restaurants/{restaurantId}/stats/revenue:
 *   get:
 *     tags: [Owner - Dashboard]
 *     summary: Thống kê doanh thu theo ngày/tháng/năm
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: integer
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
 *         description: "Đến ngày (VD: 2025-01-31)"
 *       - in: query
 *         name: groupBy
 *         schema:
 *           type: string
 *           enum: [day, month, year]
 *           default: day
 *         description: Nhóm theo ngày, tháng, hoặc năm
 *     responses:
 *       200:
 *         description: Thống kê doanh thu
 */
router.get('/restaurants/:restaurantId/stats/revenue', restaurantOwnerMiddleware, getRevenueStats)

/**
 * @swagger
 * /owner/restaurants/{restaurantId}/stats/top-foods:
 *   get:
 *     tags: [Owner - Dashboard]
 *     summary: Top món ăn bán chạy nhất
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số lượng top món muốn lấy
 *     responses:
 *       200:
 *         description: Danh sách top món bán chạy
 */
router.get('/restaurants/:restaurantId/stats/top-foods', restaurantOwnerMiddleware, getTopFoods)

/**
 * @swagger
 * /owner/restaurants/{restaurantId}/reviews:
 *   get:
 *     tags: [Owner - Dashboard]
 *     summary: Xem đánh giá của nhà hàng (có lọc theo số sao)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: restaurantId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: rating
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 5
 *         description: Lọc theo số sao
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
 *         description: Danh sách đánh giá
 */
router.get('/restaurants/:restaurantId/reviews', restaurantOwnerMiddleware, getRestaurantReviews)

export default router
