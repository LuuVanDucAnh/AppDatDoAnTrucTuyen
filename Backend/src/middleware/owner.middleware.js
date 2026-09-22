import { sendError } from '../utils/response.js'
import Restaurants from '../modules/restaurants/restaurants.model.js'

/**
 * Middleware: Chỉ cho phép user có role 'OWNER' truy cập
 */
export const ownerMiddleware = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Chưa xác thực, vui lòng đăng nhập', 401)
  }
  if (req.user.role !== 'OWNER') {
    return sendError(res, 'Chỉ chủ quán mới có quyền thực hiện thao tác này', 403)
  }
  next()
}

/**
 * Middleware: Kiểm tra chủ quán có quyền sở hữu nhà hàng `:restaurantId`
 * Gắn `req.restaurant` vào request để controller dùng lại
 */
export const restaurantOwnerMiddleware = async (req, res, next) => {
  try {
    const restaurantId = req.params.restaurantId || req.params.id
    const restaurant = await Restaurants.findByPk(restaurantId)

    if (!restaurant) {
      return sendError(res, 'Không tìm thấy nhà hàng', 404)
    }

    if (restaurant.owner_id !== req.user.id) {
      return sendError(res, 'Bạn không có quyền quản lý nhà hàng này', 403)
    }

    req.restaurant = restaurant
    next()
  } catch (err) {
    next(err)
  }
}
