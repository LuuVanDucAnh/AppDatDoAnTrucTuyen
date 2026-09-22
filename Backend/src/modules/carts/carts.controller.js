import { CartsService } from './carts.service.js'
import { sendSuccess, sendCreated, sendError } from '../../utils/response.js'
import { getPagination, getPaginationMeta } from '../../utils/pagination.js'
import { createCartsSchema, updateCartsSchema } from './carts.validation.js'

const service = new CartsService()

export const getMyCart = async (req, res, next) => {
  try {
    const data = await service.getMyCart(req.user.id)
    sendSuccess(res, 'Lấy giỏ hàng thành công', data)
  } catch (err) { next(err) }
}

export const addItem = async (req, res, next) => {
  try {
    const { food_id, quantity, note, force_replace } = req.body
    if (!food_id) return sendError(res, 'food_id là bắt buộc', 400)
    const data = await service.addItem(req.user.id, { food_id, quantity, note, force_replace })
    sendSuccess(res, 'Thêm món vào giỏ hàng thành công', data)
  } catch (err) {
    if (err.status) {
      return sendError(res, err.message, err.status, err.errors)
    }
    next(err)
  }
}

export const updateItem = async (req, res, next) => {
  try {
    const { quantity, note } = req.body
    const data = await service.updateItemQuantity(req.user.id, req.params.id, { quantity, note })
    sendSuccess(res, 'Cập nhật món trong giỏ hàng thành công', data)
  } catch (err) {
    if (err.status) {
      return sendError(res, err.message, err.status)
    }
    next(err)
  }
}

export const removeItem = async (req, res, next) => {
  try {
    const data = await service.removeItem(req.user.id, req.params.id)
    sendSuccess(res, 'Xóa món khỏi giỏ hàng thành công', data)
  } catch (err) {
    if (err.status) {
      return sendError(res, err.message, err.status)
    }
    next(err)
  }
}

export const clearCart = async (req, res, next) => {
  try {
    const data = await service.clearCart(req.user.id)
    sendSuccess(res, 'Đã làm trống giỏ hàng', data)
  } catch (err) { next(err) }
}

export const getAll = async (req, res, next) => {
  try {
    const pagination = getPagination(req.query)
    const { total, data } = await service.getAll({ ...pagination, search: req.query.search })
    const meta = getPaginationMeta(total, pagination.page, pagination.limit)
    sendSuccess(res, 'Lấy danh sách thành công', data, meta)
  } catch (err) { next(err) }
}

export const getById = async (req, res, next) => {
  try {
    const data = await service.getById(req.params.id)
    sendSuccess(res, 'Lấy thông tin thành công', data)
  } catch (err) { next(err) }
}

export const create = async (req, res, next) => {
  try {
    const { error, value } = createCartsSchema.validate(req.body)
    if (error) return sendError(res, error.details[0].message, 400)
    const data = await service.create(value)
    sendCreated(res, 'Tạo thành công', data)
  } catch (err) { next(err) }
}

export const update = async (req, res, next) => {
  try {
    const { error, value } = updateCartsSchema.validate(req.body)
    if (error) return sendError(res, error.details[0].message, 400)
    const data = await service.update(req.params.id, value)
    sendSuccess(res, 'Cập nhật thành công', data)
  } catch (err) { next(err) }
}

export const remove = async (req, res, next) => {
  try {
    await service.delete(req.params.id)
    sendSuccess(res, 'Xóa thành công')
  } catch (err) { next(err) }
}

