import { CartsService } from './carts.service.js'
import { sendSuccess, sendCreated, sendError } from '../../utils/response.js'
import { getPagination, getPaginationMeta } from '../../utils/pagination.js'
import { createCartsSchema, updateCartsSchema } from './carts.validation.js'

const service = new CartsService()

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

