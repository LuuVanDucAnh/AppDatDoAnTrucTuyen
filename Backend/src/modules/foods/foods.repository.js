import { Op } from 'sequelize'
import Foods from './foods.model.js'

export class FoodsRepository {
  async findAll({ limit, offset, sort, order, search }) {
    const where = {}

    const sortField = sort || 'id'
    const { count, rows } = await Foods.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortField, order || 'DESC']],
    })

    return { total: count, data: rows }
  }

  async findById(id) {
    return Foods.findByPk(id)
  }

  async create(data) {
    return Foods.create(data)
  }

  async update(id, data) {
    const [affectedRows] = await Foods.update(data, { where: { id } })
    if (affectedRows === 0) return null
    return this.findById(id)
  }

  async delete(id) {
    return Foods.destroy({ where: { id } })
  }

}
