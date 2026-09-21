import jwt from 'jsonwebtoken'
import { sendError } from '../utils/response.js'

export const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return sendError(res, 'Không có token xác thực', 401)
    }

    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Token đã hết hạn', 401)
    }
    return sendError(res, 'Token không hợp lệ', 401)
  }
}
