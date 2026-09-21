import { logger } from '../utils/logger.js'

// eslint-disable-next-line no-unused-vars
export const errorMiddleware = (err, req, res, next) => {
  logger.error(`${err.message}`, { stack: err.stack, url: req.url, method: req.method })

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Dữ liệu không hợp lệ',
      errors: err.errors.map((e) => ({ field: e.path, message: e.message })),
    })
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(409).json({
      success: false,
      message: 'Dữ liệu đã tồn tại',
      errors: err.errors.map((e) => ({ field: e.path, message: e.message })),
    })
  }

  const status = err.status || err.statusCode || 500
  res.status(status).json({
    success: false,
    message: err.message || 'Lỗi server nội bộ',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  })
}
