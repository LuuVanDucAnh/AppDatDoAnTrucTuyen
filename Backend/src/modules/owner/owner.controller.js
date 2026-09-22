import { OwnerService } from './owner.service.js'
import { sendSuccess, sendCreated, sendError } from '../../utils/response.js'
import { getPaginationMeta } from '../../utils/pagination.js'

const service = new OwnerService()

// ─────────────────────────────────────────────────────────────────
// A. QUẢN LÝ NHÀ HÀNG
// ─────────────────────────────────────────────────────────────────

export const getMyRestaurants = async (req, res, next) => {
  try {
    const data = await service.getMyRestaurants(req.user.id)
    sendSuccess(res, 'Lấy danh sách nhà hàng của bạn thành công', data)
  } catch (err) { next(err) }
}

export const updateRestaurantInfo = async (req, res, next) => {
  try {
    const data = await service.updateRestaurantInfo(req.restaurant, req.body)
    sendSuccess(res, 'Cập nhật thông tin nhà hàng thành công', data)
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status)
    next(err)
  }
}

export const toggleRestaurantStatus = async (req, res, next) => {
  try {
    const data = await service.toggleRestaurantStatus(req.restaurant)
    sendSuccess(res, `Nhà hàng đã chuyển sang trạng thái "${data.status}"`, data)
  } catch (err) { next(err) }
}

export const setRestaurantStatus = async (req, res, next) => {
  try {
    const { status } = req.body
    if (!status) return sendError(res, 'Vui lòng cung cấp trạng thái mới', 400)
    const data = await service.setRestaurantStatus(req.restaurant, status)
    sendSuccess(res, `Đã cập nhật trạng thái nhà hàng thành "${data.status}"`, data)
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status)
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────────
// B. QUẢN LÝ ĐƠN HÀNG
// ─────────────────────────────────────────────────────────────────

export const getRestaurantOrders = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query
    const restaurantId = req.params.restaurantId
    const result = await service.getRestaurantOrders(restaurantId, { status, page, limit })
    const meta = getPaginationMeta(result.total, result.page, result.limit)
    sendSuccess(res, 'Lấy danh sách đơn hàng thành công', result.data, meta)
  } catch (err) { next(err) }
}

export const getOrderDetail = async (req, res, next) => {
  try {
    const { restaurantId, orderId } = req.params
    const data = await service.getOrderDetail(restaurantId, orderId)
    sendSuccess(res, 'Lấy chi tiết đơn hàng thành công', data)
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status)
    next(err)
  }
}

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { restaurantId, orderId } = req.params
    const { status } = req.body
    if (!status) return sendError(res, 'Vui lòng cung cấp trạng thái mới', 400)
    const data = await service.updateOrderStatus(restaurantId, orderId, status)
    sendSuccess(res, `Đã cập nhật trạng thái đơn hàng thành "${status}"`, data)
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status)
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────────
// C. QUẢN LÝ MÓN ĂN
// ─────────────────────────────────────────────────────────────────

export const getRestaurantFoods = async (req, res, next) => {
  try {
    const { status, category_id, page, limit } = req.query
    const restaurantId = req.params.restaurantId
    const result = await service.getRestaurantFoods(restaurantId, { status, category_id, page, limit })
    const meta = getPaginationMeta(result.total, result.page, result.limit)
    sendSuccess(res, 'Lấy danh sách món ăn thành công', result.data, meta)
  } catch (err) { next(err) }
}

export const createFood = async (req, res, next) => {
  try {
    const restaurantId = req.params.restaurantId
    const data = await service.createFood(restaurantId, req.body)
    sendCreated(res, 'Thêm món ăn mới thành công', data)
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status)
    next(err)
  }
}

export const updateFood = async (req, res, next) => {
  try {
    const { restaurantId, foodId } = req.params
    const data = await service.updateFood(restaurantId, foodId, req.body)
    sendSuccess(res, 'Cập nhật món ăn thành công', data)
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status)
    next(err)
  }
}

export const toggleFoodStatus = async (req, res, next) => {
  try {
    const { restaurantId, foodId } = req.params
    const data = await service.toggleFoodStatus(restaurantId, foodId)
    sendSuccess(res, `Món ăn đã chuyển sang trạng thái "${data.status}"`, data)
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status)
    next(err)
  }
}

export const deleteFood = async (req, res, next) => {
  try {
    const { restaurantId, foodId } = req.params
    const data = await service.deleteFood(restaurantId, foodId)
    sendSuccess(res, data.message)
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status)
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────────
// D. QUẢN LÝ DANH MỤC
// ─────────────────────────────────────────────────────────────────

export const getRestaurantCategories = async (req, res, next) => {
  try {
    const restaurantId = req.params.restaurantId
    const data = await service.getRestaurantCategories(restaurantId)
    sendSuccess(res, 'Lấy danh sách danh mục thành công', data)
  } catch (err) { next(err) }
}

export const createCategory = async (req, res, next) => {
  try {
    const restaurantId = req.params.restaurantId
    const data = await service.createCategory(restaurantId, req.body)
    sendCreated(res, 'Tạo danh mục mới thành công', data)
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status)
    next(err)
  }
}

export const updateCategory = async (req, res, next) => {
  try {
    const { restaurantId, categoryId } = req.params
    const data = await service.updateCategory(restaurantId, categoryId, req.body)
    sendSuccess(res, 'Cập nhật danh mục thành công', data)
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status)
    next(err)
  }
}

export const deleteCategory = async (req, res, next) => {
  try {
    const { restaurantId, categoryId } = req.params
    const data = await service.deleteCategory(restaurantId, categoryId)
    sendSuccess(res, data.message)
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status)
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────────
// E. DASHBOARD & THỐNG KÊ
// ─────────────────────────────────────────────────────────────────

export const getDashboard = async (req, res, next) => {
  try {
    const restaurantId = req.params.restaurantId
    const data = await service.getDashboard(restaurantId)
    sendSuccess(res, 'Lấy thông tin dashboard thành công', data)
  } catch (err) { next(err) }
}

export const getRevenueStats = async (req, res, next) => {
  try {
    const { restaurantId } = req.params
    const { from, to, groupBy } = req.query
    const data = await service.getRevenueStats(restaurantId, { from, to, groupBy })
    sendSuccess(res, 'Lấy thống kê doanh thu thành công', data)
  } catch (err) { next(err) }
}

export const getTopFoods = async (req, res, next) => {
  try {
    const { restaurantId } = req.params
    const { limit } = req.query
    const data = await service.getTopFoods(restaurantId, limit)
    sendSuccess(res, 'Lấy top món ăn bán chạy thành công', data)
  } catch (err) { next(err) }
}

export const getRestaurantReviews = async (req, res, next) => {
  try {
    const { restaurantId } = req.params
    const { page, limit, rating } = req.query
    const result = await service.getRestaurantReviews(restaurantId, { page, limit, rating })
    const meta = getPaginationMeta(result.total, result.page, result.limit)
    sendSuccess(res, 'Lấy đánh giá nhà hàng thành công', result.data, meta)
  } catch (err) { next(err) }
}
