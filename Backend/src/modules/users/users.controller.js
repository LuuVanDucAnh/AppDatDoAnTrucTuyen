import { UsersService } from './users.service.js'
import { sendSuccess, sendCreated, sendError } from '../../utils/response.js'
import { getPagination, getPaginationMeta } from '../../utils/pagination.js'
import { createUsersSchema, updateUsersSchema, loginSchema } from './users.validation.js'

const service = new UsersService()

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
    const { error, value } = createUsersSchema.validate(req.body)
    if (error) return sendError(res, error.details[0].message, 400)
    const data = await service.create(value)
    sendCreated(res, 'Tạo thành công', data)
  } catch (err) { next(err) }
}

export const update = async (req, res, next) => {
  try {
    const { error, value } = updateUsersSchema.validate(req.body)
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

export const login = async (req, res, next) => {
  try {
    const { error, value } = loginSchema.validate(req.body)
    if (error) return sendError(res, error.details[0].message, 400)
    const data = await service.login(value.email, value.password)
    sendSuccess(res, 'Đăng nhập thành công', data)
  } catch (err) { next(err) }
}

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) return sendError(res, 'Thiếu refresh token', 400)
    const data = await service.refresh(refreshToken)
    sendSuccess(res, 'Làm mới token thành công', data)
  } catch (err) { next(err) }
}

export const getMe = async (req, res, next) => {
  try {
    const data = await service.getById(req.user.id)
    sendSuccess(res, 'Lấy thông tin thành công', data)
  } catch (err) { next(err) }
}
