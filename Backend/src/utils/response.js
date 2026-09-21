export const sendSuccess = (res, message = 'Thành công', data = null, meta = null, statusCode = 200) => {
  const response = { success: true, message, data }
  if (meta) response.meta = meta
  return res.status(statusCode).json(response)
}

export const sendError = (res, message = 'Có lỗi xảy ra', statusCode = 400, errors = null) => {
  const response = { success: false, message }
  if (errors) response.errors = errors
  return res.status(statusCode).json(response)
}

export const sendCreated = (res, message = 'Tạo thành công', data = null) =>
  sendSuccess(res, message, data, null, 201)

export const sendNotFound = (res, message = 'Không tìm thấy') =>
  sendError(res, message, 404)

export const sendUnauthorized = (res, message = 'Không có quyền truy cập') =>
  sendError(res, message, 401)

export const sendForbidden = (res, message = 'Bị từ chối truy cập') =>
  sendError(res, message, 403)
