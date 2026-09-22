import { sendError } from '../utils/response.js'

/**
 * Middleware: Chỉ cho phép user có role 'ADMIN' truy cập
 */
export const adminMiddleware = (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Chưa xác thực, vui lòng đăng nhập', 401)
  }
  if (req.user.role !== 'ADMIN') {
    return sendError(res, 'Bạn không có quyền truy cập tính năng quản trị', 403)
  }
  next()
}
