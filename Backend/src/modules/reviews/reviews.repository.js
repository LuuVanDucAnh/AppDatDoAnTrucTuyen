import { Op } from 'sequelize'
import Reviews from './reviews.model.js'

export class ReviewsRepository {
  async findAll({ limit, offset, sort, order, search }) {
    const where = {}

    const sortField = sort || 'id'
    const { count, rows } = await Reviews.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortField, order || 'DESC']],
    })

    return { total: count, data: rows }
  }

  async findById(id) {
    return Reviews.findByPk(id)
  }

  async create(data) {
    return Reviews.create(data)
  }

  async update(id, data) {
    const [affectedRows] = await Reviews.update(data, { where: { id } })
    if (affectedRows === 0) return null
    return this.findById(id)
  }

  async delete(id) {
    return Reviews.destroy({ where: { id } })
  }

}
