import { Op } from 'sequelize'
import { sequelize } from '../../config/database.js'
import { OrdersRepository } from './orders.repository.js'
import Orders from './orders.model.js'
import OrderItems from '../order_items/order_items.model.js'
import Carts from '../carts/carts.model.js'
import CartItems from '../cart_items/cart_items.model.js'
import Foods from '../foods/foods.model.js'
import Categories from '../categories/categories.model.js'
import Restaurants from '../restaurants/restaurants.model.js'
import Addresses from '../addresses/addresses.model.js'
import Payments from '../payments/payments.model.js'

const repo = new OrdersRepository()

export class OrdersService {
  async getAll(query) {
    return repo.findAll(query)
  }

  async getById(id) {
    const item = await repo.findById(id)
    if (!item) {
      const err = new Error('Không tìm thấy orders')
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

  async checkout(userId, { address_id, payment_method = 'CASH', note = '' }) {
    if (!address_id) {
      const err = new Error('Vui lòng chọn địa chỉ nhận hàng')
      err.status = 400
      throw err
    }

    const address = await Addresses.findOne({
      where: { id: address_id, user_id: userId },
    })
    if (!address) {
      const err = new Error('Địa chỉ giao hàng không hợp lệ hoặc không thuộc về bạn')
      err.status = 404
      throw err
    }

    const cart = await Carts.findOne({ where: { user_id: userId } })
    if (!cart) {
      const err = new Error('Giỏ hàng trống')
      err.status = 400
      throw err
    }

    const cartItems = await CartItems.findAll({
      where: { cart_id: cart.id },
      include: [
        {
          model: Foods,
          as: 'food',
          include: [{ model: Categories, as: 'category' }],
        },
      ],
    })

    if (cartItems.length === 0) {
      const err = new Error('Giỏ hàng trống, không thể đặt hàng')
      err.status = 400
      throw err
    }

    const restaurantId = cartItems[0].food?.category?.restaurant_id
    if (!restaurantId) {
      const err = new Error('Không xác định được nhà hàng cho đơn hàng này')
      err.status = 400
      throw err
    }

    let food_total = 0
    for (const ci of cartItems) {
      if (!ci.food || ci.food.status !== 'AVAILABLE') {
        const err = new Error(`Món "${ci.food?.name || 'món ăn'}" hiện tại đã hết hàng. Vui lòng cập nhật giỏ hàng.`)
        err.status = 400
        throw err
      }
      food_total += Number(ci.food.price) * ci.quantity
    }

    const delivery_fee = 15000 // 15.000 VNĐ cố định
    const discount = 0
    const total_amount = food_total + delivery_fee - discount

    const newOrder = await sequelize.transaction(async (t) => {
      // 1. Tạo đơn hàng
      const order = await Orders.create(
        {
          user_id: userId,
          restaurant_id: restaurantId,
          address_id,
          food_total,
          delivery_fee,
          discount,
          total_amount,
          note: note || '',
          status: 'PENDING',
        },
        { transaction: t }
      )

      // 2. Snapshot chi tiết món
      const orderItemsData = cartItems.map((ci) => ({
        order_id: order.id,
        food_id: ci.food_id,
        food_name: ci.food.name,
        quantity: ci.quantity,
        unit_price: Number(ci.food.price),
        subtotal: Number(ci.food.price) * ci.quantity,
        note: ci.note || '',
      }))
      await OrderItems.bulkCreate(orderItemsData, { transaction: t })

      // 3. Khởi tạo bản ghi thanh toán
      await Payments.create(
        {
          order_id: order.id,
          payment_method: payment_method || 'CASH',
          amount: total_amount,
          status: 'UNPAID',
        },
        { transaction: t }
      )

      // 4. Dọn sạch giỏ hàng
      await CartItems.destroy({
        where: { cart_id: cart.id },
        transaction: t,
      })

      return order
    })

    return this.getOrderDetail(userId, newOrder.id)
  }

  async getMyOrders(userId, { status, page = 1, limit = 10 }) {
    const where = { user_id: userId }

    if (status) {
      if (status === 'ACTIVE') {
        where.status = { [Op.in]: ['PENDING', 'CONFIRMED', 'PREPARING', 'DELIVERING'] }
      } else if (status === 'COMPLETED') {
        where.status = 'DELIVERED'
      } else if (status === 'CANCELLED') {
        where.status = 'CANCELLED'
      } else {
        where.status = status
      }
    }

    const p = Math.max(1, parseInt(page) || 1)
    const l = Math.max(1, parseInt(limit) || 10)
    const offset = (p - 1) * l

    const { count, rows } = await Orders.findAndCountAll({
      where,
      limit: l,
      offset,
      order: [['id', 'DESC']],
      include: [
        { model: OrderItems, as: 'items' },
        {
          model: Restaurants,
          as: 'restaurant',
          attributes: ['id', 'name', 'image', 'address', 'phone_number'],
        },
        { model: Payments, as: 'payment' },
      ],
      distinct: true,
    })

    return { total: count, data: rows }
  }

  async getOrderDetail(userId, orderId) {
    const order = await Orders.findOne({
      where: { id: orderId, user_id: userId },
      include: [
        { model: OrderItems, as: 'items' },
        {
          model: Restaurants,
          as: 'restaurant',
          attributes: ['id', 'name', 'image', 'address', 'phone_number'],
        },
        { model: Addresses, as: 'address' },
        { model: Payments, as: 'payment' },
      ],
    })

    if (!order) {
      const err = new Error('Không tìm thấy đơn hàng hoặc bạn không có quyền xem')
      err.status = 404
      throw err
    }

    return order
  }

  async cancelOrder(userId, orderId) {
    const order = await Orders.findOne({
      where: { id: orderId, user_id: userId },
    })

    if (!order) {
      const err = new Error('Không tìm thấy đơn hàng')
      err.status = 404
      throw err
    }

    if (order.status !== 'PENDING') {
      const err = new Error('Chỉ có thể hủy đơn hàng khi quán chưa xác nhận (trạng thái PENDING)')
      err.status = 400
      throw err
    }

    await sequelize.transaction(async (t) => {
      order.status = 'CANCELLED'
      await order.save({ transaction: t })

      const payment = await Payments.findOne({
        where: { order_id: order.id },
        transaction: t,
      })

      if (payment && payment.status === 'PAID') {
        payment.status = 'REFUNDED'
        await payment.save({ transaction: t })
      }
    })

    return this.getOrderDetail(userId, orderId)
  }
}

