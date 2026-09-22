import { OrdersService } from './orders.service.js'
import { sendSuccess, sendCreated, sendError } from '../../utils/response.js'
import { getPagination, getPaginationMeta } from '../../utils/pagination.js'
import { createOrdersSchema, updateOrdersSchema } from './orders.validation.js'

const service = new OrdersService()

export const checkout = async (req, res, next) => {
  try {
    const { address_id, payment_method, note } = req.body
    const data = await service.checkout(req.user.id, { address_id, payment_method, note })
    sendCreated(res, 'Đặt hàng thành công', data)
  } catch (err) {
    if (err.status) {
      return sendError(res, err.message, err.status)
    }
    next(err)
  }
}

export const getMyOrders = async (req, res, next) => {
  try {
    const { status, page, limit } = req.query
    const { total, data } = await service.getMyOrders(req.user.id, { status, page, limit })
    const p = Math.max(1, parseInt(page) || 1)
    const l = Math.max(1, parseInt(limit) || 10)
    const meta = getPaginationMeta(total, p, l)
    sendSuccess(res, 'Lấy lịch sử đơn hàng thành công', data, meta)
  } catch (err) { next(err) }
}

export const getOrderDetail = async (req, res, next) => {
  try {
    const data = await service.getOrderDetail(req.user.id, req.params.id)
    sendSuccess(res, 'Lấy chi tiết đơn hàng thành công', data)
  } catch (err) {
    if (err.status) {
      return sendError(res, err.message, err.status)
    }
    next(err)
  }
}

export const cancelOrder = async (req, res, next) => {
  try {
    const data = await service.cancelOrder(req.user.id, req.params.id)
    sendSuccess(res, 'Hủy đơn hàng thành công', data)
  } catch (err) {
    if (err.status) {
      return sendError(res, err.message, err.status)
    }
    next(err)
  }
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
    const { error, value } = createOrdersSchema.validate(req.body)
    if (error) return sendError(res, error.details[0].message, 400)
    const data = await service.create(value)
    sendCreated(res, 'Tạo thành công', data)
  } catch (err) { next(err) }
}

export const update = async (req, res, next) => {
  try {
    const { error, value } = updateOrdersSchema.validate(req.body)
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

