import { Op, fn, col, literal } from 'sequelize'
import { sequelize } from '../../config/database.js'
import Orders from '../orders/orders.model.js'
import OrderItems from '../order_items/order_items.model.js'
import Restaurants from '../restaurants/restaurants.model.js'
import Foods from '../foods/foods.model.js'
import Categories from '../categories/categories.model.js'
import Addresses from '../addresses/addresses.model.js'
import Payments from '../payments/payments.model.js'
import Reviews from '../reviews/reviews.model.js'
import Users from '../users/users.model.js'

export class OwnerService {
  // ─────────────────────────────────────────────────────────────────
  // A. QUẢN LÝ NHÖU HÀNG
  // ─────────────────────────────────────────────────────────────────

  /**
   * Chủ quán xem danh sách nhà hàng của mình
   */
  async getMyRestaurants(ownerId) {
    const restaurants = await Restaurants.findAll({
      where: { owner_id: ownerId },
      order: [['id', 'DESC']],
    })
    return restaurants
  }

  /**
   * Chủ quán cập nhật thông tin nhà hàng (tên, mô tả, địa chỉ, giờ mở cửa...)
   */
  async updateRestaurantInfo(restaurant, data) {
    const allowedFields = ['name', 'description', 'address', 'phone_number', 'image', 'opening_time', 'closing_time']
    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        restaurant[field] = data[field]
      }
    })
    await restaurant.save()
    return restaurant
  }

  /**
   * Mở/đóng cửa nhà hàng
   */
  async toggleRestaurantStatus(restaurant) {
    restaurant.status = restaurant.status === 'OPEN' ? 'CLOSED' : 'OPEN'
    await restaurant.save()
    return restaurant
  }

  /**
   * Đặt trạng thái nhà hàng cụ thể: OPEN | CLOSED | BUSY
   */
  async setRestaurantStatus(restaurant, status) {
    const validStatuses = ['OPEN', 'CLOSED', 'BUSY']
    if (!validStatuses.includes(status)) {
      const err = new Error(`Trạng thái không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(', ')}`)
      err.status = 400
      throw err
    }
    restaurant.status = status
    await restaurant.save()
    return restaurant
  }

  // ─────────────────────────────────────────────────────────────────
  // B. QUẢN LÝ ĐƠN HÀNG
  // ─────────────────────────────────────────────────────────────────

  /**
   * Chủ quán xem danh sách đơn hàng của nhà hàng mình
   */
  async getRestaurantOrders(restaurantId, { status, page = 1, limit = 20 }) {
    const where = { restaurant_id: restaurantId }
    if (status) {
      where.status = status
    }

    const p = Math.max(1, parseInt(page) || 1)
    const l = Math.max(1, parseInt(limit) || 20)
    const offset = (p - 1) * l

    const { count, rows } = await Orders.findAndCountAll({
      where,
      limit: l,
      offset,
      order: [['id', 'DESC']],
      include: [
        {
          model: OrderItems,
          as: 'items',
        },
        {
          model: Users,
          as: 'user',
          attributes: ['id', 'full_name', 'phone_number', 'email'],
        },
        { model: Addresses, as: 'address' },
        { model: Payments, as: 'payment' },
      ],
      distinct: true,
    })

    return { total: count, page: p, limit: l, data: rows }
  }

  /**
   * Chủ quán xem chi tiết 1 đơn hàng
   */
  async getOrderDetail(restaurantId, orderId) {
    const order = await Orders.findOne({
      where: { id: orderId, restaurant_id: restaurantId },
      include: [
        { model: OrderItems, as: 'items' },
        {
          model: Users,
          as: 'user',
          attributes: ['id', 'full_name', 'phone_number', 'email'],
        },
        { model: Addresses, as: 'address' },
        { model: Payments, as: 'payment' },
      ],
    })

    if (!order) {
      const err = new Error('Không tìm thấy đơn hàng hoặc đơn không thuộc nhà hàng của bạn')
      err.status = 404
      throw err
    }

    return order
  }

  /**
   * Chủ quán cập nhật trạng thái đơn hàng
   * Flow: PENDING → CONFIRMED → PREPARING → DELIVERING → DELIVERED
   * Hoặc:   * → CANCELLED (chủ quán từ chối)
   */
  async updateOrderStatus(restaurantId, orderId, newStatus) {
    const validTransitions = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['DELIVERING'],
      DELIVERING: ['DELIVERED'],
    }

    const order = await Orders.findOne({
      where: { id: orderId, restaurant_id: restaurantId },
      include: [{ model: Payments, as: 'payment' }],
    })

    if (!order) {
      const err = new Error('Không tìm thấy đơn hàng hoặc đơn không thuộc nhà hàng của bạn')
      err.status = 404
      throw err
    }

    const allowed = validTransitions[order.status] || []
    if (!allowed.includes(newStatus)) {
      const err = new Error(
        `Không thể chuyển trạng thái từ "${order.status}" sang "${newStatus}". Chỉ cho phép: ${allowed.join(', ') || 'không có'}`,
      )
      err.status = 400
      throw err
    }

    await sequelize.transaction(async (t) => {
      order.status = newStatus
      await order.save({ transaction: t })

      // Nếu giao thành công → cập nhật thanh toán thành PAID (nếu COD)
      if (newStatus === 'DELIVERED' && order.payment) {
        if (order.payment.payment_method === 'CASH' && order.payment.status === 'UNPAID') {
          order.payment.status = 'PAID'
          await order.payment.save({ transaction: t })
        }
      }

      // Nếu hủy → refund nếu đã thanh toán online
      if (newStatus === 'CANCELLED' && order.payment && order.payment.status === 'PAID') {
        order.payment.status = 'REFUNDED'
        await order.payment.save({ transaction: t })
      }
    })

    return this.getOrderDetail(restaurantId, orderId)
  }

  // ─────────────────────────────────────────────────────────────────
  // C. QUẢN LÝ MÓN ĂN (FOODS)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Lấy danh sách món ăn của nhà hàng (kèm lọc theo trạng thái, danh mục)
   */
  async getRestaurantFoods(restaurantId, { status, category_id, page = 1, limit = 50 }) {
    const categoryWhere = { restaurant_id: restaurantId }
    if (category_id) categoryWhere.id = category_id

    const foodWhere = {}
    if (status) foodWhere.status = status

    const p = Math.max(1, parseInt(page) || 1)
    const l = Math.max(1, parseInt(limit) || 50)
    const offset = (p - 1) * l

    const { count, rows } = await Foods.findAndCountAll({
      where: foodWhere,
      include: [
        {
          model: Categories,
          as: 'category',
          where: categoryWhere,
          attributes: ['id', 'name', 'restaurant_id'],
        },
      ],
      limit: l,
      offset,
      order: [['id', 'DESC']],
      distinct: true,
    })

    return { total: count, page: p, limit: l, data: rows }
  }

  /**
   * Thêm món ăn mới vào nhà hàng
   */
  async createFood(restaurantId, data) {
    const { category_id, name, description, price, image, status = 'AVAILABLE' } = data

    // Kiểm tra category phải thuộc về nhà hàng này
    const category = await Categories.findOne({
      where: { id: category_id, restaurant_id: restaurantId },
    })

    if (!category) {
      const err = new Error('Danh mục không tồn tại hoặc không thuộc nhà hàng của bạn')
      err.status = 400
      throw err
    }

    if (!name || !price) {
      const err = new Error('Tên món và giá là bắt buộc')
      err.status = 400
      throw err
    }

    const food = await Foods.create({
      category_id,
      name,
      description: description || '',
      price: Number(price),
      image: image || null,
      status,
    })

    return food
  }

  /**
   * Cập nhật thông tin món ăn
   */
  async updateFood(restaurantId, foodId, data) {
    const food = await Foods.findOne({
      include: [
        {
          model: Categories,
          as: 'category',
          where: { restaurant_id: restaurantId },
        },
      ],
      where: { id: foodId },
    })

    if (!food) {
      const err = new Error('Không tìm thấy món ăn hoặc món không thuộc nhà hàng của bạn')
      err.status = 404
      throw err
    }

    // Nếu đổi category, phải đảm bảo category mới cũng thuộc nhà hàng này
    if (data.category_id && data.category_id !== food.category_id) {
      const newCat = await Categories.findOne({
        where: { id: data.category_id, restaurant_id: restaurantId },
      })
      if (!newCat) {
        const err = new Error('Danh mục mới không tồn tại hoặc không thuộc nhà hàng của bạn')
        err.status = 400
        throw err
      }
    }

    const allowedFields = ['category_id', 'name', 'description', 'price', 'image', 'status']
    allowedFields.forEach((field) => {
      if (data[field] !== undefined) {
        food[field] = data[field]
      }
    })
    await food.save()
    return food
  }

  /**
   * Bật/tắt trạng thái món ăn (AVAILABLE ↔ UNAVAILABLE)
   */
  async toggleFoodStatus(restaurantId, foodId) {
    const food = await Foods.findOne({
      include: [
        {
          model: Categories,
          as: 'category',
          where: { restaurant_id: restaurantId },
        },
      ],
      where: { id: foodId },
    })

    if (!food) {
      const err = new Error('Không tìm thấy món ăn hoặc món không thuộc nhà hàng của bạn')
      err.status = 404
      throw err
    }

    food.status = food.status === 'AVAILABLE' ? 'UNAVAILABLE' : 'AVAILABLE'
    await food.save()
    return food
  }

  /**
   * Xóa món ăn
   */
  async deleteFood(restaurantId, foodId) {
    const food = await Foods.findOne({
      include: [
        {
          model: Categories,
          as: 'category',
          where: { restaurant_id: restaurantId },
        },
      ],
      where: { id: foodId },
    })

    if (!food) {
      const err = new Error('Không tìm thấy món ăn hoặc món không thuộc nhà hàng của bạn')
      err.status = 404
      throw err
    }

    await food.destroy()
    return { message: 'Xóa món ăn thành công' }
  }

  // ─────────────────────────────────────────────────────────────────
  // D. QUẢN LÝ DANH MỤC (CATEGORIES)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Lấy danh sách danh mục của nhà hàng
   */
  async getRestaurantCategories(restaurantId) {
    const categories = await Categories.findAll({
      where: { restaurant_id: restaurantId },
      include: [
        {
          model: Foods,
          as: 'foods',
          attributes: ['id', 'name', 'price', 'status', 'image'],
        },
      ],
      order: [['id', 'ASC']],
    })
    return categories
  }

  /**
   * Tạo danh mục mới cho nhà hàng
   */
  async createCategory(restaurantId, data) {
    const { name, description } = data
    if (!name) {
      const err = new Error('Tên danh mục là bắt buộc')
      err.status = 400
      throw err
    }
    const category = await Categories.create({
      restaurant_id: restaurantId,
      name,
      description: description || '',
    })
    return category
  }

  /**
   * Cập nhật danh mục
   */
  async updateCategory(restaurantId, categoryId, data) {
    const category = await Categories.findOne({
      where: { id: categoryId, restaurant_id: restaurantId },
    })

    if (!category) {
      const err = new Error('Không tìm thấy danh mục hoặc danh mục không thuộc nhà hàng của bạn')
      err.status = 404
      throw err
    }

    if (data.name !== undefined) category.name = data.name
    if (data.description !== undefined) category.description = data.description
    await category.save()
    return category
  }

  /**
   * Xóa danh mục (chỉ xóa được khi không còn món ăn trong danh mục)
   */
  async deleteCategory(restaurantId, categoryId) {
    const category = await Categories.findOne({
      where: { id: categoryId, restaurant_id: restaurantId },
      include: [{ model: Foods, as: 'foods', attributes: ['id'] }],
    })

    if (!category) {
      const err = new Error('Không tìm thấy danh mục hoặc danh mục không thuộc nhà hàng của bạn')
      err.status = 404
      throw err
    }

    if (category.foods && category.foods.length > 0) {
      const err = new Error(
        `Danh mục đang có ${category.foods.length} món ăn. Vui lòng xóa hoặc chuyển danh mục các món trước khi xóa danh mục này.`,
      )
      err.status = 400
      throw err
    }

    await category.destroy()
    return { message: 'Xóa danh mục thành công' }
  }

  // ─────────────────────────────────────────────────────────────────
  // E. THỐNG KÊ - DASHBOARD
  // ─────────────────────────────────────────────────────────────────

  /**
   * Tổng quan dashboard: tổng đơn, doanh thu, đánh giá, ...
   */
  async getDashboard(restaurantId) {
    const today = new Date()
    const startOfDay = new Date(today.setHours(0, 0, 0, 0))
    const endOfDay = new Date(today.setHours(23, 59, 59, 999))

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)

    // Đơn hôm nay
    const todayOrders = await Orders.count({
      where: {
        restaurant_id: restaurantId,
        created_at: { [Op.between]: [startOfDay, endOfDay] },
        status: { [Op.ne]: 'CANCELLED' },
      },
    })

    // Doanh thu hôm nay (các đơn DELIVERED)
    const todayRevenue = await Orders.sum('total_amount', {
      where: {
        restaurant_id: restaurantId,
        status: 'DELIVERED',
        created_at: { [Op.between]: [startOfDay, endOfDay] },
      },
    })

    // Đơn tháng này
    const monthOrders = await Orders.count({
      where: {
        restaurant_id: restaurantId,
        created_at: { [Op.between]: [startOfMonth, endOfMonth] },
        status: { [Op.ne]: 'CANCELLED' },
      },
    })

    // Doanh thu tháng này
    const monthRevenue = await Orders.sum('total_amount', {
      where: {
        restaurant_id: restaurantId,
        status: 'DELIVERED',
        created_at: { [Op.between]: [startOfMonth, endOfMonth] },
      },
    })

    // Đơn đang chờ xử lý (PENDING)
    const pendingOrders = await Orders.count({
      where: {
        restaurant_id: restaurantId,
        status: 'PENDING',
      },
    })

    // Đơn đang chuẩn bị (CONFIRMED + PREPARING)
    const activeOrders = await Orders.count({
      where: {
        restaurant_id: restaurantId,
        status: { [Op.in]: ['CONFIRMED', 'PREPARING', 'DELIVERING'] },
      },
    })

    // Đánh giá trung bình
    const ratingData = await Reviews.findOne({
      where: { restaurant_id: restaurantId },
      attributes: [
        [fn('ROUND', fn('COALESCE', fn('AVG', col('rating')), 0), 1), 'average_rating'],
        [fn('COUNT', col('id')), 'total_reviews'],
      ],
      raw: true,
    })

    // Tổng số món ăn
    const totalFoods = await Foods.count({
      include: [
        {
          model: Categories,
          as: 'category',
          where: { restaurant_id: restaurantId },
          attributes: [],
        },
      ],
    })

    return {
      today: {
        orders: todayOrders,
        revenue: todayRevenue || 0,
      },
      month: {
        orders: monthOrders,
        revenue: monthRevenue || 0,
      },
      pending_orders: pendingOrders,
      active_orders: activeOrders,
      average_rating: ratingData ? Number(ratingData.average_rating) : 0,
      total_reviews: ratingData ? Number(ratingData.total_reviews) : 0,
      total_foods: totalFoods,
    }
  }

  /**
   * Thống kê doanh thu theo ngày trong khoảng thời gian
   */
  async getRevenueStats(restaurantId, { from, to, groupBy = 'day' }) {
    const where = {
      restaurant_id: restaurantId,
      status: 'DELIVERED',
    }

    if (from || to) {
      where.created_at = {}
      if (from) where.created_at[Op.gte] = new Date(from)
      if (to) where.created_at[Op.lte] = new Date(to)
    }

    let dateFormat
    if (groupBy === 'month') {
      dateFormat = '%Y-%m'
    } else if (groupBy === 'year') {
      dateFormat = '%Y'
    } else {
      dateFormat = '%Y-%m-%d'
    }

    const stats = await Orders.findAll({
      where,
      attributes: [
        [fn('DATE_FORMAT', col('created_at'), dateFormat), 'period'],
        [fn('COUNT', col('id')), 'order_count'],
        [fn('SUM', col('total_amount')), 'revenue'],
        [fn('SUM', col('food_total')), 'food_total'],
      ],
      group: [literal(`DATE_FORMAT(created_at, '${dateFormat}')`)],
      order: [[literal(`DATE_FORMAT(created_at, '${dateFormat}')`), 'ASC']],
      raw: true,
    })

    return stats.map((s) => ({
      period: s.period,
      order_count: Number(s.order_count),
      revenue: Number(s.revenue) || 0,
      food_total: Number(s.food_total) || 0,
    }))
  }

  /**
   * Thống kê top món ăn bán chạy
   */
  async getTopFoods(restaurantId, limit = 10) {
    const topFoods = await OrderItems.findAll({
      attributes: [
        'food_id',
        'food_name',
        [fn('SUM', col('quantity')), 'total_sold'],
        [fn('SUM', col('subtotal')), 'total_revenue'],
        [fn('COUNT', col('order_id')), 'order_count'],
      ],
      include: [
        {
          model: Orders,
          as: 'order',
          where: {
            restaurant_id: restaurantId,
            status: 'DELIVERED',
          },
          attributes: [],
        },
      ],
      group: ['food_id', 'food_name'],
      order: [[fn('SUM', col('quantity')), 'DESC']],
      limit: Number(limit),
      raw: true,
    })

    return topFoods.map((f) => ({
      food_id: f.food_id,
      food_name: f.food_name,
      total_sold: Number(f.total_sold),
      total_revenue: Number(f.total_revenue) || 0,
      order_count: Number(f.order_count),
    }))
  }

  /**
   * Xem đánh giá của nhà hàng (có phân trang)
   */
  async getRestaurantReviews(restaurantId, { page = 1, limit = 20, rating }) {
    const where = { restaurant_id: restaurantId }
    if (rating) where.rating = Number(rating)

    const p = Math.max(1, parseInt(page) || 1)
    const l = Math.max(1, parseInt(limit) || 20)

    const { count, rows } = await Reviews.findAndCountAll({
      where,
      include: [
        {
          model: Users,
          as: 'user',
          attributes: ['id', 'full_name', 'phone_number'],
        },
      ],
      order: [['id', 'DESC']],
      limit: l,
      offset: (p - 1) * l,
      distinct: true,
    })

    return { total: count, page: p, limit: l, data: rows }
  }
}
