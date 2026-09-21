import { Op } from 'sequelize'
import Restaurants from './restaurants.model.js'

export class RestaurantsRepository {
  async findAll({ limit, offset, sort, order, search }) {
    const where = {}

    const sortField = sort || 'id'
    const { count, rows } = await Restaurants.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortField, order || 'DESC']],
    })

    return { total: count, data: rows }
  }

  async findById(id) {
    return Restaurants.findByPk(id)
  }

  async create(data) {
    return Restaurants.create(data)
  }

  async update(id, data) {
    const [affectedRows] = await Restaurants.update(data, { where: { id } })
    if (affectedRows === 0) return null
    return this.findById(id)
  }

  async delete(id) {
    return Restaurants.destroy({ where: { id } })
  }

}
