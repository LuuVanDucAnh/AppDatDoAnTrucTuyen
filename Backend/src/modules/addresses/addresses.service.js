import { AddressesRepository } from './addresses.repository.js'
import Addresses from './addresses.model.js'
import { sequelize } from '../../config/database.js'

const repo = new AddressesRepository()

export class AddressesService {
  async getAll(query) {
    return repo.findAll(query)
  }

  async getById(id) {
    const item = await repo.findById(id)
    if (!item) {
      const err = new Error('Không tìm thấy addresses')
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

  async getMyAddresses(userId) {
    return Addresses.findAll({
      where: { user_id: userId },
      order: [['is_default', 'DESC'], ['id', 'DESC']],
    })
  }

  async createAddress(userId, data) {
    return sequelize.transaction(async (t) => {
      // If setting this as default, unset others
      if (data.is_default) {
        await Addresses.update(
          { is_default: false },
          { where: { user_id: userId }, transaction: t }
        )
      } else {
        // If this is the user's first address, make it default automatically
        const count = await Addresses.count({ where: { user_id: userId }, transaction: t })
        if (count === 0) {
          data.is_default = true
        }
      }

      return Addresses.create({ ...data, user_id: userId }, { transaction: t })
    })
  }

  async setDefault(userId, addressId) {
    const address = await Addresses.findOne({
      where: { id: addressId, user_id: userId },
    })

    if (!address) {
      const err = new Error('Không tìm thấy địa chỉ hoặc không thuộc về bạn')
      err.status = 404
      throw err
    }

    return sequelize.transaction(async (t) => {
      await Addresses.update(
        { is_default: false },
        { where: { user_id: userId }, transaction: t }
      )
      address.is_default = true
      await address.save({ transaction: t })
      return address
    })
  }
}

