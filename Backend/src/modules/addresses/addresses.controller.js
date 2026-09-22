import { AddressesService } from './addresses.service.js'
import { sendSuccess, sendCreated, sendError } from '../../utils/response.js'
import { getPagination, getPaginationMeta } from '../../utils/pagination.js'
import { createAddressesSchema, updateAddressesSchema } from './addresses.validation.js'

const service = new AddressesService()

export const getMyAddresses = async (req, res, next) => {
  try {
    const data = await service.getMyAddresses(req.user.id)
    sendSuccess(res, 'Lấy danh sách địa chỉ thành công', data)
  } catch (err) { next(err) }
}

export const createMyAddress = async (req, res, next) => {
  try {
    const { error, value } = createAddressesSchema.validate(req.body)
    if (error) return sendError(res, error.details[0].message, 400)
    const data = await service.createAddress(req.user.id, value)
    sendCreated(res, 'Thêm địa chỉ mới thành công', data)
  } catch (err) { next(err) }
}

export const setDefault = async (req, res, next) => {
  try {
    const data = await service.setDefault(req.user.id, req.params.id)
    sendSuccess(res, 'Đặt địa chỉ mặc định thành công', data)
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
    const { error, value } = createAddressesSchema.validate(req.body)
    if (error) return sendError(res, error.details[0].message, 400)
    const data = await service.create(value)
    sendCreated(res, 'Tạo thành công', data)
  } catch (err) { next(err) }
}

export const update = async (req, res, next) => {
  try {
    const { error, value } = updateAddressesSchema.validate(req.body)
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

