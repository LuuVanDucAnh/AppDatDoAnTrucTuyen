import { Op, fn, col, literal } from 'sequelize'
import { sequelize } from '../../config/database.js'
import Users from '../users/users.model.js'
import Restaurants from '../restaurants/restaurants.model.js'
import Categories from '../categories/categories.model.js'
import Foods from '../foods/foods.model.js'
import Orders from '../orders/orders.model.js'
import OrderItems from '../order_items/order_items.model.js'
import Payments from '../payments/payments.model.js'
import Reviews from '../reviews/reviews.model.js'
import Addresses from '../addresses/addresses.model.js'
import bcrypt from 'bcryptjs'

export class AdminService {
  // ─────────────────────────────────────────────────────────────────
  // A. TỔNG QUAN HỆ THỐNG (Dashboard)
  // ─────────────────────────────────────────────────────────────────

  /**
   * Thống kê tổng quan toàn sàn
   */
  async getPlatformDashboard() {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0)
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59)
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59)

    const [
      totalUsers,
      newUsersToday,
      totalRestaurants,
      openRestaurants,
      totalOrders,
      todayOrders,
      monthOrders,
      totalRevenue,
      todayRevenue,
      monthRevenue,
      pendingOrders,
      cancelledOrders,
      totalReviews,
    ] = await Promise.all([
      Users.count({ where: { deleted_at: null } }),
      Users.count({
        where: { created_at: { [Op.between]: [startOfDay, endOfDay] } },
      }),
      Restaurants.count({ where: { deleted_at: null } }),
      Restaurants.count({ where: { status: 'OPEN', deleted_at: null } }),
      Orders.count(),
      Orders.count({
        where: {
          created_at: { [Op.between]: [startOfDay, endOfDay] },
          status: { [Op.ne]: 'CANCELLED' },
        },
      }),
      Orders.count({
        where: {
          created_at: { [Op.between]: [startOfMonth, endOfMonth] },
          status: { [Op.ne]: 'CANCELLED' },
        },
      }),
      Orders.sum('total_amount', { where: { status: 'DELIVERED' } }),
      Orders.sum('total_amount', {
        where: {
          status: 'DELIVERED',
          created_at: { [Op.between]: [startOfDay, endOfDay] },
        },
      }),
      Orders.sum('total_amount', {
        where: {
          status: 'DELIVERED',
          created_at: { [Op.between]: [startOfMonth, endOfMonth] },
        },
      }),
      Orders.count({ where: { status: 'PENDING' } }),
      Orders.count({ where: { status: 'CANCELLED' } }),
      Reviews.count(),
    ])

    return {
      users: {
        total: totalUsers,
        new_today: newUsersToday,
      },
      restaurants: {
        total: totalRestaurants,
        open: openRestaurants,
        closed: totalRestaurants - openRestaurants,
      },
      orders: {
        total: totalOrders,
        today: todayOrders,
        this_month: monthOrders,
        pending: pendingOrders,
        cancelled: cancelledOrders,
      },
      revenue: {
        total: totalRevenue || 0,
        today: todayRevenue || 0,
        this_month: monthRevenue || 0,
      },
      total_reviews: totalReviews,
    }
  }

  /**
   * Thống kê doanh thu toàn sàn theo ngày/tháng/năm
   */
  async getPlatformRevenueStats({ from, to, groupBy = 'day' }) {
    const where = { status: 'DELIVERED' }
    if (from || to) {
      where.created_at = {}
      if (from) where.created_at[Op.gte] = new Date(from)
      if (to) where.created_at[Op.lte] = new Date(to)
    }

    let dateFormat
    if (groupBy === 'month') dateFormat = '%Y-%m'
    else if (groupBy === 'year') dateFormat = '%Y'
    else dateFormat = '%Y-%m-%d'

    const stats = await Orders.findAll({
      where,
      attributes: [
        [fn('DATE_FORMAT', col('created_at'), dateFormat), 'period'],
        [fn('COUNT', col('id')), 'order_count'],
        [fn('SUM', col('total_amount')), 'revenue'],
      ],
      group: [literal(`DATE_FORMAT(created_at, '${dateFormat}')`)],
      order: [[literal(`DATE_FORMAT(created_at, '${dateFormat}')`), 'ASC']],
      raw: true,
    })

    return stats.map((s) => ({
      period: s.period,
      order_count: Number(s.order_count),
      revenue: Number(s.revenue) || 0,
    }))
  }

  /**
   * Top nhà hàng theo doanh thu / số đơn
   */
  async getTopRestaurants({ limit = 10, sortBy = 'revenue' }) {
    const orderClause =
      sortBy === 'orders'
        ? [[fn('COUNT', col('orders.id')), 'DESC']]
        : [[fn('SUM', col('orders.total_amount')), 'DESC']]

    const top = await Restaurants.findAll({
      attributes: [
        'id',
        'name',
        'address',
        'status',
        'image',
        [fn('COUNT', col('orders.id')), 'total_orders'],
        [fn('COALESCE', fn('SUM', col('orders.total_amount')), 0), 'total_revenue'],
      ],
      include: [
        {
          model: Orders,
          as: 'orders',
          where: { status: 'DELIVERED' },
          attributes: [],
          required: false,
        },
      ],
      group: ['restaurants.id'],
      order: orderClause,
      limit: Number(limit),
      subQuery: false,
    })

    return top.map((r) => ({
      id: r.id,
      name: r.name,
      address: r.address,
      status: r.status,
      image: r.image,
      total_orders: Number(r.dataValues.total_orders),
      total_revenue: Number(r.dataValues.total_revenue),
    }))
  }

  // ─────────────────────────────────────────────────────────────────
  // B. QUẢN LÝ NGƯỜI DÙNG
  // ─────────────────────────────────────────────────────────────────

  /**
   * Lấy danh sách người dùng (có tìm kiếm, lọc role, phân trang)
   */
  async getUsers({ search, role, status, page = 1, limit = 20 }) {
    const where = {}
    if (search) {
      where[Op.or] = [
        { full_name: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { phone_number: { [Op.like]: `%${search}%` } },
      ]
    }
    if (role) where.role = role
    if (status !== undefined) where.status = Number(status)

    const p = Math.max(1, parseInt(page) || 1)
    const l = Math.max(1, parseInt(limit) || 20)

    const { count, rows } = await Users.findAndCountAll({
      where,
      attributes: { exclude: ['password'] },
      order: [['id', 'DESC']],
      limit: l,
      offset: (p - 1) * l,
    })

    return { total: count, page: p, limit: l, data: rows }
  }

  /**
   * Xem chi tiết user (không trả về password)
   */
  async getUserDetail(userId) {
    const user = await Users.findByPk(userId, {
      attributes: { exclude: ['password'] },
      include: [{ model: Addresses, as: 'addresses' }],
    })
    if (!user) {
      const err = new Error('Không tìm thấy người dùng')
      err.status = 404
      throw err
    }
    return user
  }

  /**
   * Kích hoạt / khóa tài khoản người dùng
   * status: 1 = active, 0 = locked
   */
  async toggleUserStatus(userId) {
    const user = await Users.findByPk(userId)
    if (!user) {
      const err = new Error('Không tìm thấy người dùng')
      err.status = 404
      throw err
    }
    if (user.role === 'ADMIN') {
      const err = new Error('Không thể khóa tài khoản admin')
      err.status = 403
      throw err
    }
    user.status = user.status === 1 ? 0 : 1
    await user.save()
    const { password: _, ...safeUser } = user.toJSON()
    return { ...safeUser, message: user.status === 1 ? 'Tài khoản đã được kích hoạt' : 'Tài khoản đã bị khóa' }
  }

  /**
   * Thay đổi role người dùng: CUSTOMER | OWNER | ADMIN
   */
  async changeUserRole(userId, newRole) {
    const validRoles = ['CUSTOMER', 'OWNER', 'ADMIN']
    if (!validRoles.includes(newRole)) {
      const err = new Error(`Role không hợp lệ. Chỉ chấp nhận: ${validRoles.join(', ')}`)
      err.status = 400
      throw err
    }

    const user = await Users.findByPk(userId)
    if (!user) {
      const err = new Error('Không tìm thấy người dùng')
      err.status = 404
      throw err
    }

    user.role = newRole
    await user.save()
    const { password: _, ...safeUser } = user.toJSON()
    return safeUser
  }

  /**
   * Admin tạo tài khoản người dùng (kể cả tạo OWNER, ADMIN)
   */
  async createUser(data) {
    const { full_name, email, phone_number, password, role = 'CUSTOMER' } = data
    if (!full_name || !phone_number || !password) {
      const err = new Error('full_name, phone_number và password là bắt buộc')
      err.status = 400
      throw err
    }

    if (email) {
      const existed = await Users.findOne({ where: { email } })
      if (existed) {
        const err = new Error('Email đã được sử dụng')
        err.status = 409
        throw err
      }
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = await Users.create({
      full_name,
      email: email || null,
      phone_number,
      password: hashed,
      role,
      status: 1,
    })

    const { password: _, ...safeUser } = user.toJSON()
    return safeUser
  }

  /**
   * Admin cập nhật thông tin người dùng (kể cả role, status)
   */
  async updateUser(userId, data) {
    const user = await Users.findByPk(userId)
    if (!user) {
      const err = new Error('Không tìm thấy người dùng')
      err.status = 404
      throw err
    }

    const allowedFields = ['full_name', 'email', 'phone_number', 'role', 'status']
    allowedFields.forEach((f) => {
      if (data[f] !== undefined) user[f] = data[f]
    })

    if (data.password) {
      user.password = await bcrypt.hash(data.password, 10)
    }

    await user.save()
    const { password: _, ...safeUser } = user.toJSON()
    return safeUser
  }

  /**
   * Admin xóa tài khoản người dùng (soft delete qua deleted_at)
   */
  async deleteUser(userId) {
    const user = await Users.findByPk(userId)
    if (!user) {
      const err = new Error('Không tìm thấy người dùng')
      err.status = 404
      throw err
    }
    if (user.role === 'ADMIN') {
      const err = new Error('Không thể xóa tài khoản admin')
      err.status = 403
      throw err
    }
    user.deleted_at = new Date()
    user.status = 0
    await user.save()
    return { message: 'Đã xóa tài khoản thành công' }
  }

  // ─────────────────────────────────────────────────────────────────
  // C. QUẢN LÝ NHÀ HÀNG
  // ─────────────────────────────────────────────────────────────────

  /**
   * Lấy danh sách tất cả nhà hàng (có tìm kiếm, lọc, phân trang)
   */
  async getRestaurants({ search, status, page = 1, limit = 20 }) {
    const where = {}
    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { address: { [Op.like]: `%${search}%` } },
      ]
    }
    if (status) where.status = status

    const p = Math.max(1, parseInt(page) || 1)
    const l = Math.max(1, parseInt(limit) || 20)

    const { count, rows } = await Restaurants.findAndCountAll({
      where,
      include: [
        {
          model: Users,
          as: 'owner',
          attributes: ['id', 'full_name', 'email', 'phone_number'],
        },
      ],
      order: [['id', 'DESC']],
      limit: l,
      offset: (p - 1) * l,
      distinct: true,
    })

    return { total: count, page: p, limit: l, data: rows }
  }

  /**
   * Xem chi tiết nhà hàng (kèm thông tin chủ quán, danh mục, số đơn)
   */
  async getRestaurantDetail(restaurantId) {
    const restaurant = await Restaurants.findByPk(restaurantId, {
      include: [
        {
          model: Users,
          as: 'owner',
          attributes: ['id', 'full_name', 'email', 'phone_number'],
        },
        {
          model: Categories,
          as: 'categories',
          include: [{ model: Foods, as: 'foods', attributes: ['id', 'name', 'price', 'status'] }],
        },
      ],
    })

    if (!restaurant) {
      const err = new Error('Không tìm thấy nhà hàng')
      err.status = 404
      throw err
    }

    // Đếm tổng đơn & doanh thu
    const [totalOrders, totalRevenue, avgRating] = await Promise.all([
      Orders.count({ where: { restaurant_id: restaurantId } }),
      Orders.sum('total_amount', { where: { restaurant_id: restaurantId, status: 'DELIVERED' } }),
      Reviews.findOne({
        where: { restaurant_id: restaurantId },
        attributes: [
          [fn('ROUND', fn('COALESCE', fn('AVG', col('rating')), 0), 1), 'average_rating'],
          [fn('COUNT', col('id')), 'total_reviews'],
        ],
        raw: true,
      }),
    ])

    return {
      ...restaurant.toJSON(),
      stats: {
        total_orders: totalOrders,
        total_revenue: totalRevenue || 0,
        average_rating: avgRating ? Number(avgRating.average_rating) : 0,
        total_reviews: avgRating ? Number(avgRating.total_reviews) : 0,
      },
    }
  }

  /**
   * Admin cập nhật trạng thái nhà hàng (OPEN / CLOSED / BUSY / SUSPENDED)
   */
  async setRestaurantStatus(restaurantId, status) {
    const validStatuses = ['OPEN', 'CLOSED', 'BUSY', 'SUSPENDED']
    if (!validStatuses.includes(status)) {
      const err = new Error(`Trạng thái không hợp lệ. Chỉ chấp nhận: ${validStatuses.join(', ')}`)
      err.status = 400
      throw err
    }

    const restaurant = await Restaurants.findByPk(restaurantId)
    if (!restaurant) {
      const err = new Error('Không tìm thấy nhà hàng')
      err.status = 404
      throw err
    }

    restaurant.status = status
    await restaurant.save()
    return restaurant
  }

  /**
   * Admin tạo nhà hàng mới (thường dùng khi onboard chủ quán)
   */
  async createRestaurant(data) {
    const { owner_id, name, address, phone_number, description, image, opening_time, closing_time } = data
    if (!name || !address) {
      const err = new Error('Tên và địa chỉ nhà hàng là bắt buộc')
      err.status = 400
      throw err
    }

    if (owner_id) {
      const owner = await Users.findByPk(owner_id)
      if (!owner) {
        const err = new Error('Không tìm thấy chủ quán')
        err.status = 404
        throw err
      }
      // Tự động nâng role lên OWNER nếu chưa là OWNER
      if (owner.role !== 'OWNER' && owner.role !== 'ADMIN') {
        owner.role = 'OWNER'
        await owner.save()
      }
    }

    const restaurant = await Restaurants.create({
      owner_id: owner_id || null,
      name,
      address,
      phone_number: phone_number || null,
      description: description || null,
      image: image || null,
      opening_time: opening_time || null,
      closing_time: closing_time || null,
      status: 'OPEN',
    })

    return restaurant
  }

  /**
   * Admin xóa nhà hàng
   */
  async deleteRestaurant(restaurantId) {
    const restaurant = await Restaurants.findByPk(restaurantId)
    if (!restaurant) {
      const err = new Error('Không tìm thấy nhà hàng')
      err.status = 404
      throw err
    }

    // Kiểm tra có đơn đang active không
    const activeOrders = await Orders.count({
      where: {
        restaurant_id: restaurantId,
        status: { [Op.in]: ['PENDING', 'CONFIRMED', 'PREPARING', 'DELIVERING'] },
      },
    })
    if (activeOrders > 0) {
      const err = new Error(
        `Không thể xóa nhà hàng đang có ${activeOrders} đơn hàng chưa hoàn thành. Vui lòng xử lý hết đơn trước.`,
      )
      err.status = 400
      throw err
    }

    restaurant.deleted_at = new Date()
    restaurant.status = 'CLOSED'
    await restaurant.save()
    return { message: 'Đã xóa nhà hàng thành công' }
  }

  // ─────────────────────────────────────────────────────────────────
  // D. QUẢN LÝ ĐƠN HÀNG
  // ─────────────────────────────────────────────────────────────────

  /**
   * Admin xem tất cả đơn hàng toàn sàn (lọc theo status, nhà hàng, ngày)
   */
  async getAllOrders({ status, restaurant_id, from, to, page = 1, limit = 20 }) {
    const where = {}
    if (status) where.status = status
    if (restaurant_id) where.restaurant_id = restaurant_id
    if (from || to) {
      where.created_at = {}
      if (from) where.created_at[Op.gte] = new Date(from)
      if (to) where.created_at[Op.lte] = new Date(to)
    }

    const p = Math.max(1, parseInt(page) || 1)
    const l = Math.max(1, parseInt(limit) || 20)

    const { count, rows } = await Orders.findAndCountAll({
      where,
      include: [
        { model: OrderItems, as: 'items' },
        {
          model: Users,
          as: 'user',
          attributes: ['id', 'full_name', 'phone_number', 'email'],
        },
        {
          model: Restaurants,
          as: 'restaurant',
          attributes: ['id', 'name', 'address', 'phone_number'],
        },
        { model: Addresses, as: 'address' },
        { model: Payments, as: 'payment' },
      ],
      order: [['id', 'DESC']],
      limit: l,
      offset: (p - 1) * l,
      distinct: true,
    })

    return { total: count, page: p, limit: l, data: rows }
  }

  /**
   * Admin xem chi tiết một đơn hàng
   */
  async getOrderDetail(orderId) {
    const order = await Orders.findByPk(orderId, {
      include: [
        { model: OrderItems, as: 'items' },
        {
          model: Users,
          as: 'user',
          attributes: ['id', 'full_name', 'phone_number', 'email'],
        },
        {
          model: Restaurants,
          as: 'restaurant',
          attributes: ['id', 'name', 'address', 'phone_number'],
        },
        { model: Addresses, as: 'address' },
        { model: Payments, as: 'payment' },
      ],
    })

    if (!order) {
      const err = new Error('Không tìm thấy đơn hàng')
      err.status = 404
      throw err
    }

    return order
  }

  /**
   * Admin ép cập nhật trạng thái đơn hàng (không kiểm tra flow)
   */
  async forceUpdateOrderStatus(orderId, newStatus) {
    const validStatuses = ['PENDING', 'CONFIRMED', 'PREPARING', 'DELIVERING', 'DELIVERED', 'CANCELLED']
    if (!validStatuses.includes(newStatus)) {
      const err = new Error(`Trạng thái không hợp lệ: ${newStatus}`)
      err.status = 400
      throw err
    }

    const order = await Orders.findByPk(orderId, {
      include: [{ model: Payments, as: 'payment' }],
    })
    if (!order) {
      const err = new Error('Không tìm thấy đơn hàng')
      err.status = 404
      throw err
    }

    await sequelize.transaction(async (t) => {
      order.status = newStatus
      await order.save({ transaction: t })

      if (newStatus === 'DELIVERED' && order.payment) {
        if (order.payment.payment_method === 'CASH' && order.payment.status === 'UNPAID') {
          order.payment.status = 'PAID'
          await order.payment.save({ transaction: t })
        }
      }
      if (newStatus === 'CANCELLED' && order.payment && order.payment.status === 'PAID') {
        order.payment.status = 'REFUNDED'
        await order.payment.save({ transaction: t })
      }
    })

    return this.getOrderDetail(orderId)
  }

  // ─────────────────────────────────────────────────────────────────
  // E. QUẢN LÝ THANH TOÁN
  // ─────────────────────────────────────────────────────────────────

  /**
   * Admin xem tất cả thanh toán (lọc theo phương thức, trạng thái)
   */
  async getAllPayments({ payment_method, status, from, to, page = 1, limit = 20 }) {
    const where = {}
    if (payment_method) where.payment_method = payment_method
    if (status) where.status = status
    if (from || to) {
      where.created_at = {}
      if (from) where.created_at[Op.gte] = new Date(from)
      if (to) where.created_at[Op.lte] = new Date(to)
    }

    const p = Math.max(1, parseInt(page) || 1)
    const l = Math.max(1, parseInt(limit) || 20)

    const { count, rows } = await Payments.findAndCountAll({
      where,
      include: [
        {
          model: Orders,
          as: 'order',
          include: [
            { model: Users, as: 'user', attributes: ['id', 'full_name', 'phone_number'] },
            { model: Restaurants, as: 'restaurant', attributes: ['id', 'name'] },
          ],
        },
      ],
      order: [['id', 'DESC']],
      limit: l,
      offset: (p - 1) * l,
      distinct: true,
    })

    return { total: count, page: p, limit: l, data: rows }
  }

  // ─────────────────────────────────────────────────────────────────
  // F. QUẢN LÝ ĐÁNH GIÁ
  // ─────────────────────────────────────────────────────────────────

  /**
   * Admin xem tất cả đánh giá (lọc theo nhà hàng, số sao)
   */
  async getAllReviews({ restaurant_id, rating, page = 1, limit = 20 }) {
    const where = {}
    if (restaurant_id) where.restaurant_id = restaurant_id
    if (rating) where.rating = Number(rating)

    const p = Math.max(1, parseInt(page) || 1)
    const l = Math.max(1, parseInt(limit) || 20)

    const { count, rows } = await Reviews.findAndCountAll({
      where,
      include: [
        {
          model: Users,
          as: 'user',
          attributes: ['id', 'full_name', 'phone_number', 'email'],
        },
        {
          model: Restaurants,
          as: 'restaurant',
          attributes: ['id', 'name'],
        },
      ],
      order: [['id', 'DESC']],
      limit: l,
      offset: (p - 1) * l,
      distinct: true,
    })

    return { total: count, page: p, limit: l, data: rows }
  }

  /**
   * Admin xóa đánh giá vi phạm
   */
  async deleteReview(reviewId) {
    const review = await Reviews.findByPk(reviewId)
    if (!review) {
      const err = new Error('Không tìm thấy đánh giá')
      err.status = 404
      throw err
    }
    await review.destroy()
    return { message: 'Đã xóa đánh giá thành công' }
  }
}
