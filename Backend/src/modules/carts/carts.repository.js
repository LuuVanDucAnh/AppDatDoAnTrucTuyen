import { Op } from 'sequelize'
import Carts from './carts.model.js'

export class CartsRepository {
  async findAll({ limit, offset, sort, order, search }) {
    const where = {}

    const sortField = sort || 'id'
    const { count, rows } = await Carts.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortField, order || 'DESC']],
    })

    return { total: count, data: rows }
  }

  async findById(id) {
    return Carts.findByPk(id)
  }

  async create(data) {
    return Carts.create(data)
  }

  async update(id, data) {
    const [affectedRows] = await Carts.update(data, { where: { id } })
    if (affectedRows === 0) return null
    return this.findById(id)
  }

  async delete(id) {
    return Carts.destroy({ where: { id } })
  }

}
