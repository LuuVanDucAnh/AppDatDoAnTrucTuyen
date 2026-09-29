import { Router } from 'express'
import { Op } from 'sequelize'
import Restaurants from '../restaurants/restaurants.model.js'
import Foods from '../foods/foods.model.js'
import Categories from '../categories/categories.model.js'
import Reviews from '../reviews/reviews.model.js'
import { sequelize } from '../../config/database.js'
import { sendSuccess, sendError } from '../../utils/response.js'

const router = Router()

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Tìm kiếm toàn sàn
 */

/**
 * @swagger
 * /search:
 *   get:
 *     tags: [Search]
 *     summary: Tìm kiếm nhà hàng và món ăn theo từ khoá
 *     description: |
 *       Tìm kiếm đồng thời trên cả nhà hàng và món ăn.
 *       Kết quả trả về gồm 2 mảng: `restaurants` và `foods`.
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Từ khoá tìm kiếm (tên nhà hàng, địa chỉ, tên món)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Số kết quả tối đa cho mỗi loại
 *     responses:
 *       200:
 *         description: Kết quả tìm kiếm
 *       400:
 *         description: Thiếu từ khoá tìm kiếm
 */
router.get('/', async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query

    if (!q || q.trim().length === 0) {
      return sendError(res, 'Vui lòng nhập từ khoá tìm kiếm', 400)
    }

    const keyword = `%${q.trim()}%`
    const l = Math.min(50, Math.max(1, parseInt(limit) || 10))

    // Tìm nhà hàng (theo tên hoặc địa chỉ, chỉ lấy OPEN)
    const restaurants = await Restaurants.findAll({
      where: {
        status: 'OPEN',
        [Op.or]: [
          { name: { [Op.like]: keyword } },
          { address: { [Op.like]: keyword } },
        ],
      },
      attributes: {
        include: [
          [sequelize.fn('ROUND', sequelize.fn('COALESCE', sequelize.fn('AVG', sequelize.col('reviews.rating')), 0), 1), 'average_rating'],
          [sequelize.fn('COUNT', sequelize.col('reviews.id')), 'total_reviews'],
        ],
      },
      include: [
        { model: Reviews, as: 'reviews', attributes: [] },
      ],
      group: ['restaurants.id'],
      subQuery: false,
      limit: l,
    })

    // Tìm món ăn (theo tên, chỉ lấy AVAILABLE, kèm nhà hàng)
    const foods = await Foods.findAll({
      where: {
        status: 'AVAILABLE',
        name: { [Op.like]: keyword },
      },
      include: [
        {
          model: Categories,
          as: 'category',
          attributes: ['id', 'name', 'restaurant_id'],
          include: [
            {
              model: Restaurants,
              as: 'restaurant',
              where: { status: 'OPEN' },
              attributes: ['id', 'name', 'address', 'image'],
            },
          ],
        },
      ],
      limit: l,
    })

    sendSuccess(res, `Kết quả tìm kiếm cho "${q.trim()}"`, {
      keyword: q.trim(),
      restaurants: {
        total: restaurants.length,
        data: restaurants,
      },
      foods: {
        total: foods.length,
        data: foods,
      },
    })
  } catch (err) { next(err) }
})

/**
 * @swagger
 * /search/restaurants:
 *   get:
 *     tags: [Search]
 *     summary: Tìm kiếm nhà hàng (có phân trang)
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Kết quả tìm kiếm nhà hàng
 */
router.get('/restaurants', async (req, res, next) => {
  try {
    const { q, page = 1, limit = 10 } = req.query
    if (!q || q.trim().length === 0) return sendError(res, 'Vui lòng nhập từ khoá tìm kiếm', 400)

    const keyword = `%${q.trim()}%`
    const p = Math.max(1, parseInt(page) || 1)
    const l = Math.max(1, parseInt(limit) || 10)

    const { count, rows } = await Restaurants.findAndCountAll({
      where: {
        [Op.or]: [
          { name: { [Op.like]: keyword } },
          { address: { [Op.like]: keyword } },
        ],
      },
      attributes: {
        include: [
          [sequelize.fn('ROUND', sequelize.fn('COALESCE', sequelize.fn('AVG', sequelize.col('reviews.rating')), 0), 1), 'average_rating'],
          [sequelize.fn('COUNT', sequelize.col('reviews.id')), 'total_reviews'],
        ],
      },
      include: [{ model: Reviews, as: 'reviews', attributes: [] }],
      group: ['restaurants.id'],
      subQuery: false,
      limit: l,
      offset: (p - 1) * l,
    })

    const total = Array.isArray(count) ? count.length : count
    sendSuccess(res, `Tìm thấy ${total} nhà hàng`, rows, {
      page: p,
      limit: l,
      total,
      totalPages: Math.ceil(total / l),
    })
  } catch (err) { next(err) }
})

/**
 * @swagger
 * /search/foods:
 *   get:
 *     tags: [Search]
 *     summary: Tìm kiếm món ăn (có phân trang, lọc theo giá)
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: min_price
 *         schema:
 *           type: number
 *         description: Giá tối thiểu
 *       - in: query
 *         name: max_price
 *         schema:
 *           type: number
 *         description: Giá tối đa
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Kết quả tìm kiếm món ăn
 */
router.get('/foods', async (req, res, next) => {
  try {
    const { q, min_price, max_price, page = 1, limit = 10 } = req.query
    if (!q || q.trim().length === 0) return sendError(res, 'Vui lòng nhập từ khoá tìm kiếm', 400)

    const p = Math.max(1, parseInt(page) || 1)
    const l = Math.max(1, parseInt(limit) || 10)

    const where = {
      status: 'AVAILABLE',
      name: { [Op.like]: `%${q.trim()}%` },
    }

    if (min_price !== undefined || max_price !== undefined) {
      where.price = {}
      if (min_price !== undefined) where.price[Op.gte] = Number(min_price)
      if (max_price !== undefined) where.price[Op.lte] = Number(max_price)
    }

    const { count, rows } = await Foods.findAndCountAll({
      where,
      include: [
        {
          model: Categories,
          as: 'category',
          attributes: ['id', 'name', 'restaurant_id'],
          include: [
            {
              model: Restaurants,
              as: 'restaurant',
              where: { status: 'OPEN' },
              attributes: ['id', 'name', 'address', 'image'],
            },
          ],
        },
      ],
      order: [['price', 'ASC']],
      limit: l,
      offset: (p - 1) * l,
      distinct: true,
    })

    sendSuccess(res, `Tìm thấy ${count} món ăn`, rows, {
      page: p,
      limit: l,
      total: count,
      totalPages: Math.ceil(count / l),
    })
  } catch (err) { next(err) }
})

export default router
