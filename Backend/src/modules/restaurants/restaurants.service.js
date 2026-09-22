import { Op } from 'sequelize'
import { sequelize } from '../../config/database.js'
import { RestaurantsRepository } from './restaurants.repository.js'
import Restaurants from './restaurants.model.js'
import Categories from '../categories/categories.model.js'
import Foods from '../foods/foods.model.js'
import Reviews from '../reviews/reviews.model.js'

const repo = new RestaurantsRepository()

export class RestaurantsService {
  async getAll(query) {
    return repo.findAll(query)
  }

  async getActiveRestaurants({ limit = 20, offset = 0, search }) {
    const where = { status: 'OPEN' }
    if (search) {
      where.name = { [Op.like]: `%${search}%` }
    }

    const { count, rows } = await Restaurants.findAndCountAll({
      where,
      limit,
      offset,
      order: [['id', 'DESC']],
      include: [
        {
          model: Reviews,
          as: 'reviews',
          attributes: [],
        },
      ],
      attributes: {
        include: [
          [sequelize.fn('ROUND', sequelize.fn('COALESCE', sequelize.fn('AVG', sequelize.col('reviews.rating')), 0), 1), 'average_rating'],
          [sequelize.fn('COUNT', sequelize.col('reviews.id')), 'total_reviews'],
        ],
      },
      group: ['restaurants.id'],
      subQuery: false,
    })

    const total = Array.isArray(count) ? count.length : count
    return { total, data: rows }
  }

  async getRestaurantMenu(id) {
    const restaurant = await this.getById(id)
    const categories = await Categories.findAll({
      where: { restaurant_id: id },
      include: [
        {
          model: Foods,
          as: 'foods',
          where: { status: 'AVAILABLE' },
          required: false,
        },
      ],
      order: [['id', 'ASC'], [{ model: Foods, as: 'foods' }, 'id', 'ASC']],
    })

    // Get rating summary
    const ratingData = await Reviews.findOne({
      where: { restaurant_id: id },
      attributes: [
        [sequelize.fn('ROUND', sequelize.fn('COALESCE', sequelize.fn('AVG', sequelize.col('rating')), 0), 1), 'average_rating'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_reviews'],
      ],
      raw: true,
    })

    return {
      ...restaurant.toJSON(),
      average_rating: ratingData ? Number(ratingData.average_rating) : 0,
      total_reviews: ratingData ? Number(ratingData.total_reviews) : 0,
      categories,
    }
  }

  async getById(id) {
    const item = await repo.findById(id)
    if (!item) {
      const err = new Error('Không tìm thấy restaurants')
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

}
