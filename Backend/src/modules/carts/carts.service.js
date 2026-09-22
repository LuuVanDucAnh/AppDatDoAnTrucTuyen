import { CartsRepository } from './carts.repository.js'
import Carts from './carts.model.js'
import CartItems from '../cart_items/cart_items.model.js'
import Foods from '../foods/foods.model.js'
import Categories from '../categories/categories.model.js'
import Restaurants from '../restaurants/restaurants.model.js'

const repo = new CartsRepository()

export class CartsService {
  async getAll(query) {
    return repo.findAll(query)
  }

  async getById(id) {
    const item = await repo.findById(id)
    if (!item) {
      const err = new Error('Không tìm thấy carts')
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

  async getMyCart(userId) {
    const [cart] = await Carts.findOrCreate({
      where: { user_id: userId },
      defaults: { user_id: userId },
    })

    const cartItems = await CartItems.findAll({
      where: { cart_id: cart.id },
      include: [
        {
          model: Foods,
          as: 'food',
          include: [
            {
              model: Categories,
              as: 'category',
              include: [
                {
                  model: Restaurants,
                  as: 'restaurant',
                },
              ],
            },
          ],
        },
      ],
      order: [['id', 'ASC']],
    })

    let restaurant = null
    let food_total = 0
    let total_items = 0

    const items = cartItems.map((ci) => {
      const food = ci.food
      const unit_price = Number(food?.price || 0)
      const subtotal = unit_price * ci.quantity
      food_total += subtotal
      total_items += ci.quantity

      if (!restaurant && food?.category?.restaurant) {
        restaurant = {
          id: food.category.restaurant.id,
          name: food.category.restaurant.name,
          image: food.category.restaurant.image,
          address: food.category.restaurant.address,
        }
      }

      return {
        id: ci.id,
        food_id: ci.food_id,
        food_name: food?.name || '',
        image: food?.image || null,
        price: unit_price,
        quantity: ci.quantity,
        note: ci.note,
        subtotal,
      }
    })

    return {
      cart_id: cart.id,
      restaurant,
      total_items,
      food_total,
      items,
    }
  }

  async addItem(userId, { food_id, quantity = 1, note = '', force_replace = false }) {
    const qty = Math.max(1, parseInt(quantity) || 1)

    const food = await Foods.findByPk(food_id, {
      include: [
        {
          model: Categories,
          as: 'category',
          include: [{ model: Restaurants, as: 'restaurant' }],
        },
      ],
    })

    if (!food) {
      const err = new Error('Món ăn không tồn tại')
      err.status = 404
      throw err
    }

    if (food.status !== 'AVAILABLE') {
      const err = new Error('Món ăn hiện tại đã hết hàng')
      err.status = 400
      throw err
    }

    const [cart] = await Carts.findOrCreate({
      where: { user_id: userId },
      defaults: { user_id: userId },
    })

    const existingItems = await CartItems.findAll({
      where: { cart_id: cart.id },
      include: [
        {
          model: Foods,
          as: 'food',
          include: [{ model: Categories, as: 'category' }],
        },
      ],
    })

    if (existingItems.length > 0) {
      const currentRestaurantId = existingItems[0].food?.category?.restaurant_id
      const newRestaurantId = food.category?.restaurant_id

      if (currentRestaurantId && newRestaurantId && currentRestaurantId !== newRestaurantId) {
        if (!force_replace) {
          const err = new Error('Giỏ hàng hiện tại đang có món của nhà hàng khác.')
          err.status = 409
          err.code = 'DIFFERENT_RESTAURANT'
          err.errors = {
            current_restaurant_id: currentRestaurantId,
            new_restaurant_id: newRestaurantId,
            new_restaurant_name: food.category?.restaurant?.name || '',
          }
          throw err
        } else {
          // Force replace: clear old items
          await CartItems.destroy({ where: { cart_id: cart.id } })
        }
      }
    }

    // Check if food is already in cart
    const existingCartItem = await CartItems.findOne({
      where: { cart_id: cart.id, food_id },
    })

    if (existingCartItem) {
      existingCartItem.quantity += qty
      if (note) existingCartItem.note = note
      await existingCartItem.save()
    } else {
      await CartItems.create({
        cart_id: cart.id,
        food_id,
        quantity: qty,
        note: note || '',
      })
    }

    return this.getMyCart(userId)
  }

  async updateItemQuantity(userId, itemId, { quantity, note }) {
    const cart = await Carts.findOne({ where: { user_id: userId } })
    if (!cart) {
      const err = new Error('Không tìm thấy giỏ hàng')
      err.status = 404
      throw err
    }

    const item = await CartItems.findOne({
      where: { id: itemId, cart_id: cart.id },
    })

    if (!item) {
      const err = new Error('Không tìm thấy món ăn trong giỏ hàng')
      err.status = 404
      throw err
    }

    if (quantity !== undefined) {
      const qty = parseInt(quantity)
      if (qty <= 0) {
        await item.destroy()
        return this.getMyCart(userId)
      }
      item.quantity = qty
    }

    if (note !== undefined) {
      item.note = note
    }

    await item.save()
    return this.getMyCart(userId)
  }

  async removeItem(userId, itemId) {
    const cart = await Carts.findOne({ where: { user_id: userId } })
    if (!cart) {
      const err = new Error('Không tìm thấy giỏ hàng')
      err.status = 404
      throw err
    }

    await CartItems.destroy({
      where: { id: itemId, cart_id: cart.id },
    })

    return this.getMyCart(userId)
  }

  async clearCart(userId) {
    const cart = await Carts.findOne({ where: { user_id: userId } })
    if (cart) {
      await CartItems.destroy({ where: { cart_id: cart.id } })
    }
    return this.getMyCart(userId)
  }
}

