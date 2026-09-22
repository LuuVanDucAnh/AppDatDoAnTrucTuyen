import { ReviewsService } from './reviews.service.js'
import { sendSuccess, sendCreated, sendError } from '../../utils/response.js'
import { getPagination, getPaginationMeta } from '../../utils/pagination.js'
import { createReviewsSchema, updateReviewsSchema } from './reviews.validation.js'

const service = new ReviewsService()

export const getByRestaurant = async (req, res, next) => {
  try {
    const { page, limit } = req.query
    const data = await service.getRestaurantReviews(req.params.restaurant_id, { page, limit })
    const p = Math.max(1, parseInt(page) || 1)
    const l = Math.max(1, parseInt(limit) || 10)
    const meta = getPaginationMeta(data.total, p, l)
    sendSuccess(res, 'Lấy danh sách đánh giá của quán thành công', data, meta)
  } catch (err) { next(err) }
}

export const createCustomerReview = async (req, res, next) => {
  try {
    const { restaurant_id, order_id, rating, comment } = req.body
    const data = await service.createCustomerReview(req.user.id, {
      restaurant_id,
      order_id,
      rating,
      comment,
    })
    sendCreated(res, 'Gửi đánh giá thành công', data)
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
    const { error, value } = createReviewsSchema.validate(req.body)
    if (error) return sendError(res, error.details[0].message, 400)
    const data = await service.create(value)
    sendCreated(res, 'Tạo thành công', data)
  } catch (err) { next(err) }
}

export const update = async (req, res, next) => {
  try {
    const { error, value } = updateReviewsSchema.validate(req.body)
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

