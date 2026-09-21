import { Op } from 'sequelize'
import Addresses from './addresses.model.js'

export class AddressesRepository {
  async findAll({ limit, offset, sort, order, search }) {
    const where = {}

    const sortField = sort || 'id'
    const { count, rows } = await Addresses.findAndCountAll({
      where,
      limit,
      offset,
      order: [[sortField, order || 'DESC']],
    })

    return { total: count, data: rows }
  }

  async findById(id) {
    return Addresses.findByPk(id)
  }

  async create(data) {
    return Addresses.create(data)
  }

  async update(id, data) {
    const [affectedRows] = await Addresses.update(data, { where: { id } })
    if (affectedRows === 0) return null
    return this.findById(id)
  }

  async delete(id) {
    return Addresses.destroy({ where: { id } })
  }

}
