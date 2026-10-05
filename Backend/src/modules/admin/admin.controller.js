import { AdminService } from './admin.service.js'
import { sendSuccess, sendCreated, sendError } from '../../utils/response.js'
import { getPaginationMeta } from '../../utils/pagination.js'

const service = new AdminService()

// ─────────────────────────────────────────────────────────────────
// A. DASHBOARD & THỐNG KÊ TOÀN SÀN
// ─────────────────────────────────────────────────────────────────

export const getPlatformDashboard = async (req, res, next) => {
  try {
    const data = await service.getPlatformDashboard()
    sendSuccess(res, 'Lấy tổng quan hệ thống thành công', data)
  } catch (err) { next(err) }
}

export const getPlatformRevenueStats = async (req, res, next) => {
  try {
    const { from, to, groupBy } = req.query
    const data = await service.getPlatformRevenueStats({ from, to, groupBy })
    sendSuccess(res, 'Lấy thống kê doanh thu thành công', data)
  } catch (err) { next(err) }
}

export const getTopRestaurants = async (req, res, next) => {
  try {
    const { limit, sortBy } = req.query
    const data = await service.getTopRestaurants({ limit, sortBy })
    sendSuccess(res, 'Lấy top nhà hàng thành công', data)
  } catch (err) { next(err) }
}

// ─────────────────────────────────────────────────────────────────
// B. QUẢN LÝ NGƯỜI DÙNG
// ─────────────────────────────────────────────────────────────────

export const getUsers = async (req, res, next) => {
  try {
    const { search, role, status, page, limit } = req.query
    const result = await service.getUsers({ search, role, status, page, limit })
    const meta = getPaginationMeta(result.total, result.page, result.limit)
    sendSuccess(res, 'Lấy danh sách người dùng thành công', result.data, meta)
  } catch (err) { next(err) }
}

export const getUserDetail = async (req, res, next) => {
  try {
    const data = await service.getUserDetail(req.params.userId)
    sendSuccess(res, 'Lấy thông tin người dùng thành công', data)
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status)
    next(err)
  }
}

export const toggleUserStatus = async (req, res, next) => {
  try {
    const data = await service.toggleUserStatus(req.params.userId)
    sendSuccess(res, data.message, data)
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status)
    next(err)
  }
}

export const changeUserRole = async (req, res, next) => {
  try {
    const { role } = req.body
    if (!role) return sendError(res, 'Vui lòng cung cấp role mới', 400)
    const data = await service.changeUserRole(req.params.userId, role)
    sendSuccess(res, `Đã thay đổi role thành "${role}" thành công`, data)
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status)
    next(err)
  }
}

export const createUser = async (req, res, next) => {
  try {
    const data = await service.createUser(req.body)
    sendCreated(res, 'Tạo tài khoản người dùng thành công', data)
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status)
    next(err)
  }
}

export const updateUser = async (req, res, next) => {
  try {
    const data = await service.updateUser(req.params.userId, req.body)
    sendSuccess(res, 'Cập nhật người dùng thành công', data)
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status)
    next(err)
  }
}

export const deleteUser = async (req, res, next) => {
  try {
    const data = await service.deleteUser(req.params.userId)
    sendSuccess(res, data.message)
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status)
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────────
// C. QUẢN LÝ NHÀ HÀNG
// ─────────────────────────────────────────────────────────────────

export const getRestaurants = async (req, res, next) => {
  try {
    const { search, status, page, limit } = req.query
    const result = await service.getRestaurants({ search, status, page, limit })
    const meta = getPaginationMeta(result.total, result.page, result.limit)
    sendSuccess(res, 'Lấy danh sách nhà hàng thành công', result.data, meta)
  } catch (err) { next(err) }
}

export const getRestaurantDetail = async (req, res, next) => {
  try {
    const data = await service.getRestaurantDetail(req.params.restaurantId)
    sendSuccess(res, 'Lấy thông tin nhà hàng thành công', data)
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status)
    next(err)
  }
}

export const setRestaurantStatus = async (req, res, next) => {
  try {
    const { status } = req.body
    if (!status) return sendError(res, 'Vui lòng cung cấp trạng thái mới', 400)
    const data = await service.setRestaurantStatus(req.params.restaurantId, status)
    sendSuccess(res, `Đã cập nhật trạng thái nhà hàng thành "${status}"`, data)
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status)
    next(err)
  }
}

export const createRestaurant = async (req, res, next) => {
  try {
    const data = await service.createRestaurant(req.body)
    sendCreated(res, 'Tạo nhà hàng thành công', data)
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status)
    next(err)
  }
}

export const updateRestaurant = async (req, res, next) => {
  try {
    const data = await service.updateRestaurant(req.params.restaurantId, req.body)
    sendSuccess(res, 'Cập nhật thông tin nhà hàng thành công', data)
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status)
    next(err)
  }
}

export const deleteRestaurant = async (req, res, next) => {
  try {
    const data = await service.deleteRestaurant(req.params.restaurantId)
    sendSuccess(res, data.message)
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status)
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────────
// D. QUẢN LÝ ĐƠN HÀNG
// ─────────────────────────────────────────────────────────────────

export const getAllOrders = async (req, res, next) => {
  try {
    const { search, status, restaurant_id, from, to, page, limit } = req.query
    const result = await service.getAllOrders({ search, status, restaurant_id, from, to, page, limit })
    const meta = getPaginationMeta(result.total, result.page, result.limit)
    sendSuccess(res, 'Lấy danh sách đơn hàng thành công', result.data, meta)
  } catch (err) { next(err) }
}

export const getOrderDetail = async (req, res, next) => {
  try {
    const data = await service.getOrderDetail(req.params.orderId)
    sendSuccess(res, 'Lấy chi tiết đơn hàng thành công', data)
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status)
    next(err)
  }
}

export const forceUpdateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body
    if (!status) return sendError(res, 'Vui lòng cung cấp trạng thái mới', 400)
    const data = await service.forceUpdateOrderStatus(req.params.orderId, status)
    sendSuccess(res, `Đã cập nhật trạng thái đơn hàng thành "${status}"`, data)
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status)
    next(err)
  }
}

export const deleteOrder = async (req, res, next) => {
  try {
    const data = await service.deleteOrder(req.params.orderId)
    sendSuccess(res, data.message)
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status)
    next(err)
  }
}

// ─────────────────────────────────────────────────────────────────
// E. QUẢN LÝ THANH TOÁN
// ─────────────────────────────────────────────────────────────────

export const getAllPayments = async (req, res, next) => {
  try {
    const { payment_method, status, from, to, page, limit } = req.query
    const result = await service.getAllPayments({ payment_method, status, from, to, page, limit })
    const meta = getPaginationMeta(result.total, result.page, result.limit)
    sendSuccess(res, 'Lấy danh sách thanh toán thành công', result.data, meta)
  } catch (err) { next(err) }
}

// ─────────────────────────────────────────────────────────────────
// F. QUẢN LÝ ĐÁNH GIÁ
// ─────────────────────────────────────────────────────────────────

export const getAllReviews = async (req, res, next) => {
  try {
    const { search, restaurant_id, rating, page, limit } = req.query
    const result = await service.getAllReviews({ search, restaurant_id, rating, page, limit })
    const meta = getPaginationMeta(result.total, result.page, result.limit)
    sendSuccess(res, 'Lấy danh sách đánh giá thành công', result.data, meta)
  } catch (err) { next(err) }
}

export const deleteReview = async (req, res, next) => {
  try {
    const data = await service.deleteReview(req.params.reviewId)
    sendSuccess(res, data.message)
  } catch (err) {
    if (err.status) return sendError(res, err.message, err.status)
    next(err)
  }
}
