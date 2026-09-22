import { ReviewsRepository } from './reviews.repository.js'
import Reviews from './reviews.model.js'
import Users from '../users/users.model.js'
import Orders from '../orders/orders.model.js'
import { sequelize } from '../../config/database.js'

const repo = new ReviewsRepository()

export class ReviewsService {
  async getAll(query) {
    return repo.findAll(query)
  }

  async getById(id) {
    const item = await repo.findById(id)
    if (!item) {
      const err = new Error('Không tìm thấy reviews')
      err.status = 404
      throw err
    }
    return item
  }

  async create(data) {
    return repo.create(data)
  }

  async update(id, data) {
    await this.getById(id) // throws 404 if not found
    return repo.update(id, data)
  }

  async delete(id) {
    await this.getById(id)
    return repo.delete(id)
  }

  async getRestaurantReviews(restaurantId, { page = 1, limit = 10 }) {
    const p = Math.max(1, parseInt(page) || 1)
    const l = Math.max(1, parseInt(limit) || 10)
    const offset = (p - 1) * l

    const { count, rows } = await Reviews.findAndCountAll({
      where: { restaurant_id: restaurantId },
      limit: l,
      offset,
      order: [['id', 'DESC']],
      include: [
        {
          model: Users,
          as: 'user',
          attributes: ['id', 'full_name'],
        },
      ],
    })

    const summary = await Reviews.findOne({
      where: { restaurant_id: restaurantId },
      attributes: [
        [sequelize.fn('ROUND', sequelize.fn('COALESCE', sequelize.fn('AVG', sequelize.col('rating')), 0), 1), 'average_rating'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_reviews'],
      ],
      raw: true,
    })

    return {
      restaurant_id: Number(restaurantId),
      average_rating: summary ? Number(summary.average_rating) : 0,
      total_reviews: summary ? Number(summary.total_reviews) : 0,
      total: count,
      data: rows,
    }
  }

  async createCustomerReview(userId, { restaurant_id, order_id, rating, comment }) {
    if (!order_id) {
      const err = new Error('order_id là bắt buộc')
      err.status = 400
      throw err
    }

    const order = await Orders.findOne({
      where: { id: order_id, user_id: userId },
    })

    if (!order) {
      const err = new Error('Không tìm thấy đơn hàng hoặc đơn hàng không thuộc về bạn')
      err.status = 404
      throw err
    }

    if (order.status !== 'DELIVERED') {
      const err = new Error('Chỉ có thể đánh giá sau khi đơn hàng đã giao thành công (trạng thái DELIVERED)')
      err.status = 400
      throw err
    }

    const existing = await Reviews.findOne({
      where: { user_id: userId, order_id },
    })
    if (existing) {
      const err = new Error('Bạn đã đánh giá đơn hàng này rồi')
      err.status = 409
      throw err
    }

    const targetRestaurantId = restaurant_id || order.restaurant_id
    const starRating = Math.min(5, Math.max(1, parseInt(rating) || 5))

    return Reviews.create({
      user_id: userId,
      restaurant_id: targetRestaurantId,
      order_id,
      rating: starRating,
      comment: comment || '',
    })
  }
}

