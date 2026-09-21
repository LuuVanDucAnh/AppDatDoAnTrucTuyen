import { Op } from 'sequelize'
import Orders from './orders.model.js'

export class OrdersRepository {
  async findAll({ limit, offset, sort, order, search }) {
    const where = {}

    const sortField = sort || 'id'
    const { count, rows } = await Orders.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortField, order || 'DESC']],
    })

    return { total: count, data: rows }
  }

  async findById(id) {
    return Orders.findByPk(id)
  }

  async create(data) {
    return Orders.create(data)
  }

  async update(id, data) {
    const [affectedRows] = await Orders.update(data, { where: { id } })
    if (affectedRows === 0) return null
    return this.findById(id)
  }

  async delete(id) {
    return Orders.destroy({ where: { id } })
  }

}
