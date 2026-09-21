import { Op } from 'sequelize'
import CartItems from './cart_items.model.js'

export class CartItemsRepository {
  async findAll({ limit, offset, sort, order, search }) {
    const where = {}

    const sortField = sort || 'id'
    const { count, rows } = await CartItems.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortField, order || 'DESC']],
    })

    return { total: count, data: rows }
  }

  async findById(id) {
    return CartItems.findByPk(id)
  }

  async create(data) {
    return CartItems.create(data)
  }

  async update(id, data) {
    const [affectedRows] = await CartItems.update(data, { where: { id } })
    if (affectedRows === 0) return null
    return this.findById(id)
  }

  async delete(id) {
    return CartItems.destroy({ where: { id } })
  }

}
