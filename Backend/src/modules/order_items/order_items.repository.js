import { Op } from 'sequelize'
import OrderItems from './order_items.model.js'

export class OrderItemsRepository {
  async findAll({ limit, offset, sort, order, search }) {
    const where = {}

    const sortField = sort || 'id'
    const { count, rows } = await OrderItems.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortField, order || 'DESC']],
    })

    return { total: count, data: rows }
  }

  async findById(id) {
    return OrderItems.findByPk(id)
  }

  async create(data) {
    return OrderItems.create(data)
  }

  async update(id, data) {
    const [affectedRows] = await OrderItems.update(data, { where: { id } })
    if (affectedRows === 0) return null
    return this.findById(id)
  }

  async delete(id) {
    return OrderItems.destroy({ where: { id } })
  }

}
