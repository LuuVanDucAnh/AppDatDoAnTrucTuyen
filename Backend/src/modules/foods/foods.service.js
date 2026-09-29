import { Op } from 'sequelize'
import { FoodsRepository } from './foods.repository.js'
import Foods from './foods.model.js'
import Categories from '../categories/categories.model.js'
import Restaurants from '../restaurants/restaurants.model.js'
import OrderItems from '../order_items/order_items.model.js'
import { sequelize } from '../../config/database.js'

const repo = new FoodsRepository()

export class FoodsService {
  async getAll(query) {
    return repo.findAll(query)
  }

  /**
   * Món bán chạy: các món AVAILABLE của nhà hàng đang OPEN,
   * sắp xếp theo tổng số lượng đã bán (order_items) giảm dần.
   */
  async getFeatured({ limit = 10 } = {}) {
    const l = Math.min(50, Math.max(1, parseInt(limit) || 10))

    // Tổng số lượng đã bán của từng món
    const sold = await OrderItems.findAll({
      attributes: ['food_id', [sequelize.fn('SUM', sequelize.col('quantity')), 'sold']],
      group: ['food_id'],
      raw: true,
    })
    const soldByFood = new Map(sold.map((s) => [Number(s.food_id), Number(s.sold)]))

    const foods = await Foods.findAll({
      where: { status: 'AVAILABLE' },
      include: [
        {
          model: Categories,
          as: 'category',
          attributes: ['id', 'name', 'restaurant_id'],
          required: true,
          include: [
            {
              model: Restaurants,
              as: 'restaurant',
              attributes: ['id', 'name', 'image', 'address', 'status'],
              where: { status: { [Op.ne]: 'CLOSED' } },
              required: true,
            },
          ],
        },
      ],
    })

    const data = foods
      .map((f) => {
        const json = f.toJSON()
        json.sold_quantity = soldByFood.get(f.id) || 0
        return json
      })
      .sort((a, b) => b.sold_quantity - a.sold_quantity || a.id - b.id)
      .slice(0, l)

    return { total: data.length, data }
  }

  async getById(id) {
    const item = await repo.findById(id)
    if (!item) {
      const err = new Error('Không tìm thấy foods')
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
